const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const gdal = require('gdal-async');

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const PORT = process.env.VS30_PORT || 4000;
const DATASET_PATH = process.env.VS30_DATASET || path.resolve(__dirname, '..', 'global_vs30.grd');

const app = express();
app.use(cors());

let dataset;
let band;
let geoTransform;
let noDataValue = null;

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

app.get('/', (_req, res) => {
  res.json({ status: 'ok', info: 'Use /vs30?lat=..&lon=..' });
});

app.listen(PORT, () => {
  loadRaster();
  console.log(`[VS30] API listening on http://localhost:${PORT}`);
});
