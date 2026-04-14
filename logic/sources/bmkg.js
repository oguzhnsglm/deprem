// BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) - Indonesia
// Son 15 depremi döndürür (public endpoint)
const BMKG_URL = 'https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json';

const parseNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

const parseCoord = (raw) => {
  // "6.20 LS" veya "106.80 BT" formatından sayı çıkar, LS/S = negatif
  if (!raw) return null;
  const str = String(raw).trim();
  const num = parseNumber(str.replace(/[^\d.]/g, ''));
  if (num === null) return null;
  return /LS|S\b/i.test(str) ? -num : num;
};

export async function fetchBmkgEvents({ minMagnitude }) {
  const response = await fetch(BMKG_URL);
  if (!response.ok) {
    throw new Error(`BMKG HTTP ${response.status}`);
  }

  const data = await response.json();
  const items = Array.isArray(data?.Infogempa?.gempa) ? data.Infogempa.gempa : [];
  const minMag = parseNumber(minMagnitude) ?? 2.0;

  return items
    .filter((item) => {
      const mag = parseNumber(item?.Magnitude);
      return mag !== null && mag >= minMag;
    })
    .map((item, index) => {
      const rawDepth = String(item.Kedalaman || '').replace(/[^\d.]/g, '');
      // Koordinatlar "lat,lon" string olarak da gelebiliyor
      let lat = null;
      let lon = null;
      if (item.Coordinates) {
        const parts = String(item.Coordinates).split(',');
        lat = parseNumber(parts[0]);
        lon = parseNumber(parts[1]);
      } else {
        lat = parseCoord(item.Lintang);
        lon = parseCoord(item.Bujur);
      }

      return {
        id: `bmkg-${item.DateTime || index}`,
        source: 'BMKG',
        time: item.DateTime || null,
        magnitude: parseNumber(item.Magnitude),
        depthKm: parseNumber(rawDepth),
        latitude: lat,
        longitude: lon,
        location: item.Wilayah || 'Indonesia',
        flynnRegion: item.Wilayah,
      };
    });
}
