// NOA (National Observatory of Athens) - Greece
// FDSN text format
const NOA_BASE = 'http://www.seismologi.gr/fdsnws/event/1/query';

const parseNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

export async function fetchNoaEvents({ startDate, endDate, minMagnitude, limit }) {
  const params = new URLSearchParams({
    format: 'text',
    starttime: startDate,
    endtime: endDate,
    minmag: String(minMagnitude ?? 2.0),
    minlatitude: '34',
    maxlatitude: '42',
    minlongitude: '19',
    maxlongitude: '30',
    orderby: 'time',
    nodata: '404',
  });

  const response = await fetch(`${NOA_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`NOA HTTP ${response.status}`);
  }

  const text = await response.text();
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const limited = lines.slice(0, limit ?? 150);

  return limited.map((line) => {
    const [eventId, time, latitude, longitude, depth, , , , , , magnitude, , location] =
      line.split('|').map((v) => v?.trim());
    return {
      id: `noa-${eventId}`,
      source: 'NOA',
      time: time ? `${time.replace(' ', 'T')}Z` : null,
      magnitude: parseNumber(magnitude),
      depthKm: parseNumber(depth),
      latitude: parseNumber(latitude),
      longitude: parseNumber(longitude),
      location: location || 'Greece',
      flynnRegion: location,
    };
  });
}
