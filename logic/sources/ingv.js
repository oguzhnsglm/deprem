// INGV (Istituto Nazionale di Geofisica e Vulcanologia) - Italy
// FDSN text format API
const INGV_BASE = 'https://webservices.ingv.it/fdsnws/event/1/query';

const parseNumber = (v) => { const n = Number(v); return Number.isFinite(n) ? n : null; };

const formatIngvDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 19);
};

export async function fetchIngvEvents({ startDate, endDate, minMagnitude, limit }) {
  const params = new URLSearchParams({
    format: 'text',
    starttime: formatIngvDate(startDate),
    endtime: formatIngvDate(endDate),
    minmag: String(minMagnitude ?? 2.0),
    minlatitude: '36',
    maxlatitude: '48',
    minlongitude: '6',
    maxlongitude: '20',
    orderby: 'time',
    nodata: '404',
  });

  const response = await fetch(`${INGV_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`INGV HTTP ${response.status}`);
  }

  const text = await response.text();
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const limited = lines.slice(0, limit ?? 150);

  return limited.map((line) => {
    const [eventId, time, latitude, longitude, depth, , , , , , magnitude, , location] =
      line.split('|').map((v) => v?.trim());
    return {
      id: `ingv-${eventId}`,
      source: 'INGV',
      time: time ? `${time.replace(' ', 'T')}Z` : null,
      magnitude: parseNumber(magnitude),
      depthKm: parseNumber(depth),
      latitude: parseNumber(latitude),
      longitude: parseNumber(longitude),
      location: location || 'Italy',
      flynnRegion: location,
    };
  });
}
