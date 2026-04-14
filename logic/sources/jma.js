// JMA (Japan Meteorological Agency) via P2PQuake community aggregation
// https://www.p2pquake.net/develop/json_api_v2/
const P2P_BASE = 'https://api.p2pquake.net/v2/jma/quake';

const parseNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

export async function fetchJmaEvents({ minMagnitude, limit }) {
  const params = new URLSearchParams({
    limit: String(Math.min(limit ?? 100, 100)),
    offset: '0',
  });

  const response = await fetch(`${P2P_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`JMA/P2PQuake HTTP ${response.status}`);
  }

  const data = await response.json();
  const items = Array.isArray(data) ? data : [];
  const minMag = parseNumber(minMagnitude) ?? 2.0;

  return items
    .filter((item) => {
      const mag = parseNumber(item?.earthquake?.hypocenter?.magnitude);
      return mag !== null && mag >= minMag;
    })
    .map((item) => {
      const eq = item.earthquake || {};
      const hypo = eq.hypocenter || {};
      // P2PQuake time format: "2024/01/01 12:00:00"
      const rawTime = eq.time ? eq.time.replace(' ', 'T') + '+09:00' : null;
      return {
        id: `jma-${item.id}`,
        source: 'JMA',
        time: rawTime,
        magnitude: parseNumber(hypo.magnitude),
        depthKm: parseNumber(hypo.depth),
        latitude: parseNumber(hypo.latitude),
        longitude: parseNumber(hypo.longitude),
        location: hypo.name || 'Japan',
        flynnRegion: hypo.name,
      };
    });
}
