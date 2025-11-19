import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Location from 'expo-location';
import { getEmergencyPlaces } from '../logic/placesService';
import { getRiskForCoords } from '../logic/earthquakeRisk';

let MapView = null;
let Marker = null;
const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

try {
  if (isNativePlatform) {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker || Maps.default?.Marker;
  }
} catch (error) {
    console.warn('[MapExplorer] react-native-maps yüklenemedi:', error.message);
}

const DEFAULT_REGION = {
  latitude: 41.015137,
  longitude: 28.97953,
  latitudeDelta: 0.2,
  longitudeDelta: 0.2,
};

const FILTERS = [
  { id: 'all', label: 'Hepsi' },
  { id: 'shelter', label: 'Toplanma Alanı' },
  { id: 'hospital', label: 'Hastaneler' },
];

const MapExplorerScreen = () => {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [userLocation, setUserLocation] = useState(null);
  const [places, setPlaces] = useState({ shelters: [], hospitals: [] });
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [errorMessage, setErrorMessage] = useState(null);
  const debouncedFetchRef = useRef(null);
  const mapRef = useRef(null);

  const risk = useMemo(() => getRiskForCoords(region), [region]);

  const markers = useMemo(() => {
    if (activeFilter === 'shelter') {
      return places.shelters;
    }
    if (activeFilter === 'hospital') {
      return places.hospitals;
    }
    return [...places.shelters, ...places.hospitals];
  }, [activeFilter, places]);

  const fetchPlaces = useCallback(async (coords) => {
    if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
      return;
    }
    const targetCoords = { latitude: coords.latitude, longitude: coords.longitude };
    setLoadingPlaces(true);
    try {
      const data = await getEmergencyPlaces(targetCoords);
      setPlaces(data);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage('Çevredeki tesisler alınamadı.');
    } finally {
      setLoadingPlaces(false);
    }
  }, []);

  const scheduleFetch = useCallback(
    (coords) => {
      if (!coords || typeof coords.latitude !== 'number' || typeof coords.longitude !== 'number') {
        return;
      }
      if (debouncedFetchRef.current) {
        clearTimeout(debouncedFetchRef.current);
      }
      debouncedFetchRef.current = setTimeout(() => {
        fetchPlaces({ latitude: coords.latitude, longitude: coords.longitude });
      }, 500);
    },
    [fetchPlaces]
  );

  useEffect(
    () => () => {
      if (debouncedFetchRef.current) {
        clearTimeout(debouncedFetchRef.current);
      }
    },
    []
  );

  const syncLocation = useCallback(async () => {
    if (!isNativePlatform) {
      return;
    }
    setLocating(true);
    setErrorMessage(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage('Konum izni reddedildi. Manuel olarak haritada gezinebilirsin.');
        setLocating(false);
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const nextRegion = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        latitudeDelta: 0.08,
        longitudeDelta: 0.08,
      };

      setRegion(nextRegion);
      setUserLocation(coords);
      mapRef.current?.animateToRegion(nextRegion, 600);
      await fetchPlaces(coords);
    } catch (error) {
      setErrorMessage('Konum alınırken sorun oluştu.');
    } finally {
      setLocating(false);
    }
  }, [fetchPlaces]);

  useEffect(() => {
    if (MapView) {
      scheduleFetch({ latitude: DEFAULT_REGION.latitude, longitude: DEFAULT_REGION.longitude });
    }
  }, [scheduleFetch]);

  useEffect(() => {
    if (isNativePlatform) {
      syncLocation();
    }
  }, [syncLocation]);

  const handleRegionChangeComplete = useCallback(
    (nextRegion) => {
      setRegion(nextRegion);
      scheduleFetch({ latitude: nextRegion.latitude, longitude: nextRegion.longitude });
    },
    [scheduleFetch]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.mapContainer}>
        {MapView ? (
          <>
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFill}
              region={region}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation={Boolean(userLocation)}
              showsPointsOfInterest={false}
            >
              {markers.map((place) => (
                <Marker
                  key={place.id}
                  coordinate={{ latitude: place.latitude, longitude: place.longitude }}
                  pinColor={place.type === 'hospital' ? '#ef4444' : '#10b981'}
                  title={place.name}
                  description={place.vicinity}
                />
              ))}
            </MapView>

            <View style={styles.riskOverlay}>
              <Text style={styles.riskOverlayTitle}>Deprem Riski</Text>
              <View style={styles.riskOverlayRow}>
                <Text style={styles.riskOverlayLevel}>{risk.level}</Text>
                <Text style={styles.riskOverlayScore}>{risk.score}</Text>
                <Text style={styles.riskOverlayScoreHint}>/100</Text>
              </View>
              {risk.zoneName && <Text style={styles.riskOverlayZone}>{risk.zoneName}</Text>}
              <Text style={styles.riskOverlayDescription}>{risk.description}</Text>
            </View>

            <View style={styles.legendOverlay}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  onPress={() => setActiveFilter(filter.id)}
                  style={[styles.legendChip, activeFilter === filter.id && styles.legendChipActive]}
                >
                  <View
                    style={[
                      styles.legendDot,
                      filter.id === 'hospital'
                        ? styles.legendDotHospital
                        : filter.id === 'shelter'
                        ? styles.legendDotShelter
                        : styles.legendDotAll,
                    ]}
                  />
                  <Text style={[styles.legendText, activeFilter === filter.id && styles.legendTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {!loadingPlaces && markers.length === 0 && (
              <View style={styles.emptyOverlay}>
                <Text style={styles.emptyOverlayTitle}>Yakınlarda tesis bulunamadı</Text>
                <Text style={styles.emptyOverlayText}>Haritayı hareket ettirerek farklı bölgeleri tarayabilirsin.</Text>
              </View>
            )}

            {(loadingPlaces || locating) && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#f472b6" />
                <Text style={styles.loadingText}>{locating ? 'Konum alınıyor…' : 'Yakın tesisler yenileniyor…'}</Text>
              </View>
            )}

            {errorMessage && (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorOverlayText}>{errorMessage}</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackTitle}>Harita yüklenemedi</Text>
            <Text style={styles.mapFallbackText}>
              react-native-maps bu platformda hazır değil. Lütfen iOS/Android’de özel Expo client veya yerel build ile çalıştırın.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ecfccb',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#ecfccb',
  },
  mapFallback: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapFallbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 8,
  },
  mapFallbackText: {
    textAlign: 'center',
    color: '#065f46',
    lineHeight: 20,
  },
  riskOverlay: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(254, 243, 199, 0.92)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  riskOverlayTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    letterSpacing: 1,
  },
  riskOverlayRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 6,
  },
  riskOverlayLevel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#92400e',
    flex: 1,
  },
  riskOverlayScore: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f59e0b',
  },
  riskOverlayScoreHint: {
    fontSize: 14,
    color: '#b45309',
    marginLeft: 4,
    marginBottom: 4,
  },
  riskOverlayZone: {
    fontSize: 13,
    color: '#b45309',
  },
  riskOverlayDescription: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    color: '#92400e',
  },
  legendOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(15, 118, 110, 0.4)',
    backgroundColor: 'rgba(15, 118, 110, 0.15)',
  },
  legendChipActive: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendDotShelter: {
    backgroundColor: '#10b981',
  },
  legendDotHospital: {
    backgroundColor: '#ef4444',
  },
  legendDotAll: {
    backgroundColor: '#fde047',
  },
  legendText: {
    color: '#0f766e',
    fontWeight: '700',
  },
  legendTextActive: {
    color: '#ecfeff',
  },
  emptyOverlay: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(14, 116, 144, 0.35)',
  },
  emptyOverlayTitle: {
    fontWeight: '700',
    fontSize: 16,
    color: '#0f766e',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyOverlayText: {
    fontSize: 13,
    color: '#0f766e',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 24,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 23, 23, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  loadingText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    padding: 12,
    borderRadius: 16,
  },
  errorOverlayText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default MapExplorerScreen;

