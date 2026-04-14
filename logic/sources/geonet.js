// GeoNet - New Zealand (GNS Science)
// https://api.geonet.org.nz/quake
const GEONET_BASE = 'https://api.geonet.org.nz/quake';

const parseNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

export async function fetchGeoNetEvents({ minMagnitude }) {
  // MMI=-1 = all magnitudes, quality=best
  const params = new URLSearchParams({ MMI: '-1' });
  const response = await fetch(`${GEONET_BASE}?${params.toString()}`, {
    headers: { Accept: 'application/vnd.geo+json' },
  });
  if (!response.ok) {
    throw new Error(`GeoNet HTTP ${response.status}`);
  }

  const data = await response.json();
  const features = Array.isArray(data?.features) ? data.features : [];
  const minMag = parseNumber(minMagnitude) ?? 2.0;

  return features
    .filter((f) => {
      const mag = parseNumber(f?.properties?.magnitude);
      return mag !== null && mag >= minMag;
    })
    .map((f) => {
      const p = f.properties || {};
      const [lon, lat, depth] = f.geometry?.coordinates || [];
      return {
        id: `geonet-${p.publicID}`,
        source: 'GeoNet',
        time: p.time || null,
        magnitude: parseNumber(p.magnitude),
        depthKm: parseNumber(depth),
        latitude: parseNumber(lat),
        longitude: parseNumber(lon),
        location: p.locality || 'New Zealand',
        flynnRegion: p.locality,
      };
    });
}
