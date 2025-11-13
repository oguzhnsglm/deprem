const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const FALLBACK_SHELTERS = [
  { id: 'mock-shelter-1', name: 'Maçka Deprem Toplanma Alanı', latitude: 41.0424, longitude: 28.9947, vicinity: 'Şişli', type: 'shelter' },
  { id: 'mock-shelter-2', name: 'Moda Deprem Toplanma Alanı', latitude: 40.9891, longitude: 29.0303, vicinity: 'Kadıköy', type: 'shelter' },
  { id: 'mock-shelter-3', name: 'Yıldız Parkı Toplanma Alanı', latitude: 41.0482, longitude: 29.013, vicinity: 'Beşiktaş', type: 'shelter' },
];

const FALLBACK_HOSPITALS = [
  { id: 'mock-hospital-1', name: 'Florence Nightingale', latitude: 41.0631, longitude: 29.011, vicinity: 'Şişli', type: 'hospital' },
  { id: 'mock-hospital-2', name: 'Acıbadem Kadıköy', latitude: 40.9876, longitude: 29.0381, vicinity: 'Kadıköy', type: 'hospital' },
  { id: 'mock-hospital-3', name: 'Koşuyolu Kalp Hastanesi', latitude: 41.0, longitude: 29.045, vicinity: 'Üsküdar', type: 'hospital' },
];

const toPlace = (entry, type) => ({
  id: entry.place_id || `${type}-${entry.name}`,
  name: entry.name,
  latitude: entry.geometry?.location?.lat,
  longitude: entry.geometry?.location?.lng,
  vicinity: entry.vicinity || entry.formatted_address,
  type,
});

const buildQueryString = (params) =>
  Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

const fetchPlacesFromGoogle = async ({ latitude, longitude }, { keyword, type, radius = 4000 }) => {
  if (!API_KEY) {
    throw new Error('Missing Google Maps API key');
  }

  const query = buildQueryString({
    location: `${latitude},${longitude}`,
    radius,
    type,
    keyword,
    key: API_KEY,
  });

  const response = await fetch(`${GOOGLE_PLACES_URL}?${query}`);
  if (!response.ok) {
    throw new Error('Google Places request failed');
  }
  const payload = await response.json();

  if (payload.status !== 'OK' && payload.status !== 'ZERO_RESULTS') {
    throw new Error(payload.error_message || 'Google Places error');
  }

  return (payload.results || []).map((entry) => toPlace(entry, type || 'poi'));
};

const buildFallbackData = (baseList, coords) =>
  baseList.map((place, index) => ({
    ...place,
    latitude: coords?.latitude ? coords.latitude + (index - 1) * 0.01 : place.latitude,
    longitude: coords?.longitude ? coords.longitude + (index - 1) * 0.012 : place.longitude,
  }));

export const getEmergencyPlaces = async (coords) => {
  if (!coords) {
    return { shelters: [], hospitals: [] };
  }

  try {
    const [shelters, hospitals] = await Promise.all([
      fetchPlacesFromGoogle(coords, { keyword: 'deprem toplanma alanı', type: 'point_of_interest' }),
      fetchPlacesFromGoogle(coords, { type: 'hospital' }),
    ]);

    return {
      shelters: shelters.map((place) => ({ ...place, type: 'shelter' })),
      hospitals: hospitals.map((place) => ({ ...place, type: 'hospital' })),
    };
  } catch (error) {
    console.warn('[placesService] Using fallback data:', error.message);
    return {
      shelters: buildFallbackData(FALLBACK_SHELTERS, coords),
      hospitals: buildFallbackData(FALLBACK_HOSPITALS, coords),
    };
  }
};
