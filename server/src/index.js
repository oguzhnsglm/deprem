const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const gdal = require('gdal-async');
const sharp = require('sharp');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const PORT = process.env.VS30_PORT || 4000;
const DATASET_PATH = process.env.VS30_DATASET || path.resolve(__dirname, '..', 'global_vs30.grd');
const FAULTS_DATASET_PATH =
  process.env.FAULTS_DATASET || path.resolve(__dirname, 'data', 'gem_active_faults.geojson');

const HAZARD_TIFF_PATH =
  process.env.HAZARD_TIFF || path.resolve(__dirname, 'data', 'v2023_1_pga_475_rock_3min.tif');
const LOCAL_TILES_DIR = path.resolve(__dirname, '..', 'static', 'tiles', 'hazard');
const TILE_ZOOM = 6; // ~22 km/piksel — şehir ölçeğinde yeterli

const app = express();
app.use(cors());

// ── Yerel GEM hazard tile'ları ─────────────────────────────────────────────
const HAZARD_TILES_DIR = path.resolve(__dirname, '..', 'static', 'tiles', 'hazard');
app.use('/tiles/hazard', express.static(HAZARD_TILES_DIR));

// ── Vs30 raster ────────────────────────────────────────────────────────────

let dataset, band, geoTransform, noDataValue = null;
let faultLines = [];

// GEM hazard raster (yerel GeoTIFF)
let hazardDataset = null, hazardBand = null, hazardGeoTransform = null;

function loadRaster() {
  if (!fs.existsSync(DATASET_PATH)) {
    console.error(`[VS30] Raster bulunamadı: ${DATASET_PATH}`);
    return;
  }
  try {
    dataset = gdal.open(DATASET_PATH);
    band = dataset.bands.get(1);
    geoTransform = dataset.geoTransform;
    noDataValue = band.noDataValue ?? null;
    console.log('[VS30] Raster yüklendi:', { size: { width: dataset.rasterSize.x, height: dataset.rasterSize.y } });
  } catch (e) {
    console.error('[VS30] Raster yüklenemedi:', e);
  }
}

function loadHazardRaster() {
  if (!fs.existsSync(HAZARD_TIFF_PATH)) {
    console.log('[Hazard] Yerel GeoTIFF bulunamadı, canlı tile kullanılacak.');
    return;
  }
  try {
    hazardDataset = gdal.open(HAZARD_TIFF_PATH);
    hazardBand = hazardDataset.bands.get(1);
    hazardGeoTransform = hazardDataset.geoTransform;
    console.log('[Hazard] GeoTIFF yüklendi:', HAZARD_TIFF_PATH);
  } catch (e) {
    console.warn('[Hazard] GeoTIFF yüklenemedi:', e.message);
  }
}

function latLonToPixel(lat, lon, gt, bnd, ds) {
  if (!gt || !bnd) return null;
  const [ox, pw, rx, oy, ry, ph] = gt;
  const denom = pw * ph - rx * ry;
  if (!denom) return null;
  const relX = lon - ox, relY = lat - oy;
  const px = Math.floor((ph * relX - rx * relY) / denom);
  const py = Math.floor((-ry * relX + pw * relY) / denom);
  const w = bnd.size?.x ?? ds?.rasterSize?.x ?? 0;
  const h = bnd.size?.y ?? ds?.rasterSize?.y ?? 0;
  if (isNaN(px) || isNaN(py) || px < 0 || py < 0 || px >= w || py >= h) return null;
  return { x: px, y: py };
}

// ── Tile koordinat hesabı ──────────────────────────────────────────────────

function latLonToTilePixel(lat, lon, zoom) {
  const n = Math.pow(2, zoom);
  const tileX = Math.floor((lon + 180) / 360 * n);
  const latRad = lat * Math.PI / 180;
  const mercY = Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI;
  const tileY = Math.floor((1 - mercY) / 2 * n);
  const fracX = (lon + 180) / 360 * n - tileX;
  const fracY = (1 - mercY) / 2 * n - tileY;
  return {
    tileX, tileY,
    pixelX: Math.min(255, Math.max(0, Math.floor(fracX * 256))),
    pixelY: Math.min(255, Math.max(0, Math.floor(fracY * 256))),
  };
}

// ── RGB → Sismik Tehlike Skoru (0-100) ────────────────────────────────────
// GEM hazard tile renk skalası: beyaz/mavi=düşük, sarı=orta, turuncu=yüksek, kırmızı=çok yüksek

function rgbToHazardScore(r, g, b) {
  const rN = r / 255, gN = g / 255, bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const lightness = (max + min) / 2;
  const delta = max - min;

  // Tamamen beyaz (okyanus/no-data) veya renksiz gri → veri yok
  // Not: eşiği 0.96'ya çektik — GEM'in açık mavi düşük-tehlike renkleri (lightness ~0.91)
  // artık null dönmüyor, düşük skor olarak hesaplanıyor.
  if (lightness > 0.96 || delta < 0.04) return null;

  // Hue hesabı
  let hue = 0;
  if (delta > 0) {
    if (max === rN)      hue = 60 * (((gN - bN) / delta) % 6);
    else if (max === gN) hue = 60 * ((bN - rN) / delta + 2);
    else                 hue = 60 * ((rN - gN) / delta + 4);
    if (hue < 0) hue += 360;
  }

  // Saturation — açık (pastel) renkler düşük sat verir, onu da skora yansıtıyoruz
  const sat = max > 0 ? delta / max : 0;

  // GEM renk skalası → skor
  // Açık maviler sat düşük → düşük skor (3-20); koyu kırmızılar sat yüksek → yüksek skor
  if (hue >= 190 && hue <= 260) return Math.max(3, Math.round(3  + sat * 17));  // mavi → 3-20
  if (hue >= 150 && hue <  190) return Math.round(8  + sat * 17);               // teal/cyan → 8-25
  if (hue >= 80  && hue <  150) return Math.round(12 + sat * 18);               // yeşil → 12-30
  if (hue >= 55  && hue <   80) return Math.round(28 + sat * 22);               // sarı-yeşil → 28-50
  if (hue >= 35  && hue <   55) return Math.round(48 + sat * 22);               // sarı-turuncu → 48-70
  if (hue >= 15  && hue <   35) return Math.round(65 + sat * 20);               // turuncu → 65-85
  // kırmızı (hue < 15 veya > 330)
  const darkness = 1 - lightness;
  return Math.round(78 + darkness * 22);                                         // kırmızı → 78-100
}

// ── Tile'dan hazard skoru çek ──────────────────────────────────────────────

// Basit bellek önbelleği: aynı tile tekrar indirilmesin
const tileCache = new Map();
const TILE_CACHE_MAX = 200;

async function getGEMTileScore(lat, lon) {
  // Yerel GeoTIFF varsa ondan oku
  if (hazardBand && hazardGeoTransform) {
    try {
      const px = latLonToPixel(lat, lon, hazardGeoTransform, hazardBand, hazardDataset);
      if (px) {
        const rawPGA = hazardBand.pixels.get(px.x, px.y);
        if (rawPGA != null && rawPGA > 0) {
          // PGA genellikle g cinsinden (0-2g arası). 0.5g = 100 skor olarak normalize et.
          const score = Math.min(100, Math.round((rawPGA / 0.5) * 100));
          return { score, source: 'local-tiff', pga: rawPGA };
        }
      }
    } catch (e) {
      console.warn('[Hazard] GeoTIFF okuma hatası:', e.message);
    }
  }

  // Yerel indirilen tile'lardan oku
  try {
    const { tileX, tileY, pixelX, pixelY } = latLonToTilePixel(lat, lon, TILE_ZOOM);
    const cacheKey = `${TILE_ZOOM}/${tileX}/${tileY}`;

    let rgb;
    if (tileCache.has(cacheKey)) {
      rgb = tileCache.get(cacheKey);
    } else {
      const tilePath = path.join(LOCAL_TILES_DIR, String(TILE_ZOOM), String(tileX), `${tileY}.png`);
      if (!fs.existsSync(tilePath)) return null;

      const tileDs = await gdal.openAsync(tilePath);
      const bands = tileDs.bands.count();
      const tileBandR = tileDs.bands.get(1);
      const tileBandG = bands >= 3 ? tileDs.bands.get(2) : tileBandR;
      const tileBandB = bands >= 3 ? tileDs.bands.get(3) : tileBandR;

      const rData = tileBandR.pixels.read(0, 0, 256, 256);
      const gData = tileBandG.pixels.read(0, 0, 256, 256);
      const bData = tileBandB.pixels.read(0, 0, 256, 256);
      tileDs.close();

      rgb = { r: rData, g: gData, b: bData };
      if (tileCache.size >= TILE_CACHE_MAX) {
        tileCache.delete(tileCache.keys().next().value);
      }
      tileCache.set(cacheKey, rgb);
    }

    const idx = pixelY * 256 + pixelX;
    const score = rgbToHazardScore(rgb.r[idx], rgb.g[idx], rgb.b[idx]);
    return { score, source: 'local-tile', pga: null };
  } catch (e) {
    console.warn('[Hazard] Yerel tile okunamadı:', e.message);
    return null;
  }
}

// ── Vs30 endpoint ──────────────────────────────────────────────────────────

function classifyVs30(v) {
  if (v >= 1500) return 'A'; if (v >= 760) return 'B';
  if (v >= 360)  return 'C'; if (v >= 180) return 'D';
  return 'E';
}

app.get('/vs30', (req, res) => {
  if (!band) return res.status(503).json({ error: 'Vs30 raster henüz yüklenmedi.' });
  const lat = parseFloat(req.query.lat), lon = parseFloat(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon))
    return res.status(400).json({ error: 'lat ve lon geçerli sayılar olmalıdır.' });
  const pixel = latLonToPixel(lat, lon, geoTransform, band, dataset);
  if (!pixel) return res.json({ lat, lon, vs30: null, soilClass: null, unit: 'm/s' });
  const value = band.pixels.get(pixel.x, pixel.y);
  const vs30 = value === noDataValue || value === undefined ? null : Number(value.toFixed(2));
  return res.json({ lat, lon, vs30, soilClass: vs30 != null ? classifyVs30(vs30) : null, unit: 'm/s' });
});

// ── Fay verileri ───────────────────────────────────────────────────────────

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371, d2r = Math.PI / 180;
  const dLat = (lat2 - lat1) * d2r, dLon = (lon2 - lon1) * d2r;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

function loadFaults() {
  try {
    if (!fs.existsSync(FAULTS_DATASET_PATH)) {
      console.warn('[Faults] Dataset bulunamadı:', FAULTS_DATASET_PATH); return;
    }
    const json = JSON.parse(fs.readFileSync(FAULTS_DATASET_PATH, 'utf8'));
    faultLines = [];
    (json.features || []).forEach((f) => {
      const geom = f?.geometry;
      if (!geom) return;
      if (geom.type === 'LineString')
        faultLines.push({ coordinates: geom.coordinates, properties: f.properties || {} });
      else if (geom.type === 'MultiLineString')
        geom.coordinates.forEach((line) =>
          faultLines.push({ coordinates: line, properties: f.properties || {} }));
    });
    console.log(`[Faults] Yüklendi: ${faultLines.length} hat`);
  } catch (e) {
    console.error('[Faults] Yüklenemedi:', e); faultLines = [];
  }
}

app.get('/api/faults-geojson', (req, res) => {
  if (!fs.existsSync(FAULTS_DATASET_PATH)) return res.status(404).json({ error: 'Data not found' });
  try {
    const json = JSON.parse(fs.readFileSync(FAULTS_DATASET_PATH, 'utf8'));
    const filtered = (json.features || []).filter((f) => {
      const geom = f?.geometry;
      if (!geom?.coordinates) return false;
      let pt = geom.type === 'LineString' ? geom.coordinates[0]
             : geom.type === 'MultiLineString' ? geom.coordinates[0]?.[0] : null;
      if (!pt) return false;
      const [lon, lat] = pt;
      return lon >= 25 && lon <= 45 && lat >= 35 && lat <= 43;
    });
    res.json({ type: 'FeatureCollection', features: filtered });
  } catch (e) { res.status(500).json({ error: 'Filter fail' }); }
});

app.get('/api/fault-lines', (req, res) => {
  if (!faultLines.length) return res.status(503).json({ error: 'Fay datası yüklenmedi.' });
  const { minLat, maxLat, minLon, maxLon } = req.query;
  const hasBbox = [minLat, maxLat, minLon, maxLon].every((v) => Number.isFinite(parseFloat(v)));
  const pad = hasBbox ? (parseFloat(maxLon) - parseFloat(minLon)) * 0.3 : 0;
  const bounds = hasBbox
    ? { minLat: parseFloat(minLat)-pad, maxLat: parseFloat(maxLat)+pad, minLon: parseFloat(minLon)-pad, maxLon: parseFloat(maxLon)+pad }
    : { minLat: 35, maxLat: 43, minLon: 25, maxLon: 45 };
  const lines = faultLines
    .filter((f) => f.coordinates.some(([lon, lat]) =>
      lat >= bounds.minLat && lat <= bounds.maxLat && lon >= bounds.minLon && lon <= bounds.maxLon))
    .map((f, i) => ({
      id: String(i), name: f.properties.name || f.properties.fault_name || '',
      coords: f.coordinates.filter(([ln, lt]) => isFinite(ln) && isFinite(lt))
                           .map(([ln, lt]) => ({ latitude: lt, longitude: ln })),
    }))
    .filter((l) => l.coords.length >= 2);
  res.json({ count: lines.length, lines });
});

// ── Sismik Risk Analizi ────────────────────────────────────────────────────

app.get('/api/fault-distance', async (req, res) => {
  const lat = parseFloat(req.query.lat), lon = parseFloat(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon))
    return res.status(400).json({ error: 'lat ve lon geçerli olmalıdır.' });
  if (!faultLines.length)
    return res.status(503).json({ error: 'Fay datası bulunamadı.' });

  // ── En tehlikeli aktif fay (150 km yarıçap içinde) ──
  // Sadece en yakın değil, hazardProxy'si en yüksek fayı seçiyoruz.
  // Örnek: 2 km'de 0.3 mm/yıl fay vs 8 km'de 15 mm/yıl fay → ikincisi daha tehlikeli.
  const SEARCH_RADIUS_KM = 150;
  const extractNum = (s) => { const m = String(s||'').match(/\(?([\d.]+)/); return m ? parseFloat(m[1]) : null; };

  let bestKm = Infinity, bestProps = {}, bestHazard = -1;
  faultLines.forEach((f) => {
    // Fay segmentinin en yakın noktasını bul
    let segMinKm = Infinity;
    f.coordinates.forEach(([fx, fy]) => {
      if (isFinite(fx) && isFinite(fy)) {
        const d = haversineKm(lat, lon, fy, fx);
        if (d < segMinKm) segMinKm = d;
      }
    });
    if (!isFinite(segMinKm) || segMinKm > SEARCH_RADIUS_KM) return;

    const slip    = extractNum(f.properties.net_slip_rate) || 1.0;
    const aRate   = Math.min(1.0, slip / 23);
    const decay   = 30 + 30 * aRate;
    const proxy   = aRate * Math.exp(-segMinKm / decay);

    if (proxy > bestHazard) {
      bestHazard  = proxy;
      bestKm      = segMinKm;
      bestProps   = f.properties;
    }
  });

  // Yarıçap içinde hiç fay yoksa en yakına düş
  if (bestHazard < 0) {
    faultLines.forEach((f) => {
      f.coordinates.forEach(([fx, fy]) => {
        if (isFinite(fx) && isFinite(fy)) {
          const d = haversineKm(lat, lon, fy, fx);
          if (d < bestKm) { bestKm = d; bestProps = f.properties; }
        }
      });
    });
  }

  if (!isFinite(bestKm)) return res.status(503).json({ error: 'Mesafe hesaplanamadı.' });

  const minKm    = bestKm;
  const slipRate = extractNum(bestProps.net_slip_rate) || 1.0;
  const depthKm  = extractNum(bestProps.lower_seis_depth) || 10;

  // ── Skor 1: Kayma-ağırlıklı mesafe ──
  // Dormant bir yerel fay ile aktif NAF (23 mm/yıl) aynı mesafede çok farklı tehlike üretir.
  // Kayma hızını "efektif mesafeye" dönüştür: yavaş fay = çok uzak hissettir.
  // ── PSHA-proxy formülü ──────────────────────────────────────────────────
  // Bilimsel temel: yıllık sismik moment oranı ∝ kayma_hızı × fay_alanı
  // Dolayısıyla deprem frekansı ∝ kayma_hızı (Youngs-Coppersmith modeli).
  //
  // activityRate: NAF (23 mm/yıl) = 1.0 referans normalize değer
  // decayKm: daha aktif fay → daha büyük deprem → daha geniş etki yarıçapı
  //          (30 km dormant, 60 km NAF sınıfı — tipik GMPE e-fold mesafesi)
  // hazardProxy: activityRate × mesafe_zayıflaması çarpımı
  // faultScore: 1 − exp(−hazardProxy × k) dönüşümü → 0-100 aralığına taşır
  //   • NAF at 0 km → ~98
  //   • Dinar fayı (3.7mm/yr) at 1.7 km → ~42
  //   • Dormant (0.1mm/yr) at 2 km → ~3 (floor)
  const activityRate = Math.min(1.0, slipRate / 23);
  // decayKm: e-fold mesafesi. Küçüldükçe mesafe etkisi artar.
  // Dormant fay (activityRate→0): decay 20 km → uzak dormant fay zaten düşük skor
  // NAF sınıfı (activityRate=1): decay 40 km → 100 km'de faultScore ~8
  const decayKm      = 20 + 20 * activityRate;                     // 20–40 km
  const distAtten    = Math.exp(-minKm / decayKm);
  const hazardProxy  = activityRate * distAtten;
  const faultScore   = Math.max(3, Math.round(100 * (1 - Math.exp(-hazardProxy * 4))));

  // ── Skor 2: GEM tile'dan bölgesel PGA tehlikesi ──
  const tileResult = await getGEMTileScore(lat, lon);
  const tileScore = tileResult?.score ?? null;

  // ── Birleşik Sismik Risk Skoru ──
  // Tile verisi varsa: %50 fay mesafesi + %50 bölgesel tehlike
  // Tile yoksa: sadece fay mesafesi
  const seismicRiskScore = tileScore != null
    ? Math.min(100, Math.round(faultScore * 0.5 + tileScore * 0.5))
    : Math.min(100, faultScore);

  const levelLabel =
    seismicRiskScore >= 80 ? 'Çok Yüksek' :
    seismicRiskScore >= 60 ? 'Yüksek' :
    seismicRiskScore >= 35 ? 'Orta' :
    seismicRiskScore >= 15 ? 'Düşük' : 'Çok Düşük';

  const slipDesc =
    slipRate >= 20 ? 'çok hızlı (NAF sınıfı)' :
    slipRate >= 10 ? 'hızlı' :
    slipRate >=  5 ? 'orta hız' :
    slipRate >=  1 ? 'yavaş' : 'çok yavaş / pasif';

  return res.json({
    // Ana skor
    proximity_score: seismicRiskScore,   // geriye dönük uyumluluk için aynı isim
    seismic_risk_score: seismicRiskScore,
    level: levelLabel,

    // Bileşenler
    distance_km: parseFloat(minKm.toFixed(1)),
    fault_score: faultScore,
    regional_hazard_score: tileScore,
    regional_hazard_source: tileResult?.source ?? null,

    // Fay detayları
    slip_rate_mm_per_year: slipRate,
    depth_km: depthKm,

    note: tileScore != null
      ? `Fay bileşeni: ${faultScore}/100 (en yakın aktif fay ${minKm.toFixed(1)} km, ${slipDesc}). Bölgesel tehlike: ${tileScore}/100 (GEM PGA haritası).`
      : `En yakın aktif fay ${minKm.toFixed(1)} km uzakta (${slipDesc}). Kayma hızı: ${slipRate} mm/yıl.`,
  });
});

// ── GeoTIFF'ten smooth hazard tile üretimi ────────────────────────────────
// PNG tile'lardaki hexagon görünümü yerine GeoTIFF PGA değerlerinden
// smooth renk gradyanı oluşturur.

function pgaToRGBA(pga) {
  if (!pga || pga <= 0) return null;
  // stops: [pga_g, r, g, b, alpha]
  const stops = [
    [0.005, 180, 220, 255, 100],
    [0.02,  120, 180, 255, 160],
    [0.05,  60,  150, 240, 190],
    [0.1,   50,  210, 180, 210],
    [0.2,   80,  210, 70,  225],
    [0.3,   190, 225, 30,  235],
    [0.5,   255, 185, 0,   240],
    [0.8,   255, 90,  0,   248],
    [1.2,   215, 0,   0,   252],
    [2.0,   130, 0,   0,   255],
  ];
  if (pga < stops[0][0]) return null;
  const last = stops[stops.length - 1];
  if (pga >= last[0]) return [last[1], last[2], last[3], last[4]];
  for (let i = 1; i < stops.length; i++) {
    if (pga <= stops[i][0]) {
      const t = (pga - stops[i-1][0]) / (stops[i][0] - stops[i-1][0]);
      return [
        Math.round(stops[i-1][1] + t * (stops[i][1] - stops[i-1][1])),
        Math.round(stops[i-1][2] + t * (stops[i][2] - stops[i-1][2])),
        Math.round(stops[i-1][3] + t * (stops[i][3] - stops[i-1][3])),
        Math.round(stops[i-1][4] + t * (stops[i][4] - stops[i-1][4])),
      ];
    }
  }
  return null;
}

function tileToBounds(z, x, y) {
  const n = Math.pow(2, z);
  const west  = x / n * 360 - 180;
  const east  = (x + 1) / n * 360 - 180;
  const north = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
  const south = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
  return { west, east, north, south };
}

const hazardTileCache = new Map();
const HAZARD_TILE_CACHE_MAX = 800;

app.get('/tiles/hazard-tiff/:z/:x/:y.png', async (req, res) => {
  const z = parseInt(req.params.z);
  const x = parseInt(req.params.x);
  const y = parseInt(req.params.y);
  if (isNaN(z) || isNaN(x) || isNaN(y)) return res.status(400).end();

  const cacheKey = `${z}/${x}/${y}`;
  if (hazardTileCache.has(cacheKey)) {
    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    return res.send(hazardTileCache.get(cacheKey));
  }

  if (!hazardBand || !hazardGeoTransform) {
    return res.status(503).end();
  }

  try {
    const { west, east, north, south } = tileToBounds(z, x, y);
    const gt = hazardGeoTransform;
    const rW = hazardDataset.rasterSize.x;
    const rH = hazardDataset.rasterSize.y;

    const px1 = Math.max(0, Math.floor((west  - gt[0]) / gt[1]));
    const px2 = Math.min(rW, Math.ceil ((east  - gt[0]) / gt[1]));
    const py1 = Math.max(0, Math.floor((north - gt[3]) / gt[5]));
    const py2 = Math.min(rH, Math.ceil ((south - gt[3]) / gt[5]));

    const readW = Math.max(1, px2 - px1);
    const readH = Math.max(1, py2 - py1);
    const noData = hazardBand.noDataValue ?? -9999;

    const data = hazardBand.pixels.read(px1, py1, readW, readH);

    const SIZE = 256;
    const rgba = Buffer.alloc(SIZE * SIZE * 4, 0);

    // Bilinear interpolation: 4 komşu pikseli ağırlıklı blend et
    // Nearest-neighbor'a kıyasla çok daha smooth geçişler sağlar
    const getSample = (fx, fy) => {
      const x0 = Math.max(0, Math.min(readW - 1, Math.floor(fx)));
      const x1 = Math.max(0, Math.min(readW - 1, x0 + 1));
      const y0 = Math.max(0, Math.min(readH - 1, Math.floor(fy)));
      const y1 = Math.max(0, Math.min(readH - 1, y0 + 1));
      const tx = fx - x0, ty = fy - y0;
      const v00 = data[y0 * readW + x0];
      const v10 = data[y0 * readW + x1];
      const v01 = data[y1 * readW + x0];
      const v11 = data[y1 * readW + x1];
      // Geçersiz pikselleri 0 say
      const safe = (v) => (v && v !== noData && v > 0) ? v : 0;
      return (1-tx)*(1-ty)*safe(v00) + tx*(1-ty)*safe(v10) +
             (1-tx)*ty   *safe(v01) + tx*ty    *safe(v11);
    };

    for (let ty = 0; ty < SIZE; ty++) {
      for (let tx = 0; tx < SIZE; tx++) {
        const fx = (tx + 0.5) / SIZE * readW - 0.5;
        const fy = (ty + 0.5) / SIZE * readH - 0.5;
        const pga = getSample(fx, fy);
        if (pga > 0) {
          const color = pgaToRGBA(pga);
          if (color) {
            const o = (ty * SIZE + tx) * 4;
            rgba[o] = color[0]; rgba[o+1] = color[1];
            rgba[o+2] = color[2]; rgba[o+3] = color[3];
          }
        }
      }
    }

    const png = await sharp(rgba, { raw: { width: SIZE, height: SIZE, channels: 4 } })
      .png({ compressionLevel: 6 })
      .toBuffer();

    if (hazardTileCache.size >= HAZARD_TILE_CACHE_MAX) {
      hazardTileCache.delete(hazardTileCache.keys().next().value);
    }
    hazardTileCache.set(cacheKey, png);

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(png);
  } catch (e) {
    console.error('[HazardTile]', e.message);
    res.status(500).end();
  }
});

app.listen(PORT, () => {
  loadRaster();
  loadHazardRaster();
  loadFaults();
  console.log(`[VS30] API listening on http://localhost:${PORT}`);
});
