const TURKEY_BOUNDS = {
  minLat: 34.5,
  maxLat: 43.5,
  minLon: 25,
  maxLon: 45.5,
};

const SOURCE_DEFINITIONS = [
  { key: 'afad', label: 'AFAD', fetcher: fetchAfadEvents },
  { key: 'kandilli', label: 'Kandilli', fetcher: fetchKandilliEvents },
  { key: 'usgs', label: 'USGS', fetcher: fetchUsgsEvents },
  { key: 'emsc', label: 'EMSC', fetcher: fetchEmscEvents },
  { key: 'iris', label: 'IRIS', fetcher: fetchIrisEvents },
];

const DEFAULT_LOOKBACK_DAYS = 30;
const DEFAULT_LIMIT_PER_SOURCE = 500;
const CACHE_TTL_MS = 10 * 60 * 1000;
const aggregatedCache = new Map();

const TURKISH_CHAR_MAP = {
  ı: 'i',
  İ: 'i',
  ğ: 'g',
  Ğ: 'g',
  ü: 'u',
  Ü: 'u',
  ş: 's',
  Ş: 's',
  ö: 'o',
  Ö: 'o',
  ç: 'c',
  Ç: 'c',
};

const REGION_TRANSLATIONS = {
  'CENTRAL TURKEY': 'Orta Türkiye',
  'EASTERN TURKEY': 'Doğu Türkiye',
  'WESTERN TURKEY': 'Batı Türkiye',
  'SOUTHERN TURKEY': 'Güney Türkiye',
  'NORTHERN TURKEY': 'Kuzey Türkiye',
  'EASTERN MEDITERRANEAN SEA': 'Doğu Akdeniz',
  'MEDITERRANEAN SEA': 'Akdeniz',
  'AEGEAN SEA': 'Ege Denizi',
  'MARMARA SEA': 'Marmara Denizi',
  'BLACK SEA': 'Karadeniz',
  'CYPRUS REGION': 'Kıbrıs Bölgesi',
  'CYPRUS': 'Kıbrıs',
  'GREECE': 'Yunanistan',
  'GEORGIA': 'Gürcistan',
  'IRAN': 'İran',
  'IRAQ': 'Irak',
  'SYRIA': 'Suriye',
};

const normalizeText = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase('tr-TR')
    .replace(/[ışğüöçİŞĞÜÖÇ]/g, (char) => TURKISH_CHAR_MAP[char] || char)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const ensureIsoString = (value, fallbackOffsetHours = 0) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  let candidate = value;
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }

  if (!value.includes('T') && value.includes(' ')) {
    candidate = value.replace(' ', 'T');
  }

  if (!/[zZ]|([+-]\d{2}:?\d{2})$/.test(candidate)) {
    const offsetHours = Number(fallbackOffsetHours);
    if (Number.isFinite(offsetHours) && offsetHours !== 0) {
      const sign = offsetHours >= 0 ? '+' : '-';
      const absolute = Math.abs(offsetHours);
      const hours = String(Math.floor(absolute)).padStart(2, '0');
      const minutes = String(Math.round((absolute % 1) * 60)).padStart(2, '0');
      candidate = `${candidate}${sign}${hours}:${minutes}`;
    } else {
      candidate = `${candidate}Z`;
    }
  }

  const dateValue = new Date(candidate);
  return Number.isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
};

const matchesCity = (event, normalizedCity) => {
  if (!normalizedCity) {
    return true;
  }

  const fields = [
    event.city,
    event.province,
    event.district,
    event.location,
    event.flynnRegion,
  ];

  return fields.some((field) => field && normalizeText(field).includes(normalizedCity));
};

const dedupeEvents = (events = []) => {
  const seen = new Set();
  return events.filter((event) => {
    const key = `${event.source}-${event.id}`.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const sortEventsDesc = (events = []) =>
  [...events].sort((a, b) => {
    const aTime = new Date(a.time || 0).getTime();
    const bTime = new Date(b.time || 0).getTime();
    return bTime - aTime;
  });

const parseNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const safeReadText = async (response) => {
  try {
    return await response.text();
  } catch (error) {
    return '';
  }
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    const message = await safeReadText(response);
    throw new Error(message || `HTTP ${response.status}`);
  }
  return response.json();
};

async function fetchAfadEvents({ startDate, endDate, minMagnitude, limit }) {
  const params = new URLSearchParams({
    start: startDate.slice(0, 10),
    end: endDate.slice(0, 10),
    minmag: String(minMagnitude ?? 1),
    orderby: 'desc',
    limit: String(limit ?? 200),
  });

  const data = await fetchJson(`https://deprem.afad.gov.tr/apiv2/event/filter?${params.toString()}`);

  return (Array.isArray(data) ? data : []).map((item) => ({
    id: item.eventID,
    source: 'AFAD',
    time: ensureIsoString(item.date, 3),
    magnitude: parseNumber(item.magnitude),
    depthKm: parseNumber(item.depth),
    latitude: parseNumber(item.latitude),
    longitude: parseNumber(item.longitude),
    location: item.location || item.neighborhood || item.district || item.province,
    province: item.province,
    city: item.province,
    district: item.district,
    flynnRegion: item.country,
    eventType: item.type,
  }));
}

async function fetchKandilliEvents() {
  const data = await fetchJson('https://api.orhanaydogdu.com.tr/deprem/kandilli/live');
  const results = Array.isArray(data?.result) ? data.result : [];

  return results.map((item) => {
    const coords = typeof item.geojson?.coordinates === 'string' ? item.geojson.coordinates.split(' ') : [];
    const longitude = parseNumber(coords?.[0]);
    const latitude = parseNumber(coords?.[1]);
    const closestCity = parseClosestCity(item.location_properties?.closestCity);

    return {
      id: item.earthquake_id,
      source: 'Kandilli',
      time: ensureIsoString(item.date_time, 3),
      magnitude: parseNumber(item.mag),
      depthKm: parseNumber(item.depth),
      latitude,
      longitude,
      location: item.title,
      province: closestCity,
      city: closestCity,
      district: undefined,
      flynnRegion: item.location_properties?.epiCenter?.name,
    };
  });
}

const parseClosestCity = (raw) => {
  if (typeof raw !== 'string') {
    return undefined;
  }
  const match = raw.match(/name\s*=\s*([^;]+?)(;|$)/i);
  if (!match) {
    return undefined;
  }
  return match[1].trim();
};

async function fetchUsgsEvents({ startDate, endDate, minMagnitude, limit }) {
  const params = new URLSearchParams({
    format: 'geojson',
    starttime: startDate,
    endtime: endDate,
    minmagnitude: String(minMagnitude ?? 2.5),
    minlatitude: String(TURKEY_BOUNDS.minLat),
    maxlatitude: String(TURKEY_BOUNDS.maxLat),
    minlongitude: String(TURKEY_BOUNDS.minLon),
    maxlongitude: String(TURKEY_BOUNDS.maxLon),
    orderby: 'time',
    limit: String(limit ?? 200),
  });

  const data = await fetchJson(`https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`);
  const features = Array.isArray(data?.features) ? data.features : [];

  return features.map((feature) => ({
    id: feature.id,
    source: 'USGS',
    time: ensureIsoString(feature.properties?.time),
    magnitude: parseNumber(feature.properties?.mag),
    depthKm: parseNumber(feature.geometry?.coordinates?.[2]),
    latitude: parseNumber(feature.geometry?.coordinates?.[1]),
    longitude: parseNumber(feature.geometry?.coordinates?.[0]),
    location: feature.properties?.place,
    province: undefined,
    city: undefined,
    district: undefined,
    flynnRegion: feature.properties?.place,
    externalUrl: feature.properties?.url,
  }));
}

const localizeRegion = (value) => {
  if (!value) {
    return { translated: value, original: value };
  }
  const upper = value.toUpperCase();
  if (REGION_TRANSLATIONS[upper]) {
    return { translated: REGION_TRANSLATIONS[upper], original: value };
  }
  const normalized = value
    .toLowerCase()
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return { translated: normalized, original: value };
};

async function fetchEmscEvents({ startDate, endDate, minMagnitude, limit }) {
  const params = new URLSearchParams({
    format: 'json',
    starttime: startDate,
    endtime: endDate,
    minmag: String(minMagnitude ?? 2.5),
    minlat: String(TURKEY_BOUNDS.minLat),
    maxlat: String(TURKEY_BOUNDS.maxLat),
    minlon: String(TURKEY_BOUNDS.minLon),
    maxlon: String(TURKEY_BOUNDS.maxLon),
    limit: String(limit ?? 200),
    orderby: 'time',
  });

  const data = await fetchJson(`https://www.seismicportal.eu/fdsnws/event/1/query?${params.toString()}`);
  const features = Array.isArray(data?.features) ? data.features : [];

  return features.map((feature) => {
    const region = feature.properties?.flynn_region;
    const { translated, original } = localizeRegion(region);
    const locationText = translated && original && translated !== original ? `${translated} (${original})` : translated || original;
    return {
      id: feature.id ?? feature.properties?.unid,
      source: 'EMSC',
      time: ensureIsoString(feature.properties?.time),
      magnitude: parseNumber(feature.properties?.mag),
      depthKm: parseNumber(feature.properties?.depth ?? feature.geometry?.coordinates?.[2]),
      latitude: parseNumber(feature.geometry?.coordinates?.[1]),
      longitude: parseNumber(feature.geometry?.coordinates?.[0]),
      location: locationText,
      province: undefined,
      city: undefined,
      district: undefined,
      flynnRegion: region,
      externalUrl: `https://www.emsc-csem.org/Earthquake/world/${feature.id ?? feature.properties?.unid}`,
    };
  });
}

async function fetchIrisEvents({ startDate, endDate, minMagnitude, limit }) {
  const params = new URLSearchParams({
    format: 'text',
    starttime: startDate,
    endtime: endDate,
    minmag: String(minMagnitude ?? 2.5),
    minlatitude: String(TURKEY_BOUNDS.minLat),
    maxlatitude: String(TURKEY_BOUNDS.maxLat),
    minlongitude: String(TURKEY_BOUNDS.minLon),
    maxlongitude: String(TURKEY_BOUNDS.maxLon),
    nodata: '404',
  });

  const response = await fetch(`https://service.iris.edu/fdsnws/event/1/query?${params.toString()}`);
  if (!response.ok) {
    const message = await safeReadText(response);
    throw new Error(message || `HTTP ${response.status}`);
  }

  const text = await response.text();
  const lines = text.split('\n').map((line) => line.trim());
  const dataLines = lines.filter((line) => line && !line.startsWith('#'));
  const limited = dataLines.slice(0, limit ?? 120);

  return limited.map((line) => {
    const [
      eventId,
      time,
      latitude,
      longitude,
      depthKm,
      author,
      catalog,
      contributor,
      contributorId,
      magType,
      magnitude,
      magAuthor,
      location,
    ] = line.split('|').map((value) => value?.trim());

    return {
      id: eventId,
      source: 'IRIS',
      time: ensureIsoString(time),
      magnitude: parseNumber(magnitude),
      depthKm: parseNumber(depthKm),
      latitude: parseNumber(latitude),
      longitude: parseNumber(longitude),
      location,
      province: undefined,
      city: undefined,
      district: undefined,
      flynnRegion: location,
      catalog,
      author,
      contributor,
      contributorId,
      magType,
      magAuthor,
    };
  });
}

const buildCacheKey = ({ startDate, endDate, minMagnitude, limit }) =>
  [
    startDate.slice(0, 19),
    endDate.slice(0, 19),
    Number(minMagnitude || 0).toFixed(1),
    Number(limit || 0),
  ].join('|');

const getAggregatedEvents = async ({ lookbackDays, minMagnitude, limitPerSource }) => {
  const now = new Date();
  const lookback = Number(lookbackDays) > 0 ? Number(lookbackDays) : DEFAULT_LOOKBACK_DAYS;
  const startDate = new Date(now.getTime() - lookback * 24 * 60 * 60 * 1000);
  const endDate = now;
  const minMag = Number(minMagnitude) >= 0 ? Number(minMagnitude) : 2;
  const limit = Number(limitPerSource) > 0 ? Number(limitPerSource) : DEFAULT_LIMIT_PER_SOURCE;

  const cacheKey = buildCacheKey({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    minMagnitude: minMag,
    limit,
  });

  const cached = aggregatedCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.payload;
  }

  const sourceMeta = SOURCE_DEFINITIONS.map(({ key, label }) => ({
    key,
    label,
    ok: false,
    count: 0,
    error: null,
  }));

  const fetchPromises = SOURCE_DEFINITIONS.map(({ fetcher }) =>
    fetcher({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      minMagnitude: minMag,
      limit,
    })
  );

  const settledResults = await Promise.allSettled(fetchPromises);
  const collectedEvents = [];

  settledResults.forEach((result, index) => {
    const meta = sourceMeta[index];
    if (result.status === 'fulfilled') {
      meta.ok = true;
      meta.count = Array.isArray(result.value) ? result.value.length : 0;
      collectedEvents.push(...(result.value || []));
    } else {
      meta.error = result.reason?.message || String(result.reason);
    }
  });

  const events = sortEventsDesc(dedupeEvents(collectedEvents));
  const payload = { events, sourceMeta };

  aggregatedCache.set(cacheKey, {
    timestamp: Date.now(),
    payload,
  });

  return payload;
};

export const fetchCityEarthquakes = async ({
  city,
  lookbackDays = DEFAULT_LOOKBACK_DAYS,
  minMagnitude = 2,
  limitPerSource = DEFAULT_LIMIT_PER_SOURCE,
} = {}) => {
  const normalizedCity = city ? normalizeText(city) : '';
  const aggregated = await getAggregatedEvents({ lookbackDays, minMagnitude, limitPerSource });
  const filteredEvents = normalizedCity
    ? aggregated.events.filter((event) => matchesCity(event, normalizedCity))
    : aggregated.events;

  return {
    events: filteredEvents,
    usedFallback: false,
    sourceMeta: aggregated.sourceMeta,
  };
};

export const getSourceMetaLabels = () =>
  SOURCE_DEFINITIONS.map(({ key, label }) => ({ key, label }));
