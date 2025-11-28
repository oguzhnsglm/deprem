import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { getRiskForCoords } from '../logic/earthquakeRisk';

let MapView = null;
let Marker = null;
const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

const describeSoilStrength = (vs30) => {
  if (typeof vs30 !== 'number') {
    return null;
  }
  if (vs30 >= 1500) {
    return '\u00C7ok sert kaya; deprem dalgalar\u0131n\u0131 pek b\u00FCy\u00FCtmez, yer ivmesi d\u00FC\u015F\u00FCk.';
  }
  if (vs30 >= 760) {
    return 'Sert kaya; stabil, risk d\u00FC\u015F\u00FCk.';
  }
  if (vs30 >= 360) {
    return 'Orta sertlikte kaya/yar\u0131 sert zemin; \u00E7o\u011Fu kentte g\u00F6r\u00FClen standart zemin, orta risk.';
  }
  if (vs30 >= 180) {
    return 'Yumu\u015Fak zemin; dalga b\u00FCy\u00FCtmesi belirgin, yap\u0131lar daha fazla sars\u0131l\u0131r.';
  }
  return '\u00C7ok yumu\u015Fak/gev\u015Fek zemin veya kal\u0131n al\u00FCvyon; deprem dalgalar\u0131n\u0131 kuvvetle b\u00FCy\u00FCt\u00FCr, s\u0131v\u0131la\u015Fma riski artar.';
};

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

const MapExplorerScreen = () => {
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedSoilPoint, setSelectedSoilPoint] = useState(null);
  const [vs30Info, setVs30Info] = useState(null);
  const [vs30Loading, setVs30Loading] = useState(false);
  const [vs30Error, setVs30Error] = useState(null);
  const vs30ApiBaseRaw = process.env.EXPO_PUBLIC_VS30_API_BASE;
  const vs30ApiBase = typeof vs30ApiBaseRaw === 'string' && vs30ApiBaseRaw.length
    ? vs30ApiBaseRaw.replace(/\/$/, '')
    : null;
  const vs30Available = Boolean(vs30ApiBase && isNativePlatform);
  const showVs30Overlay = Boolean(MapView && isNativePlatform);
  const mapRef = useRef(null);

  const risk = useMemo(() => getRiskForCoords(region), [region]);

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
    } catch (error) {
      setErrorMessage('Konum alınırken sorun oluştu.');
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => {
    if (isNativePlatform) {
      syncLocation();
    }
  }, [syncLocation]);

  const handleRegionChangeComplete = useCallback(
    (nextRegion) => {
      setRegion(nextRegion);
    },
    []
  );

  const handleMapLongPress = useCallback(async (event) => {
    if (!vs30Available) {
      setVs30Error('Vs30 servisi kullanılabilir değil (.env kontrol edin).');
      return;
    }
    const coordinate = event?.nativeEvent?.coordinate;
    if (!coordinate) {
      return;
    }
    setSelectedSoilPoint(coordinate);
    setVs30Loading(true);
    setVs30Error(null);
    try {
      const searchParams = new URLSearchParams({
        lat: coordinate.latitude.toString(),
        lon: coordinate.longitude.toString(),
      });
      const response = await fetch(`${vs30ApiBase}/vs30?${searchParams.toString()}`);
      if (!response.ok) {
        throw new Error(`VS30 API error ${response.status}`);
      }
      const payload = await response.json();
      setVs30Info(payload);
    } catch (error) {
      console.warn('[MapExplorer] Vs30 fetch failed', error);
      setVs30Info(null);
      setVs30Error('Vs30 verisi alınamadı.');
    } finally {
      setVs30Loading(false);
    }
  }, [vs30ApiBase, vs30Available]);

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
              onLongPress={vs30Available ? handleMapLongPress : undefined}
            >
              {selectedSoilPoint && (
                <Marker
                  coordinate={selectedSoilPoint}
                  pinColor="#f472b6"
                  title="Vs30 ölçüm noktası"
                />
              )}
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

            {showVs30Overlay && (
              <View style={styles.vs30Card}>
                <Text style={styles.vs30Title}>Vs30 Zemin Bilgisi</Text>
                {!vs30Available ? (
                  <Text style={styles.vs30Hint}>
                    .env dosyasında EXPO_PUBLIC_VS30_API_BASE tanımlanmadan kullanılamaz.
                  </Text>
                ) : vs30Loading ? (
                  <View style={styles.vs30Row}>
                    <ActivityIndicator color="#f472b6" size="small" />
                    <Text style={[styles.vs30Hint, { marginLeft: 10 }]}>Zemin verisi yükleniyor…</Text>
                  </View>
                ) : vs30Info ? (
                  <>
                    <View style={styles.vs30Row}>
                      <Text style={styles.vs30Value}>{vs30Info.vs30 ?? 'N/A'}</Text>
                      <Text style={styles.vs30Unit}>m/s</Text>
                      <View style={styles.vs30Badge}>
                        <Text style={styles.vs30BadgeText}>{vs30Info.soilClass ?? '–'}</Text>
                      </View>
                    </View>
                    <Text style={styles.vs30Coords}>
                      {vs30Info.lat?.toFixed(4)}, {vs30Info.lon?.toFixed(4)}
                    </Text>
                    {typeof vs30Info.vs30 === 'number' && (
                      <Text style={styles.vs30Hint}>{describeSoilStrength(vs30Info.vs30)}</Text>
                    )}
                    {vs30Info.vs30 == null && (
                      <Text style={styles.vs30Hint}>Bu piksel için Vs30 verisi bulunamadı.</Text>
                    )}
                  </>
                ) : vs30Error ? (
                  <Text style={styles.vs30Error}>{vs30Error}</Text>
                ) : selectedSoilPoint ? (
                  <Text style={styles.vs30Coords}>
                    {selectedSoilPoint.latitude.toFixed(4)}, {selectedSoilPoint.longitude.toFixed(4)} - sonuç bekleniyor…
                  </Text>
                ) : (
                  <Text style={styles.vs30Hint}>Haritada bir noktaya uzun basarak zemin sınıfını öğren.</Text>
                )}
              </View>
            )}

            {locating && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#f472b6" />
                <Text style={styles.loadingText}>Konum alınıyor…</Text>
              </View>
            )}

            {errorMessage && (
              <View
                style={[
                  styles.errorOverlay,
                  showVs30Overlay && styles.errorOverlayRaised,
                ]}
              >
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
  errorOverlayRaised: {
    bottom: 240,
  },
  errorOverlayText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  vs30Card: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.6)',
  },
  vs30Title: {
    color: '#fce7f3',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  vs30Row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  vs30Value: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f472b6',
  },
  vs30Unit: {
    color: '#fce7f3',
    marginLeft: 8,
  },
  vs30Coords: {
    color: '#e0e7ff',
    marginTop: 8,
    fontSize: 13,
  },
  vs30Hint: {
    color: '#e0e7ff',
    marginTop: 8,
    fontSize: 12,
  },
  vs30Error: {
    color: '#fecdd3',
    marginTop: 8,
    fontWeight: '700',
  },
  vs30Badge: {
    marginLeft: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(244, 114, 182, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.9)',
  },
  vs30BadgeText: {
    color: '#fdf2f8',
    fontWeight: '700',
  },
});

export default MapExplorerScreen;

