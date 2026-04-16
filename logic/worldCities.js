// Per-country region lists for ProfileScreen / EarthquakeFeedScreen.
// Existing callers still receive plain labels via getCitiesForCountry().

const city = (label, latitude, longitude, radiusKm = 80, extraAliases = []) => ({
  label,
  value: label,
  aliases: [label, ...extraAliases],
  ...(Number.isFinite(latitude) && Number.isFinite(longitude)
    ? { latitude, longitude, radiusKm }
    : {}),
});

const region = (label, abbr, bounds, extraAliases = []) => ({
  label,
  value: label,
  aliases: abbr ? [label, abbr, ...extraAliases] : [label, ...extraAliases],
  bounds,
});

export const WORLD_REGION_OPTIONS = {
  TR: [
    city('İstanbul'), city('Ankara'), city('İzmir'), city('Bursa'), city('Antalya'), city('Adana'), city('Konya'),
    city('Gaziantep'), city('Mersin'), city('Diyarbakır'), city('Kayseri'), city('Eskişehir'), city('Trabzon'),
    city('Samsun'), city('Malatya'), city('Erzurum'), city('Van'), city('Denizli'), city('Kahramanmaraş'), city('Hatay'),
    city('Balıkesir'), city('Manisa'), city('Muğla'), city('Tekirdağ'), city('Sakarya'), city('Kocaeli'),
  ],
  JP: [
    city('Tokyo', 35.6762, 139.6503, 80), city('Osaka', 34.6937, 135.5023, 70), city('Yokohama', 35.4437, 139.6380, 55),
    city('Nagoya', 35.1815, 136.9066, 70), city('Sapporo', 43.0618, 141.3545, 90), city('Fukuoka', 33.5902, 130.4017, 70),
    city('Kobe', 34.6901, 135.1955, 60), city('Kyoto', 35.0116, 135.7681, 60), city('Kawasaki', 35.5308, 139.7036, 45),
    city('Saitama', 35.8617, 139.6455, 55), city('Hiroshima', 34.3853, 132.4553, 75), city('Sendai', 38.2682, 140.8694, 85),
    city('Kitakyushu', 33.8834, 130.8751, 65), city('Chiba', 35.6074, 140.1065, 60), city('Sakai', 34.5733, 135.4828, 45),
    city('Niigata', 37.9161, 139.0364, 85), city('Hamamatsu', 34.7108, 137.7261, 70), city('Shizuoka', 34.9756, 138.3828, 70),
    city('Sagamihara', 35.5714, 139.3732, 50), city('Okayama', 34.6551, 133.9195, 75),
  ],
  IT: [
    city('Roma', 41.9028, 12.4964, 80), city('Milano', 45.4642, 9.1900, 70), city('Napoli', 40.8518, 14.2681, 70),
    city('Torino', 45.0703, 7.6869, 70), city('Palermo', 38.1157, 13.3615, 75), city('Genova', 44.4056, 8.9463, 70),
    city('Bologna', 44.4949, 11.3426, 70), city('Firenze', 43.7696, 11.2558, 65), city('Bari', 41.1171, 16.8719, 70),
    city('Catania', 37.5079, 15.0830, 70), city('Venezia', 45.4408, 12.3155, 65), city('Verona', 45.4384, 10.9916, 65),
    city('Messina', 38.1938, 15.5540, 65), city('Padova', 45.4064, 11.8768, 55), city('Trieste', 45.6495, 13.7768, 65),
    city('Taranto', 40.4644, 17.2470, 65), city('Brescia', 45.5416, 10.2118, 55), city('Prato', 43.8777, 11.1022, 45),
    city('Modena', 44.6471, 10.9252, 55), city('Reggio Calabria', 38.1113, 15.6473, 65),
  ],
  NZ: [
    city('Auckland', -36.8509, 174.7645, 90), city('Wellington', -41.2865, 174.7762, 85), city('Christchurch', -43.5321, 172.6362, 90),
    city('Hamilton', -37.7870, 175.2793, 75), city('Tauranga', -37.6878, 176.1651, 75), city('Napier', -39.4928, 176.9120, 75),
    city('Dunedin', -45.8788, 170.5028, 85), city('Palmerston North', -40.3523, 175.6082, 75), city('Nelson', -41.2706, 173.2840, 75),
    city('Rotorua', -38.1368, 176.2497, 75), city('New Plymouth', -39.0556, 174.0752, 75), city('Whangarei', -35.7251, 174.3237, 80),
    city('Invercargill', -46.4132, 168.3538, 90), city('Whanganui', -39.9301, 175.0479, 75),
  ],
  ID: [
    city('Jakarta', -6.2088, 106.8456, 100), city('Surabaya', -7.2575, 112.7521, 100), city('Bandung', -6.9175, 107.6191, 90),
    city('Bekasi', -6.2383, 106.9756, 70), city('Medan', 3.5952, 98.6722, 100), city('Tangerang', -6.1783, 106.6319, 70),
    city('Semarang', -6.9667, 110.4167, 90), city('Depok', -6.4025, 106.7942, 70), city('Palembang', -2.9761, 104.7754, 100),
    city('Makassar', -5.1477, 119.4327, 100), city('Bogor', -6.5971, 106.8060, 80), city('Batam', 1.1301, 104.0531, 90),
    city('Pekanbaru', 0.5071, 101.4478, 100), city('Bandar Lampung', -5.3971, 105.2668, 100), city('Malang', -7.9666, 112.6326, 90),
    city('Padang', -0.9471, 100.4172, 100), city('Denpasar', -8.6500, 115.2167, 90), city('Samarinda', -0.5022, 117.1536, 100),
    city('Tasikmalaya', -7.3506, 108.2172, 90), city('Pontianak', -0.0263, 109.3425, 100),
  ],
  US: [
    region('Alabama', 'AL', { minLat: 30.1, maxLat: 35.1, minLon: -88.6, maxLon: -84.9 }),
    region('Alaska', 'AK', [
      { minLat: 51.2, maxLat: 72.0, minLon: -170.0, maxLon: -129.0 },
      { minLat: 51.2, maxLat: 54.5, minLon: 172.0, maxLon: 180.0 },
      { minLat: 51.2, maxLat: 54.5, minLon: -180.0, maxLon: -170.0 },
    ]),
    region('Arizona', 'AZ', { minLat: 31.2, maxLat: 37.1, minLon: -114.9, maxLon: -109.0 }),
    region('Arkansas', 'AR', { minLat: 33.0, maxLat: 36.6, minLon: -94.7, maxLon: -89.6 }),
    region('California', 'CA', { minLat: 32.4, maxLat: 42.1, minLon: -124.6, maxLon: -114.1 }),
    region('Colorado', 'CO', { minLat: 36.9, maxLat: 41.1, minLon: -109.1, maxLon: -102.0 }),
    region('Connecticut', 'CT', { minLat: 40.9, maxLat: 42.1, minLon: -73.8, maxLon: -71.8 }),
    region('Delaware', 'DE', { minLat: 38.4, maxLat: 39.9, minLon: -75.8, maxLon: -75.0 }),
    region('District of Columbia', 'DC', { minLat: 38.7, maxLat: 39.0, minLon: -77.2, maxLon: -76.9 }),
    region('Florida', 'FL', { minLat: 24.4, maxLat: 31.1, minLon: -87.7, maxLon: -80.0 }),
    region('Georgia', 'GA', { minLat: 30.3, maxLat: 35.1, minLon: -85.7, maxLon: -80.8 }),
    region('Hawaii', 'HI', { minLat: 18.8, maxLat: 22.4, minLon: -160.4, maxLon: -154.7 }),
    region('Idaho', 'ID', { minLat: 41.9, maxLat: 49.1, minLon: -117.3, maxLon: -111.0 }),
    region('Illinois', 'IL', { minLat: 36.9, maxLat: 42.6, minLon: -91.6, maxLon: -87.4 }),
    region('Indiana', 'IN', { minLat: 37.7, maxLat: 41.8, minLon: -88.2, maxLon: -84.7 }),
    region('Iowa', 'IA', { minLat: 40.3, maxLat: 43.6, minLon: -96.7, maxLon: -90.1 }),
    region('Kansas', 'KS', { minLat: 36.9, maxLat: 40.1, minLon: -102.1, maxLon: -94.5 }),
    region('Kentucky', 'KY', { minLat: 36.4, maxLat: 39.2, minLon: -89.7, maxLon: -81.9 }),
    region('Louisiana', 'LA', { minLat: 28.8, maxLat: 33.1, minLon: -94.1, maxLon: -88.7 }),
    region('Maine', 'ME', { minLat: 42.9, maxLat: 47.5, minLon: -71.1, maxLon: -66.8 }),
    region('Maryland', 'MD', { minLat: 37.8, maxLat: 39.8, minLon: -79.6, maxLon: -75.0 }),
    region('Massachusetts', 'MA', { minLat: 41.1, maxLat: 42.9, minLon: -73.6, maxLon: -69.8 }),
    region('Michigan', 'MI', { minLat: 41.6, maxLat: 48.4, minLon: -90.5, maxLon: -82.1 }),
    region('Minnesota', 'MN', { minLat: 43.4, maxLat: 49.4, minLon: -97.3, maxLon: -89.5 }),
    region('Mississippi', 'MS', { minLat: 30.1, maxLat: 35.1, minLon: -91.7, maxLon: -88.0 }),
    region('Missouri', 'MO', { minLat: 35.9, maxLat: 40.7, minLon: -95.8, maxLon: -89.0 }),
    region('Montana', 'MT', { minLat: 44.3, maxLat: 49.1, minLon: -116.2, maxLon: -104.0 }),
    region('Nebraska', 'NE', { minLat: 39.9, maxLat: 43.1, minLon: -104.1, maxLon: -95.2 }),
    region('Nevada', 'NV', { minLat: 35.0, maxLat: 42.1, minLon: -120.1, maxLon: -114.0 }),
    region('New Hampshire', 'NH', { minLat: 42.6, maxLat: 45.4, minLon: -72.6, maxLon: -70.6 }),
    region('New Jersey', 'NJ', { minLat: 38.8, maxLat: 41.4, minLon: -75.6, maxLon: -73.9 }),
    region('New Mexico', 'NM', { minLat: 31.2, maxLat: 37.1, minLon: -109.1, maxLon: -103.0 }),
    region('New York', 'NY', { minLat: 40.4, maxLat: 45.1, minLon: -79.8, maxLon: -71.8 }),
    region('North Carolina', 'NC', { minLat: 33.8, maxLat: 36.7, minLon: -84.4, maxLon: -75.3 }),
    region('North Dakota', 'ND', { minLat: 45.9, maxLat: 49.1, minLon: -104.1, maxLon: -96.5 }),
    region('Ohio', 'OH', { minLat: 38.3, maxLat: 42.1, minLon: -84.9, maxLon: -80.5 }),
    region('Oklahoma', 'OK', { minLat: 33.5, maxLat: 37.1, minLon: -103.1, maxLon: -94.4 }),
    region('Oregon', 'OR', { minLat: 41.9, maxLat: 46.4, minLon: -124.8, maxLon: -116.4 }),
    region('Pennsylvania', 'PA', { minLat: 39.6, maxLat: 42.3, minLon: -80.6, maxLon: -74.6 }),
    region('Rhode Island', 'RI', { minLat: 41.1, maxLat: 42.1, minLon: -71.9, maxLon: -71.1 }),
    region('South Carolina', 'SC', { minLat: 32.0, maxLat: 35.3, minLon: -83.4, maxLon: -78.5 }),
    region('South Dakota', 'SD', { minLat: 42.4, maxLat: 45.9, minLon: -104.1, maxLon: -96.4 }),
    region('Tennessee', 'TN', { minLat: 34.9, maxLat: 36.8, minLon: -90.4, maxLon: -81.6 }),
    region('Texas', 'TX', { minLat: 25.8, maxLat: 36.6, minLon: -106.7, maxLon: -93.5 }),
    region('Utah', 'UT', { minLat: 36.9, maxLat: 42.1, minLon: -114.1, maxLon: -109.0 }),
    region('Vermont', 'VT', { minLat: 42.7, maxLat: 45.1, minLon: -73.5, maxLon: -71.4 }),
    region('Virginia', 'VA', { minLat: 36.5, maxLat: 39.5, minLon: -83.8, maxLon: -75.2 }),
    region('Washington', 'WA', { minLat: 45.4, maxLat: 49.1, minLon: -124.9, maxLon: -116.9 }),
    region('West Virginia', 'WV', { minLat: 37.1, maxLat: 40.7, minLon: -82.7, maxLon: -77.6 }),
    region('Wisconsin', 'WI', { minLat: 42.4, maxLat: 47.1, minLon: -92.9, maxLon: -86.8 }),
    region('Wyoming', 'WY', { minLat: 40.9, maxLat: 45.1, minLon: -111.1, maxLon: -104.0 }),
    region('American Samoa', null, { minLat: -14.8, maxLat: -10.8, minLon: -171.2, maxLon: -168.0 }, ['American Samoa region']),
    region('Guam', 'GU', { minLat: 13.1, maxLat: 13.8, minLon: 144.5, maxLon: 145.1 }, ['Guam region']),
    region('Northern Mariana Islands', 'MP', { minLat: 14.0, maxLat: 20.8, minLon: 144.5, maxLon: 146.2 }, ['Northern Mariana Islands region']),
    region('Puerto Rico', 'PR', { minLat: 17.8, maxLat: 18.7, minLon: -67.5, maxLon: -65.1 }, ['Puerto Rico region']),
    region('U.S. Virgin Islands', 'VI', { minLat: 17.5, maxLat: 18.7, minLon: -65.2, maxLon: -64.2 }, ['US Virgin Islands', 'Virgin Islands']),
  ],
};

const DEFAULT_REGION_LABELS = {
  TR: 'İstanbul',
  JP: 'Tokyo',
  IT: 'Roma',
  NZ: 'Wellington',
  ID: 'Jakarta',
  US: 'California',
};

const LEGACY_REGION_LABEL_MAP = {
  US: {
    'Los Angeles': 'California',
    'San Francisco': 'California',
    Sacramento: 'California',
    'San Diego': 'California',
    Riverside: 'California',
    Fresno: 'California',
    'Long Beach': 'California',
    Seattle: 'Washington',
    Portland: 'Oregon',
    Anchorage: 'Alaska',
    'Las Vegas': 'Nevada',
    Reno: 'Nevada',
    Phoenix: 'Arizona',
    'Salt Lake City': 'Utah',
    Denver: 'Colorado',
  },
};

export const getRegionOptionsForCountry = (countryCode) =>
  WORLD_REGION_OPTIONS[countryCode] || [];

export const getCitiesForCountry = (countryCode) =>
  getRegionOptionsForCountry(countryCode).map((option) => option.label);

export const resolveRegionLabelForCountry = (countryCode, label) => {
  const labels = getCitiesForCountry(countryCode);
  if (labels.includes(label)) return label;
  return LEGACY_REGION_LABEL_MAP[countryCode]?.[label] || label;
};

export const getDefaultRegionForCountry = (countryCode) => {
  const labels = getCitiesForCountry(countryCode);
  const preferred = DEFAULT_REGION_LABELS[countryCode];
  return labels.includes(preferred) ? preferred : labels[0] || '';
};

export const getRegionOptionForCountry = (countryCode, label) => {
  const resolvedLabel = resolveRegionLabelForCountry(countryCode, label);
  return getRegionOptionsForCountry(countryCode).find((option) => option.label === resolvedLabel);
};

export const getRegionBoundsForCountry = (countryCode) =>
  getRegionOptionsForCountry(countryCode).flatMap((option) => {
    if (!option.bounds) return [];
    return Array.isArray(option.bounds) ? option.bounds : [option.bounds];
  });
