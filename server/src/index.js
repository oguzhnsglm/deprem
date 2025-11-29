const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const gdal = require('gdal-async');
const turf = require('@turf/turf');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const PORT = process.env.VS30_PORT || 4000;
const DATASET_PATH = process.env.VS30_DATASET || path.resolve(__dirname, '..', 'global_vs30.grd');
const FAULTS_DATASET_PATH =
  process.env.FAULTS_DATASET ||
  path.resolve(__dirname, 'data', 'faults.geojson', 'faults.geojson');

const app = express();
app.use(cors());

let dataset;
let band;
let geoTransform;
let noDataValue = null;
let faultSegments = [];

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

function loadFaults() {
  if (!fs.existsSync(FAULTS_DATASET_PATH)) {
    console.warn(`[Faults] Veri bulunamadı: ${FAULTS_DATASET_PATH}`);
    return;
  }

  try {
    const raw = fs.readFileSync(FAULTS_DATASET_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.type !== 'FeatureCollection' || !Array.isArray(parsed.features)) {
      console.warn('[Faults] GeoJSON FeatureCollection bekleniyordu.');
      return;
    }
    faultSegments = parsed.features
      .filter((feature) => feature?.geometry)
      .map((feature) => ({
        feature,
        bbox: turf.bbox(feature),
      }));
    console.log(`[Faults] Veri yüklendi: ${faultSegments.length} segment.`);
  } catch (error) {
    console.error('[Faults] Veri yüklenemedi:', error);
    faultSegments = [];
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

function scoreForDistance(distanceKm) {
  let proximityScore = 10;
  if (distanceKm <= 2) {
    proximityScore = 95;
  } else if (distanceKm <= 5) {
    proximityScore = 80;
  } else if (distanceKm <= 10) {
    proximityScore = 60;
  } else if (distanceKm <= 25) {
    proximityScore = 30;
  }

  let level = 'Çok Düşük';
  if (proximityScore >= 85) {
    level = 'Çok Yüksek';
  } else if (proximityScore >= 70) {
    level = 'Yüksek';
  } else if (proximityScore >= 45) {
    level = 'Orta';
  } else if (proximityScore >= 20) {
    level = 'Düşük';
  }

  return { proximityScore, level };
}

function getFaultDistanceInfo(lat, lon) {
  if (!faultSegments.length) {
    return null;
  }
  const queryPoint = turf.point([lon, lat]);
  let closestDistance = Infinity;

  faultSegments.forEach((segment) => {
    try {
      const snapped = turf.nearestPointOnLine(segment.feature, queryPoint);
      const distance = turf.distance(queryPoint, snapped, { units: 'kilometers' });
      if (distance < closestDistance) {
        closestDistance = distance;
      }
    } catch (error) {
      console.warn('[Faults] Segment hesabı başarısız oldu:', error?.message || error);
    }
  });

  if (!Number.isFinite(closestDistance)) {
    return null;
  }

  const rounded = Number(closestDistance.toFixed(2));
  const { proximityScore, level } = scoreForDistance(rounded);

  return {
    distance_km: rounded,
    proximity_score: proximityScore,
    level,
    note: 'Bilgilendirme amaçlıdır; deprem olasılığı tahmini değildir.',
  };
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

app.get('/api/fault-distance', (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lon = parseFloat(req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: 'lat ve lon sayısal olmalıdır.' });
  }

  if (!faultSegments.length) {
    return res.status(503).json({ error: 'Fay verisi henüz yüklenmedi.' });
  }

  const result = getFaultDistanceInfo(lat, lon);
  if (!result) {
    return res.status(500).json({ error: 'Fay mesafesi hesaplanamadı.' });
  }

  return res.json({
    lat,
    lon,
    ...result,
  });
});

app.get('/', (_req, res) => {
  res.json({ status: 'ok', info: 'Use /vs30?lat=..&lon=..' });
});

app.listen(PORT, '0.0.0.0', () => {
  loadRaster();
  loadFaults();
  console.log(`[VS30] API listening on http://0.0.0.0:${PORT}`);
});
