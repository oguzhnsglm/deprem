// Her ülke için: birincil deprem kaynağı + bounding box + görüntüleme bilgisi
// USGS her zaman ek kaynak olarak çalışır; burada ülkeye özel kaynak tanımlanır.

export const COUNTRY_CONFIGS = {
  TR: {
    code: 'TR',
    name: 'Türkiye',
    flag: '🇹🇷',
    sourceKey: 'kandilli',
    sourceLabel: 'Kandilli + USGS',
    defaultCity: 'İstanbul',
    defaultLanguage: 'tr',
    bounds: { minLat: 34.5, maxLat: 43.5, minLon: 25.0, maxLon: 45.5 },
    emergencyNumbers: [
      { label: 'AFAD', value: '122' },
      { label: 'Acil', value: '112' },
      { label: 'Alo Deprem', value: '184' },
    ],
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    flag: '🇯🇵',
    sourceKey: 'jma',
    sourceLabel: 'JMA (P2PQuake) + USGS',
    defaultCity: 'Tokyo',
    defaultLanguage: 'ja',
    bounds: { minLat: 24.0, maxLat: 46.0, minLon: 122.0, maxLon: 154.0 },
    emergencyNumbers: [
      { label: 'Emergency', value: '119' },
      { label: 'Police', value: '110' },
      { label: 'JMA Info', value: '117' },
    ],
  },
  IT: {
    code: 'IT',
    name: 'Italy',
    flag: '🇮🇹',
    sourceKey: 'ingv',
    sourceLabel: 'INGV + USGS',
    defaultCity: 'Roma',
    defaultLanguage: 'it',
    bounds: { minLat: 36.0, maxLat: 48.0, minLon: 6.0, maxLon: 20.0 },
    emergencyNumbers: [
      { label: 'Emergency', value: '112' },
      { label: 'Fire', value: '115' },
      { label: 'Ambulance', value: '118' },
    ],
  },
  NZ: {
    code: 'NZ',
    name: 'New Zealand',
    flag: '🇳🇿',
    sourceKey: 'geonet',
    sourceLabel: 'GeoNet + USGS',
    defaultCity: 'Wellington',
    defaultLanguage: 'en',
    bounds: { minLat: -48.0, maxLat: -34.0, minLon: 165.0, maxLon: 180.0 },
    emergencyNumbers: [
      { label: 'Emergency', value: '111' },
      { label: 'Civil Defence', value: '0800555000' },
    ],
  },
  ID: {
    code: 'ID',
    name: 'Indonesia',
    flag: '🇮🇩',
    sourceKey: 'bmkg',
    sourceLabel: 'BMKG + USGS',
    defaultCity: 'Jakarta',
    defaultLanguage: 'id',
    bounds: { minLat: -12.0, maxLat: 8.0, minLon: 95.0, maxLon: 141.0 },
    emergencyNumbers: [
      { label: 'BNPB', value: '117' },
      { label: 'Emergency', value: '112' },
      { label: 'Ambulance', value: '119' },
    ],
  },
  US: {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    sourceKey: 'usgs-bbox',
    sourceLabel: 'USGS',
    defaultCity: 'California',
    regionType: 'state',
    defaultLanguage: 'en',
    bounds: { minLat: 24.0, maxLat: 50.0, minLon: -125.0, maxLon: -65.0 },
    emergencyNumbers: [
      { label: '911', value: '911' },
      { label: 'FEMA', value: '18006213362' },
    ],
  },
};

export const COUNTRY_LIST = Object.values(COUNTRY_CONFIGS);

export const getCountryConfig = (code) =>
  COUNTRY_CONFIGS[code] || COUNTRY_CONFIGS.TR;
