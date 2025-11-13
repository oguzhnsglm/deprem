import PROVINCES from './provinces';

const MOCK_EARTHQUAKES = [
  {
    city: 'İstanbul',
    events: [
      {
        id: 'ist-1',
        magnitude: 3.6,
        depthKm: 8,
        time: '2025-01-12T04:12:00Z',
        location: 'Silivri Açıkları',
      },
      {
        id: 'ist-2',
        magnitude: 4.9,
        depthKm: 12,
        time: '2025-01-03T13:42:00Z',
        location: 'Çınarcık Fayı',
      },
      {
        id: 'ist-3',
        magnitude: 5.5,
        depthKm: 15,
        time: '2024-12-22T21:05:00Z',
        location: 'Marmara Denizi Orta Kesim',
      },
    ],
  },
  {
    city: 'İzmir',
    events: [
      {
        id: 'izm-1',
        magnitude: 2.8,
        depthKm: 6,
        time: '2025-01-15T09:22:00Z',
        location: 'Seferihisar',
      },
      {
        id: 'izm-2',
        magnitude: 4.4,
        depthKm: 18,
        time: '2025-01-10T19:58:00Z',
        location: 'Karaburun Açıkları',
      },
      {
        id: 'izm-3',
        magnitude: 5.9,
        depthKm: 24,
        time: '2024-12-11T02:40:00Z',
        location: 'Kuşadası Körfezi',
      },
    ],
  },
  {
    city: 'Ankara',
    events: [
      {
        id: 'ank-1',
        magnitude: 2.4,
        depthKm: 5,
        time: '2025-01-08T07:15:00Z',
        location: 'Bala',
      },
      {
        id: 'ank-2',
        magnitude: 3.1,
        depthKm: 9,
        time: '2024-12-28T11:40:00Z',
        location: 'Kalecik',
      },
      {
        id: 'ank-3',
        magnitude: 4.2,
        depthKm: 14,
        time: '2024-12-05T15:05:00Z',
        location: 'Ayaş',
      },
    ],
  },
  {
    city: 'Kahramanmaraş',
    events: [
      {
        id: 'khr-1',
        magnitude: 3.2,
        depthKm: 11,
        time: '2025-01-14T23:31:00Z',
        location: 'Pazarcık',
      },
      {
        id: 'khr-2',
        magnitude: 4.8,
        depthKm: 17,
        time: '2025-01-02T05:45:00Z',
        location: 'Nurdağı',
      },
      {
        id: 'khr-3',
        magnitude: 6.1,
        depthKm: 20,
        time: '2024-12-18T18:18:00Z',
        location: 'Türkoğlu',
      },
    ],
  },
];

export const getKnownCities = () => PROVINCES;

export const getEarthquakesByCity = (city) => {
  const match = MOCK_EARTHQUAKES.find((entry) => entry.city.toLowerCase() === city.toLowerCase());
  return match ? match.events : [];
};

export const getAllEarthquakes = () => MOCK_EARTHQUAKES;

export default MOCK_EARTHQUAKES;
