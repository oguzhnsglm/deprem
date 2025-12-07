import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';

let MapView = null;
let Marker = null;
const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

const describeSoilStrength = (vs30) => {
  if (typeof vs30 !== 'number') {
    return null;
  }
  if (vs30 >= 1500) {
    return 'Cok sert kaya; deprem dalgalarini pek buyutmez, yer ivmesi dusuk.';
  }
  if (vs30 >= 760) {
    return 'Sert kaya; stabil, risk dusuk.';
  }
  if (vs30 >= 360) {
    return 'Orta sertlikte kaya/yari sert zemin; standart seviye, orta risk.';
  }
  if (vs30 >= 180) {
    return 'Yumusak zemin; dalga buyutmesi belirgin, yapilar daha fazla sarsilir.';
  }
  return 'Cok yumusak/gevsek zemin; dalgalari kuvvetle buyutur, sivilasmas riski artar.';
};

try {
  if (isNativePlatform) {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker || Maps.default?.Marker;
  }
} catch (error) {
  console.warn('[MapExplorer] react-native-maps yuklenemedi:', error.message);
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
  const [faultInfo, setFaultInfo] = useState(null);
  const [faultLoading, setFaultLoading] = useState(false);
  const [faultError, setFaultError] = useState(null);

  const vs30ApiBaseRaw = process.env.EXPO_PUBLIC_VS30_API_BASE;
  const vs30ApiBase = typeof vs30ApiBaseRaw === 'string' && vs30ApiBaseRaw.length
    ? vs30ApiBaseRaw.replace(/\/$/, '')
    : null;
  const vs30Available = Boolean(vs30ApiBase && isNativePlatform);

  const apiBaseRaw = process.env.EXPO_PUBLIC_API_BASE || vs30ApiBaseRaw;
  const faultApiBase = typeof apiBaseRaw === 'string' && apiBaseRaw.length
    ? apiBaseRaw.replace(/\/$/, '')
    : null;
  const faultAvailable = Boolean(faultApiBase && isNativePlatform);

  const mapRef = useRef(null);
  const canPickPoint = Boolean(isNativePlatform && (vs30Available || faultAvailable));

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
      setErrorMessage('Konum alinirkken sorun olustu.');
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
    const coordinate = event?.nativeEvent?.coordinate;
    if (!coordinate) {
      return;
    }

    setSelectedSoilPoint(coordinate);

    if (vs30Available) {
      setVs30Loading(true);
      setVs30Error(null);
    } else {
      setVs30Info(null);
      setVs30Error('Vs30 servisi kullanilamiyor (.env kontrol edin).');
    }

    if (faultAvailable) {
      setFaultLoading(true);
      setFaultError(null);
    } else {
      setFaultInfo(null);
      setFaultError('Fay servisi bulunamadi (.env icinde EXPO_PUBLIC_API_BASE tanimlayin).');
    }

    const searchParams = new URLSearchParams({
      lat: coordinate.latitude.toString(),
      lon: coordinate.longitude.toString(),
    });

    if (vs30Available) {
      try {
        const response = await fetch(`${vs30ApiBase}/vs30?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error(`VS30 API error ${response.status}`);
        }
        const payload = await response.json();
        setVs30Info(payload);
      } catch (error) {
        console.warn('[MapExplorer] Vs30 fetch failed', error);
        setVs30Info(null);
        setVs30Error('Vs30 verisi alinmadi.');
      } finally {
        setVs30Loading(false);
      }
    }

    if (faultAvailable) {
      try {
        const response = await fetch(`${faultApiBase}/api/fault-distance?${searchParams.toString()}`);
        if (!response.ok) {
          throw new Error(`Fault API error ${response.status}`);
        }
        const payload = await response.json();
        setFaultInfo(payload);
      } catch (error) {
        console.warn('[MapExplorer] Fault fetch failed', error);
        setFaultInfo(null);
        setFaultError('Fay verisine ulasilamadi.');
      } finally {
        setFaultLoading(false);
      }
    }
  }, [faultApiBase, faultAvailable, vs30ApiBase, vs30Available]);

  const overlayNote = useMemo(() => {
    if (!canPickPoint) {
      return 'Haritadan veri almak icin .env ayarlarini tamamlayin.';
    }
    if (!selectedSoilPoint) {
      return 'Haritada bir noktaya uzun basarak zemin ve fay analizini goster.';
    }
    return `${selectedSoilPoint.latitude.toFixed(4)}, ${selectedSoilPoint.longitude.toFixed(4)}`;
  }, [canPickPoint, selectedSoilPoint]);

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
              onLongPress={canPickPoint ? handleMapLongPress : undefined}
            >
              {selectedSoilPoint && (
                <Marker coordinate={selectedSoilPoint} pinColor="#dc2626" title="Vs30 olcum noktasi" />
              )}
            </MapView>

            <View style={styles.overlayStack}>
              <View style={styles.vs30Card}>
                <Text style={styles.vs30Title}>Vs30 Zemin Bilgisi</Text>
                {!vs30Available ? (
                  <Text style={styles.vs30Hint}>
                    .env icinde EXPO_PUBLIC_VS30_API_BASE tanimlamadan kullanilamaz.
                  </Text>
                ) : vs30Loading ? (
                  <View style={styles.vs30Row}>
                    <ActivityIndicator color="#f97316" size="small" />
                    <Text style={[styles.vs30Hint, { marginLeft: 10 }]}>Zemin verisi yukleniyor...</Text>
                  </View>
                ) : vs30Info ? (
                  <>
                    <View style={styles.vs30Row}>
                      <Text style={styles.vs30Value}>{vs30Info.vs30 ?? 'N/A'}</Text>
                      <Text style={styles.vs30Unit}>m/s</Text>
                      <View style={styles.vs30Badge}>
                        <Text style={styles.vs30BadgeText}>{vs30Info.soilClass ?? '--'}</Text>
                      </View>
                    </View>
                    <Text style={styles.vs30Coords}>
                      {vs30Info.lat?.toFixed(4)}, {vs30Info.lon?.toFixed(4)}
                    </Text>
                    {typeof vs30Info.vs30 === 'number' && (
                      <Text style={styles.vs30Hint}>{describeSoilStrength(vs30Info.vs30)}</Text>
                    )}
                    {vs30Info.vs30 == null && (
                      <Text style={styles.vs30Hint}>Bu piksel icin Vs30 verisi bulunamadi.</Text>
                    )}
                  </>
                ) : vs30Error ? (
                  <Text style={styles.vs30Error}>{vs30Error}</Text>
                ) : (
                  <Text style={styles.vs30Hint}>Haritada uzun basarak zemin sinifini goster.</Text>
                )}
              </View>

              {isNativePlatform && (
                <View style={styles.faultCard}>
                  <Text style={styles.faultTitle}>Fay Yakinlik Analizi</Text>
                  {!faultAvailable ? (
                    <Text style={styles.faultHint}>.env icinde EXPO_PUBLIC_API_BASE tanimlamadan fay verisi alinmaz.</Text>
                  ) : faultLoading ? (
                    <View style={styles.faultRow}>
                      <ActivityIndicator color="#fde047" size="small" />
                      <Text style={[styles.faultHint, { marginLeft: 10 }]}>Fay verisi yukleniyor...</Text>
                    </View>
                  ) : faultInfo ? (
                    <>
                      <Text style={styles.faultDistance}>
                        {faultInfo.distance_km != null
                          ? `En yakin fay uzakliginiz: ${faultInfo.distance_km.toFixed(1)} km`
                          : 'En yakin fay uzakligi hesaplanamadi'}
                      </Text>
                      <Text style={styles.faultScore}>
                        Fay Yakinlik Skoru: <Text style={styles.faultScoreValue}>{faultInfo.proximity_score ?? '--'}</Text>
                        <Text style={styles.faultScoreHint}>/100 ({faultInfo.level ?? 'Bilinmiyor'})</Text>
                      </Text>
                      <Text style={styles.faultNote}>{faultInfo.note}</Text>
                    </>
                  ) : faultError ? (
                    <Text style={styles.faultError}>{faultError}</Text>
                  ) : selectedSoilPoint ? (
                    <Text style={styles.faultHint}>
                      {selectedSoilPoint.latitude.toFixed(4)}, {selectedSoilPoint.longitude.toFixed(4)} - sonuc bekleniyor...
                    </Text>
                  ) : (
                    <Text style={styles.faultHint}>Haritada uzun basarak fay analizini goster.</Text>
                  )}
                </View>
              )}

              <Text style={styles.overlayNote}>{overlayNote}</Text>
            </View>

            {locating && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#f97316" />
                <Text style={styles.loadingText}>Konum aliniyor...</Text>
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
            <Text style={styles.mapFallbackTitle}>Harita yuklenemedi</Text>
            <Text style={styles.mapFallbackText}>
              react-native-maps bu platformda hazir degil. Lutfen iOS/Android ortaminda calistirin.
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
    backgroundColor: '#120a0f',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#120a0f',
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
    color: '#f8fafc',
    marginBottom: 8,
  },
  mapFallbackText: {
    textAlign: 'center',
    color: '#cbd5e1',
    lineHeight: 20,
  },
  overlayStack: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    gap: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 20,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  loadingText: {
    color: '#f8fafc',
    fontWeight: '600',
    marginLeft: 8,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.92)',
    padding: 12,
    borderRadius: 16,
  },
  errorOverlayText: {
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
  },
  vs30Card: {
    backgroundColor: 'rgba(24, 24, 27, 0.9)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2933',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 14,
  },
  vs30Title: {
    color: '#f8fafc',
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
    color: '#f97316',
  },
  vs30Unit: {
    color: '#f8fafc',
    marginLeft: 8,
  },
  vs30Coords: {
    color: '#fef9c3',
    marginTop: 8,
    fontSize: 13,
  },
  vs30Hint: {
    color: '#fef9c3',
    marginTop: 8,
    fontSize: 12,
  },
  vs30Error: {
    color: '#f97316',
    marginTop: 8,
    fontWeight: '700',
  },
  vs30Badge: {
    marginLeft: 12,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.6)',
  },
  vs30BadgeText: {
    color: '#fde68a',
    fontWeight: '700',
  },
  faultCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2933',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 12,
  },
  faultTitle: {
    color: '#fcd34d',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  faultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  faultDistance: {
    color: '#fde68a',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  faultScore: {
    color: '#fcd34d',
    marginTop: 8,
    fontSize: 14,
  },
  faultScoreValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fde047',
  },
  faultScoreHint: {
    fontSize: 13,
    color: '#fde68a',
  },
  faultHint: {
    color: '#fcd34d',
    marginTop: 10,
    fontSize: 12,
  },
  faultNote: {
    marginTop: 8,
    color: '#fef3c7',
    fontSize: 12,
  },
  faultError: {
    marginTop: 10,
    color: '#f97316',
    fontWeight: '700',
  },
  overlayNote: {
    marginTop: 2,
    color: '#cbd5e1',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default MapExplorerScreen;
