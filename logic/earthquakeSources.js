import { getCountryConfig } from './countryConfig';
import { getProfilePreferences } from './profileStore';
import {
  getRegionOptionForCountry,
  getRegionOptionsForCountry,
} from './worldCities';

const DEFAULT_LOOKBACK_DAYS = 2;
const DEFAULT_LIMIT_PER_SOURCE = 500;
const CACHE_TTL_MS = 60 * 1000;
const aggregatedCache = new Map();

const normalizeApiBase = (rawBase = '') => {
  let cleaned = String(rawBase || '').trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  cleaned = cleaned.replace('http://localhost', 'http://10.0.2.2');
  cleaned = cleaned.replace('http://127.0.0.1', 'http://10.0.2.2');
  return cleaned;
};

const EARTHQUAKE_API_BASE = normalizeApiBase(process.env.EXPO_PUBLIC_API_BASE || '');

const asBoundsList = (bounds) => {
  if (!bounds) return [];
  return Array.isArray(bounds) ? bounds : [bounds];
};

const isInsideBounds = (latitude, longitude, bounds) => {
  if (latitude === null || longitude === null || latitude === undefined || longitude === undefined || !bounds) {
    return false;
  }
  const withinLat = latitude >= bounds.minLat && latitude <= bounds.maxLat;
  const withinLon = bounds.minLon <= bounds.maxLon
    ? longitude >= bounds.minLon && longitude <= bounds.maxLon
    : longitude >= bounds.minLon || longitude <= bounds.maxLon;
  return withinLat && withinLon;
};

const isInsideAnyBounds = (latitude, longitude, bounds) =>
  asBoundsList(bounds).some((item) => isInsideBounds(latitude, longitude, item));

const hasRegionArea = (regionOption) =>
  Boolean(regionOption?.bounds) ||
  (Number.isFinite(regionOption?.latitude) && Number.isFinite(regionOption?.longitude));

const toRadians = (degrees) => degrees * Math.PI / 180;

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

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

const normalizeText = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase('tr-TR')
    .replace(/[ışğüöçİŞĞÜÖÇ]/g, (char) => TURKISH_CHAR_MAP[char] || char)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const normalizeRegionToken = (value = '') =>
  normalizeText(value)
    .replace(/[.']/g, '')
    .replace(/\s+region$/i, '')
    .trim();

const getEventTextFields = (event = {}) => [
  event.city,
  event.province,
  event.district,
  event.location,
  event.flynnRegion,
].filter(Boolean).map((field) => String(field));

const aliasMatchesToken = (aliases = [], token = '') => {
  const normalizedToken = normalizeRegionToken(token);
  return aliases.some((alias) => normalizeRegionToken(alias) === normalizedToken);
};

const getTrailingRegionToken = (text = '') => {
  const raw = String(text).trim();
  if (!raw) return null;
  const commaParts = raw.split(',');
  if (commaParts.length > 1) {
    return commaParts[commaParts.length - 1].trim();
  }
  const regionMatch = raw.match(/([A-Za-z .]+?\s+region)$/i);
  return regionMatch ? regionMatch[1].trim() : null;
};

const findRegionOptionFromText = (text, regionOptions = []) => {
  const trailingToken = getTrailingRegionToken(text);
  if (trailingToken) {
    const match = regionOptions.find((option) => aliasMatchesToken(option.aliases, trailingToken));
    if (match) return match;
  }

  const normalizedText = ` ${normalizeRegionToken(text)} `;
  return regionOptions.find((option) => {
    const label = normalizeRegionToken(option.label);
    return label.length > 2 && normalizedText.includes(` ${label} `);
  });
};

const findRegionOptionForEvent = (event, regionOptions = []) => {
  for (const field of getEventTextFields(event)) {
    const match = findRegionOptionFromText(field, regionOptions);
    if (match) return match;
  }
  return null;
};

const eventMatchesRegionBounds = (event, regionOption) => {
  if (regionOption?.bounds && isInsideAnyBounds(event.latitude, event.longitude, regionOption.bounds)) {
    return true;
  }

  if (
    Number.isFinite(regionOption?.latitude) &&
    Number.isFinite(regionOption?.longitude) &&
    Number.isFinite(event.latitude) &&
    Number.isFinite(event.longitude)
  ) {
    const radiusKm = Number(regionOption.radiusKm) > 0 ? Number(regionOption.radiusKm) : 80;
    return getDistanceKm(event.latitude, event.longitude, regionOption.latitude, regionOption.longitude) <= radiusKm;
  }

  return false;
};

const matchesRegionOption = (event, regionOption, regionOptions = []) => {
  if (!regionOption) return true;
  const areaMatch = eventMatchesRegionBounds(event, regionOption);
  const detectedRegion = findRegionOptionForEvent(event, regionOptions);
  if (detectedRegion) {
    return detectedRegion.label === regionOption.label || areaMatch;
  }
  return areaMatch;
};

const ensureIsoString = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'number') return new Date(value).toISOString();

  let candidate = String(value);
  if (!candidate.includes('T') && candidate.includes(' ')) {
    candidate = candidate.replace(' ', 'T');
  }
  if (!/[zZ]|([+-]\d{2}:?\d{2})$/.test(candidate)) {
    candidate = `${candidate}Z`;
  }
  const dateValue = new Date(candidate);
  return Number.isNaN(dateValue.getTime()) ? null : dateValue.toISOString();
};

const matchesCity = (event, normalizedCity) => {
  if (!normalizedCity) return true;
  return getEventTextFields(event).some((field) => normalizeText(field).includes(normalizedCity));
};

const dedupeEvents = (events = []) => {
  const seen = new Set();
  return events.filter((event) => {
    const key = `${event.source}-${event.id}`.toLowerCase();
    if (seen.has(key)) return false;
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

const isWithinBounds = (latitude, longitude) => {
  if (latitude === null || longitude === null || latitude === undefined || longitude === undefined) {
    return true;
  }
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
};

const pickLocationText = (event = {}) => {
  const candidates = [event.location, event.district, event.city, event.province, event.flynnRegion];
  for (const candidate of candidates) {
    if (candidate && String(candidate).trim().length > 2) {
      return String(candidate).trim();
    }
  }
  return null;
};

const sanitizeMagnitude = (value) => {
  const numeric = parseNumber(value);
  return numeric === null ? null : Number(numeric.toFixed(1));
};

const sanitizeEvent = (event = {}) => {
  const latitude = parseNumber(event.latitude);
  const longitude = parseNumber(event.longitude);
  const magnitude = sanitizeMagnitude(event.magnitude);
  const isoTime = ensureIsoString(event.time || event.date);
  return {
    ...event,
    id: event.id || `${event.source || 'Unknown'}-${isoTime || Date.now()}`,
    source: event.source ? String(event.source).toUpperCase() : 'UNKNOWN',
    latitude,
    longitude,
    magnitude,
    time: isoTime,
    location: pickLocationText(event) || 'Konum dogrulanamadi',
  };
};

const filterTrustedEvents = (events = []) =>
  events
    .map((event) => sanitizeEvent(event))
    .filter((event) => {
      const hasRequiredFields =
        Boolean(event.id) &&
        Boolean(event.source) &&
        Boolean(event.time) &&
        event.magnitude !== null &&
        Boolean(event.location);

      if (!hasRequiredFields) return false;

      const coordsProvided = event.latitude !== null && event.longitude !== null;
      return !coordsProvided || isWithinBounds(event.latitude, event.longitude);
    });

const buildVerificationDetails = ({
  aggregatedCount = 0,
  filteredCount = 0,
  deliveredCount = 0,
  requestedCity = '',
} = {}) => ({
  checkedAt: new Date().toISOString(),
  totalFetched: aggregatedCount,
  cityFilteredCount: filteredCount,
  deliveredCount,
  rejectedCount: Math.max(filteredCount - deliveredCount, 0),
  requestedCity: requestedCity || null,
});

const safeReadText = async (response) => {
  try {
    return await response.text();
  } catch {
    return '';
  }
};

const normalizeServerError = async (response) => {
  const text = await safeReadText(response);
  try {
    const payload = JSON.parse(text);
    return payload?.error?.message || payload?.message || `HTTP ${response.status}`;
  } catch {
    return text || `HTTP ${response.status}`;
  }
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(await normalizeServerError(response));
  }
  return response.json();
};

const buildCacheKey = ({ lookbackDays, minMagnitude, limitPerSource, countryCode }) =>
  [
    countryCode || 'TR',
    Number(lookbackDays || 0),
    Number(minMagnitude || 0).toFixed(1),
    Number(limitPerSource || 0),
  ].join('|');

const fetchAggregatedEventsFromServer = async ({
  countryCode,
  lookbackDays,
  minMagnitude,
  limitPerSource,
}) => {
  if (!EARTHQUAKE_API_BASE) {
    throw new Error('EXPO_PUBLIC_API_BASE yapilandirilmadi. Deprem verileri server proxy uzerinden alinmalidir.');
  }

  const params = new URLSearchParams({
    country: countryCode || 'TR',
    lookbackDays: String(lookbackDays),
    minMagnitude: String(minMagnitude),
    limitPerSource: String(limitPerSource),
  });
  const payload = await fetchJson(`${EARTHQUAKE_API_BASE}/api/earthquakes?${params.toString()}`);
  return {
    events: Array.isArray(payload?.data?.events) ? payload.data.events : Array.isArray(payload?.events) ? payload.events : [],
    sourceMeta: Array.isArray(payload?.data?.sourceMeta) ? payload.data.sourceMeta : Array.isArray(payload?.sourceMeta) ? payload.sourceMeta : [],
    attribution: Array.isArray(payload?.data?.attribution) ? payload.data.attribution : Array.isArray(payload?.attribution) ? payload.attribution : [],
    fetchedAt: payload?.data?.fetchedAt || payload?.fetchedAt,
    cache: payload?.data?.cache || payload?.cache,
  };
};

const getAggregatedEvents = async ({ lookbackDays, minMagnitude, limitPerSource }) => {
  const lookback = Number(lookbackDays) > 0 ? Number(lookbackDays) : DEFAULT_LOOKBACK_DAYS;
  const minMag = Number(minMagnitude) >= 0 ? Number(minMagnitude) : 2;
  const limit = Number(limitPerSource) > 0 ? Number(limitPerSource) : DEFAULT_LIMIT_PER_SOURCE;
  const countryCode = getProfilePreferences().country || 'TR';

  const cacheKey = buildCacheKey({
    lookbackDays: lookback,
    minMagnitude: minMag,
    limitPerSource: limit,
    countryCode,
  });

  const cached = aggregatedCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.payload;
  }

  const serverPayload = await fetchAggregatedEventsFromServer({
    countryCode,
    lookbackDays: lookback,
    minMagnitude: minMag,
    limitPerSource: limit,
  });

  const payload = {
    events: sortEventsDesc(dedupeEvents(serverPayload.events || [])),
    sourceMeta: serverPayload.sourceMeta || [],
    attribution: serverPayload.attribution || [],
    fetchedAt: serverPayload.fetchedAt,
    cache: serverPayload.cache,
  };
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
  const countryCode = getProfilePreferences().country || 'TR';
  const regionOptions = getRegionOptionsForCountry(countryCode);
  const selectedRegion = city ? getRegionOptionForCountry(countryCode, city) : null;
  const normalizedCity = city ? normalizeText(city) : '';
  const aggregated = await getAggregatedEvents({ lookbackDays, minMagnitude, limitPerSource });

  const filteredEvents = normalizedCity
    ? aggregated.events.filter((event) => {
        const src = (event.source || '').toUpperCase();
        if (hasRegionArea(selectedRegion)) {
          return matchesRegionOption(event, selectedRegion, regionOptions);
        }
        if (src !== 'USGS' && src !== 'KANDILLI') return true;
        return matchesCity(event, normalizedCity);
      })
    : aggregated.events;
  const trustedEvents = filterTrustedEvents(filteredEvents);
  const verification = buildVerificationDetails({
    aggregatedCount: aggregated.events.length,
    filteredCount: filteredEvents.length,
    deliveredCount: trustedEvents.length,
    requestedCity: city,
  });

  return {
    events: trustedEvents,
    usedFallback: false,
    sourceMeta: aggregated.sourceMeta,
    attribution: aggregated.attribution,
    verification,
  };
};

const SOURCE_LABELS = {
  kandilli: 'Kandilli',
  ingv: 'INGV',
  geonet: 'GeoNet',
  jma: 'JMA',
  bmkg: 'BMKG',
  noa: 'NOA',
};

export const getSourceMetaLabels = () => {
  const countryConfig = getCountryConfig(getProfilePreferences().country || 'TR');
  const labels = [{ key: 'usgs-local', label: 'USGS' }];
  const localLabel = SOURCE_LABELS[countryConfig.sourceKey];
  if (localLabel && countryConfig.sourceKey !== 'usgs-bbox') {
    labels.push({ key: countryConfig.sourceKey, label: localLabel });
  }
  return labels;
};
