const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const gdal = require('gdal-async');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const PORT = process.env.VS30_PORT || 4000;
const DATASET_PATH = process.env.VS30_DATASET || path.resolve(__dirname, '..', 'global_vs30.grd');
const FAULTS_DATASET_PATH =
  process.env.FAULTS_DATASET || path.resolve(__dirname, 'data', 'gem_active_faults.geojson');

const app = express();
app.use(cors());

let dataset;
let band;
let geoTransform;
let noDataValue = null;
let faultLines = [];

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

    console.log('[VS30] Raster yüklendi:', {
      size: { width: dataset.rasterSize.x, height: dataset.rasterSize.y },
      noDataValue,
    });
  } catch (error) {
    console.error('[VS30] Raster yüklenemedi:', error);
  }
}

function latLonToPixel(lat, lon) {
  if (!geoTransform || !band) {
    return null;
  }

  const [originX, pixelWidth, rotationX, originY, rotationY, pixelHeight] = geoTransform;
  const denominator = pixelWidth * pixelHeight - rotationX * rotationY;

  if (!denominator) {
    return null;
  }

  const relX = lon - originX;
  const relY = lat - originY;

  const pixelX = (pixelHeight * relX - rotationX * relY) / denominator;
  const pixelY = (-rotationY * relX + pixelWidth * relY) / denominator;

  const x = Math.floor(pixelX);
  const y = Math.floor(pixelY);
  const width = band.size?.x ?? dataset?.rasterSize?.x ?? 0;
  const height = band.size?.y ?? dataset?.rasterSize?.y ?? 0;

  if (
    Number.isNaN(x) ||
    Number.isNaN(y) ||
    x < 0 ||
    y < 0 ||
    x >= width ||
    y >= height
  ) {
    return null;
  }

  return { x, y };
}

function classifyVs30(value) {
  if (value == null || Number.isNaN(value)) {
    return null;
  }
  if (value >= 1500) return 'A';
  if (value >= 760) return 'B';
  if (value >= 360) return 'C';
  if (value >= 180) return 'D';
  return 'E';
}

app.get('/vs30', (req, res) => {
  if (!band) {
    return res.status(503).json({ error: 'Vs30 raster henüz yüklenmedi.' });
  }

  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat ve lon geçerli sayılar olmalıdır.' });
  }

  const pixel = latLonToPixel(lat, lon);
  if (!pixel) {
    return res.json({ lat, lon, vs30: null, soilClass: null, unit: 'm/s' });
  }

  const value = band.pixels.get(pixel.x, pixel.y);
  const vs30 = value === noDataValue || value === undefined ? null : Number(value.toFixed(2));
  const soilClass = vs30 != null ? classifyVs30(vs30) : null;

  return res.json({ lat, lon, vs30, soilClass, unit: 'm/s' });
});

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

function loadFaults() {
  try {
    if (!fs.existsSync(FAULTS_DATASET_PATH)) {
      console.warn('[Faults] Dataset bulunamadŽñ:', FAULTS_DATASET_PATH);
      return;
    }
    const raw = fs.readFileSync(FAULTS_DATASET_PATH, 'utf8');
    const json = JSON.parse(raw);
    const features = Array.isArray(json.features) ? json.features : [];
    faultLines = [];
    features.forEach((f) => {
      const geom = f?.geometry;
      if (!geom) return;
      if (geom.type === 'LineString' && Array.isArray(geom.coordinates)) {
        faultLines.push(geom.coordinates);
      } else if (geom.type === 'MultiLineString' && Array.isArray(geom.coordinates)) {
        geom.coordinates.forEach((line) => faultLines.push(line));
      }
    });
    console.log(`[Faults] YÇ¬klendi: ${faultLines.length} hat parÇasŽñ`);
  } catch (error) {
    console.error('[Faults] YÇ¬klenemedi:', error);
    faultLines = [];
  }
}

app.get('/api/fault-distance', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat ve lon geÇõerli olmalŽñdŽñr.' });
  }
  if (!faultLines.length) {
    return res.status(503).json({ error: 'Fay datasŽñ bulunamadŽñ veya yÇ¬klenemedi.' });
  }

  let minKm = Infinity;
  faultLines.forEach((line) => {
    line.forEach(([fx, fy]) => {
      if (Number.isFinite(fx) && Number.isFinite(fy)) {
        const d = haversineKm(lat, lon, fy, fx); // geojson lon,lat
        if (d < minKm) {
          minKm = d;
        }
      }
    });
  });

  if (!Number.isFinite(minKm)) {
    return res.status(503).json({ error: 'Fay mesafesi hesaplanamadŽñ.' });
  }

  return res.json({
    distance_km: minKm,
    proximity_score: Math.max(0, Math.min(100, Math.round(100 - minKm))),
    level: minKm > 100 ? 'Dusuk' : minKm > 50 ? 'Orta' : 'Yuksek',
    note: 'Hesaplama en yakŽñn fay segmentine yaklak mesafedir.',
  });
});

app.listen(PORT, () => {
  loadRaster();
  loadFaults();
  console.log(`[VS30] API listening on http://localhost:${PORT}`);
});
