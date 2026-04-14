/**
 * GEM Sismik Tehlike Tile İndirici
 * Zoom 0-6 arası tüm dünya tile'larını indirir (~5500 tile, ~40-60 MB)
 * Kullanım: node download_hazard_tiles.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const TILE_BASE = 'https://maps.openquake.org/mapproxy/ghm_2023_pop_places_refactored_npbg2/wmts/v-20231/webmercator';
const OUT_DIR = path.join(__dirname, 'static', 'tiles', 'hazard');
const MAX_ZOOM = 8;       // 0-8 arası = 87381 tile, ~430MB, şehir ölçeğinde akıcı
const CONCURRENCY = 12;   // Aynı anda kaç tile indirilecek
const RETRY_COUNT = 3;
const DELAY_MS = 50;      // Tile başına bekleme (server'a saygı)

// Toplam tile sayısı hesabı
let totalTiles = 0;
for (let z = 0; z <= MAX_ZOOM; z++) totalTiles += Math.pow(4, z);
let downloaded = 0, skipped = 0, failed = 0;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function downloadTile(z, x, y, retries = RETRY_COUNT) {
  return new Promise((resolve) => {
    const dir = path.join(OUT_DIR, String(z), String(x));
    const filePath = path.join(dir, `${y}.png`);

    if (fs.existsSync(filePath)) {
      skipped++;
      resolve();
      return;
    }

    fs.mkdirSync(dir, { recursive: true });
    const url = `${TILE_BASE}/${z}/${x}/${y}.png`;

    const req = https.get(url, { timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) {
        res.destroy();
        if (retries > 0) {
          setTimeout(() => downloadTile(z, x, y, retries - 1).then(resolve), 1000);
        } else {
          failed++;
          resolve();
        }
        return;
      }
      const out = fs.createWriteStream(filePath);
      res.pipe(out);
      out.on('finish', () => {
        downloaded++;
        resolve();
      });
      out.on('error', () => { failed++; resolve(); });
    });

    req.on('error', () => {
      if (retries > 0) {
        setTimeout(() => downloadTile(z, x, y, retries - 1).then(resolve), 1000);
      } else {
        failed++;
        resolve();
      }
    });

    req.on('timeout', () => {
      req.destroy();
      if (retries > 0) {
        setTimeout(() => downloadTile(z, x, y, retries - 1).then(resolve), 1000);
      } else {
        failed++;
        resolve();
      }
    });
  });
}

async function run() {
  console.log(`GEM Hazard Tile İndirici`);
  console.log(`Hedef: ${OUT_DIR}`);
  console.log(`Zoom: 0 - ${MAX_ZOOM} | Toplam tile: ${totalTiles}`);
  console.log(`Eşzamanlılık: ${CONCURRENCY}\n`);

  const startTime = Date.now();
  let queue = [];

  for (let z = 0; z <= MAX_ZOOM; z++) {
    const n = Math.pow(2, z);
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        queue.push({ z, x, y });
      }
    }
  }

  // Paralel indirme
  let i = 0;
  const interval = setInterval(() => {
    const done = downloaded + skipped + failed;
    const pct = Math.round(done / totalTiles * 100);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    process.stdout.write(`\r${pct}% | ${done}/${totalTiles} | ✓${downloaded} ↷${skipped} ✗${failed} | ${elapsed}s`);
  }, 500);

  while (i < queue.length) {
    const batch = queue.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(({ z, x, y }) => downloadTile(z, x, y)));
    await sleep(DELAY_MS);
    i += CONCURRENCY;
  }

  clearInterval(interval);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n\nTamamlandı!`);
  console.log(`İndirilen: ${downloaded} | Atlandı: ${skipped} | Hata: ${failed}`);
  console.log(`Süre: ${elapsed}s`);

  // Toplam boyut
  let totalBytes = 0;
  const walkDir = (dir) => {
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f);
      if (fs.statSync(fp).isDirectory()) walkDir(fp);
      else totalBytes += fs.statSync(fp).size;
    }
  };
  if (fs.existsSync(OUT_DIR)) walkDir(OUT_DIR);
  console.log(`Toplam boyut: ${(totalBytes / 1024 / 1024).toFixed(1)} MB`);
}

run().catch(console.error);
