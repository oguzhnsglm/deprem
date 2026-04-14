import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, PanResponder, Platform, SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { computeTabOrder } from '../navigation/tabOrder';
import { getProfilePreferences } from '../logic/profileStore';
import { getCountryConfig } from '../logic/countryConfig';

let MapView = null;
let Marker = null;
let UrlTile = null;
const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

const describeSoilStrength = (vs30) => {
  if (typeof vs30 !== 'number') {
    return null;
  }
  if (vs30 >= 1500) {
    return { level: 'Çok Düşük Risk', color: '#10B981', desc: 'Çok sert kaya; deprem dalgalarını pek büyütmez, yer ivmesi düşük.' };
  }
  if (vs30 >= 760) {
    return { level: 'Düşük Risk', color: '#34D399', desc: 'Sert kaya; stabil bir yapı sunar, yer sarsıntısı riski genel olarak düşüktür.' };
  }
  if (vs30 >= 360) {
    return { level: 'Orta Risk', color: '#FACC15', desc: 'Orta sertlikte kaya/yarı sert zemin; standart seviye sarsıntı gözlenir.' };
  }
  if (vs30 >= 180) {
    return { level: 'Yüksek Risk', color: '#F87171', desc: 'Yumuşak zemin; dalga büyütmesi belirgindir, yapılar şiddetli sarsılır.' };
  }
  return { level: 'Çok Yüksek Risk', color: '#EF4444', desc: 'Çok yumuşak/gevşek zemin; dalgaları kuvvetle büyütür ve sıvılaşma riski taşır.' };
};

const describeFaultRisk = (score) => {
  if (score == null) return { level: 'Bilinmeyen Risk', color: '#94A3B8' };
  if (score >= 90) return { level: 'Çok Yüksek Risk', color: '#EF4444' }; // 0-10 km, yüksek kayma
  if (score >= 70) return { level: 'Yüksek Risk', color: '#F87171' }; // 10-30 km
  if (score >= 40) return { level: 'Orta Risk', color: '#FACC15' }; // 30-60 km
  return { level: 'Düşük Risk', color: '#34D399' }; // > 60 km
};

const fetchWithTimeout = async (url, { timeoutMs = 8000, ...options } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
};

const normalizeBaseUrl = (url) => {
  if (typeof url !== 'string' || !url.length) {
    return null;
  }
  let cleaned = url.replace(/\/$/, '');

  // Android emulator sees host machine as 10.0.2.2 instead of localhost/127.0.0.1.
  if (Platform.OS === 'android') {
    cleaned = cleaned.replace('http://localhost', 'http://10.0.2.2');
    cleaned = cleaned.replace('http://127.0.0.1', 'http://10.0.2.2');
  }

  return cleaned;
};

try {
  if (isNativePlatform) {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker || Maps.default?.Marker;
    UrlTile = Maps.UrlTile || Maps.default?.UrlTile;
  }
} catch (error) {
  console.warn('[MapExplorer] react-native-maps yuklenemedi:', error.message);
}

const getDefaultRegion = () => {
  const prefs = getProfilePreferences();
  const country = getCountryConfig(prefs.country || 'TR');
  const { minLat, maxLat, minLon, maxLon } = country.bounds;
  const centerLat = (minLat + maxLat) / 2;
  const centerLon = (minLon + maxLon) / 2;
  const latDelta = Math.max(0.2, (maxLat - minLat) * 0.35);
  const lonDelta = Math.max(0.2, (maxLon - minLon) * 0.35);
  return { latitude: centerLat, longitude: centerLon, latitudeDelta: latDelta, longitudeDelta: lonDelta };
};

const MapExplorerScreen = ({ navigation }) => {
  const [region, setRegion] = useState(getDefaultRegion);
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
  const [mapReady, setMapReady] = useState(false);

  const [showHazardMap, setShowHazardMap] = useState(false);

  const vs30ApiBaseRaw = process.env.EXPO_PUBLIC_VS30_API_BASE;
  const vs30ApiBase = normalizeBaseUrl(vs30ApiBaseRaw);
  const vs30Available = Boolean(vs30ApiBase && isNativePlatform);

  const apiBaseRaw = process.env.EXPO_PUBLIC_API_BASE || vs30ApiBaseRaw;
  const faultApiBase = normalizeBaseUrl(apiBaseRaw);
  const faultAvailable = Boolean(faultApiBase && isNativePlatform);

  const fetchTimeoutMsRaw = Number(process.env.EXPO_PUBLIC_MAP_FETCH_TIMEOUT_MS);
  const fetchTimeoutMs = Number.isFinite(fetchTimeoutMsRaw) ? fetchTimeoutMsRaw : 15000;

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
        Alert.alert(
          'Konum İzni Gerekli',
          'Konumunu haritada göstermek için konum iznine ihtiyaç var. Ayarlardan izin verebilirsin.',
          [
            { text: 'Tamam', style: 'cancel' },
            { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
          ]
        );
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

  useEffect(() => {
    console.log('[MapExplorer] bases', { vs30ApiBase, faultApiBase, fetchTimeoutMs });
    console.log('[MapExplorer] availability', { vs30Available, faultAvailable, canPickPoint, isNativePlatform });
    const tileUrl = faultApiBase
      ? `${faultApiBase}/tiles/hazard/{z}/{x}/{y}.png  ← YERELden`
      : 'faultApiBase tanımsız — tile yüklenemiyor';
    console.log('[MapExplorer] tile kaynağı:', tileUrl);
  }, [vs30ApiBase, faultApiBase, fetchTimeoutMs, vs30Available, faultAvailable, canPickPoint]);

  const navigateByDirection = useCallback(
    (direction) => {
      const routeNames = navigation?.getState?.()?.routeNames || [];
      const order = computeTabOrder(routeNames);
      const currentIndex = order.indexOf('MapExplorer');
      if (currentIndex === -1) {
        return;
      }
      const target = direction === 'left' ? order[currentIndex + 1] : order[currentIndex - 1];
      if (!target) {
        return;
      }
      if (target === 'EarthquakeFeed') {
        navigation.navigate('EarthquakeFeed');
        return;
      }
      navigation.navigate(target);
    },
    [navigation]
  );

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const fromTop = evt.nativeEvent?.pageY <= 160;
        const horizontalSwipe = Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy) * 1.4;
        return fromTop && horizontalSwipe;
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx } = gestureState;
        if (dx <= -70) {
          navigateByDirection('left');
        } else if (dx >= 70) {
          navigateByDirection('right');
        }
      },
    })
  ).current;

  const handleRegionChangeComplete = useCallback(
    (nextRegion) => {
      setRegion(nextRegion);
    },
    []
  );

  const toggleHazardMap = useCallback(() => {
    setShowHazardMap((prev) => !prev);
  }, []);

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
        const response = await fetchWithTimeout(`${vs30ApiBase}/vs30?${searchParams.toString()}`, { timeoutMs: fetchTimeoutMs });
        if (!response.ok) {
          throw new Error(`VS30 API error ${response.status}`);
        }
        const payload = await response.json();
        setVs30Info(payload);
      } catch (error) {
        console.warn('[MapExplorer] Vs30 fetch failed', error);
        setVs30Info(null);
        setVs30Error(error?.name === 'AbortError' ? 'Vs30 servisi zaman asimina ugradi.' : 'Vs30 verisi alinmadi.');
      } finally {
        setVs30Loading(false);
      }
    }

    if (faultAvailable) {
      try {
        const response = await fetchWithTimeout(
          `${faultApiBase}/api/fault-distance?${searchParams.toString()}`,
          { timeoutMs: fetchTimeoutMs }
        );
        if (!response.ok) {
          throw new Error(`Fault API error ${response.status}`);
        }
        const payload = await response.json();
        setFaultInfo(payload);
      } catch (error) {
        console.warn('[MapExplorer] Fault fetch failed', error);
        setFaultInfo(null);
        setFaultError(error?.name === 'AbortError' ? 'Fay servisi zaman asimina ugradi.' : 'Fay verisine ulasilamadi.');
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
    <SafeAreaView style={styles.safeArea} {...(swipeResponder?.panHandlers || {})}>
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
              onMapReady={() => setMapReady(true)}
            >
              {showHazardMap && UrlTile && (
                <UrlTile
                  urlTemplate={`${faultApiBase}/tiles/hazard-tiff/{z}/{x}/{y}.png`}
                  opacity={0.85}
                  zIndex={1}
                  minimumZ={1}
                  maximumZ={12}
                  maximumNativeZ={10}
                />
              )}
              {selectedSoilPoint && (
                <Marker coordinate={selectedSoilPoint} pinColor="#f472b6" />
              )}
            </MapView>
            {!mapReady ? (
              <View style={styles.mapPlaceholder} pointerEvents="none">
                <ActivityIndicator color="#f8fafc" />
                <Text style={styles.mapPlaceholderText}>Harita yukleniyor...</Text>
              </View>
            ) : null}

            <View style={styles.overlayStack}>
              <View style={styles.vs30Card}>
                <Text style={styles.vs30Title}>Vs30 Zemin Bilgisi</Text>
                {!vs30Available ? (
                  <Text style={styles.vs30Hint}>
                    .env icinde EXPO_PUBLIC_VS30_API_BASE tanimlamadan kullanilamaz.
                  </Text>
                ) : vs30Loading ? (
                  <View style={styles.vs30Row}>
                    <ActivityIndicator color="#f472b6" size="small" />
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
                    {typeof vs30Info.vs30 === 'number' && (() => {
                      const soil = describeSoilStrength(vs30Info.vs30);
                      if (!soil) return null;
                      return (
                        <Text style={styles.vs30Hint}>
                          <Text style={{ color: soil.color, fontWeight: '800' }}>{soil.level}</Text>
                          {` — ${soil.desc}`}
                        </Text>
                      );
                    })()}
                    {vs30Info.vs30 == null && (
                      <Text style={styles.vs30Hint}>Bu lokasyon için Zemin Vs30 verisi bulunamadı.</Text>
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
                  <Text style={styles.faultTitle}>Sismik Risk Analizi</Text>
                  {!faultAvailable ? (
                    <Text style={styles.faultHint}>.env icinde EXPO_PUBLIC_API_BASE tanimlamadan fay verisi alinmaz.</Text>
                  ) : faultLoading ? (
                    <View style={styles.faultRow}>
                      <ActivityIndicator color="#fde047" size="small" />
                      <Text style={[styles.faultHint, { marginLeft: 10 }]}>Fay verisi yukleniyor...</Text>
                    </View>
                  ) : faultInfo ? (
                    <>
                      {/* Ana skor */}
                      {(() => {
                        const risk = describeFaultRisk(faultInfo.seismic_risk_score ?? faultInfo.proximity_score);
                        return (
                          <View style={styles.riskScoreRow}>
                            <Text style={[styles.riskScoreBig, { color: risk.color }]}>
                              {faultInfo.seismic_risk_score ?? faultInfo.proximity_score ?? '--'}
                            </Text>
                            <Text style={styles.riskScoreMax}>/100</Text>
                            <View style={[styles.riskLevelBadge, { borderColor: risk.color + '55', backgroundColor: risk.color + '18' }]}>
                              <Text style={[styles.riskLevelText, { color: risk.color }]}>{risk.level}</Text>
                            </View>
                          </View>
                        );
                      })()}

                      {/* Bileşenler */}
                      <View style={styles.riskComponents}>
                        <View style={styles.riskComponentRow}>
                          <Text style={styles.riskComponentLabel}>Aktif Fay</Text>
                          <Text style={styles.riskComponentValue}>
                            {faultInfo.distance_km != null ? `${faultInfo.distance_km} km` : '—'}
                          </Text>
                        </View>
                        <View style={styles.riskComponentRow}>
                          <Text style={styles.riskComponentLabel}>Kayma Hızı</Text>
                          <Text style={styles.riskComponentValue}>
                            {faultInfo.slip_rate_mm_per_year != null ? `${faultInfo.slip_rate_mm_per_year} mm/yıl` : '—'}
                          </Text>
                        </View>
                        {faultInfo.regional_hazard_score != null && (
                          <View style={styles.riskComponentRow}>
                            <Text style={styles.riskComponentLabel}>Bölgesel Tehlike</Text>
                            <Text style={[styles.riskComponentValue, { color: '#FDE047' }]}>
                              {faultInfo.regional_hazard_score}/100 (GEM)
                            </Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.faultNote}>{faultInfo.note}</Text>
                    </>
                  ) : faultError ? (
                    <Text style={styles.faultError}>{faultError}</Text>
                  ) : selectedSoilPoint ? (
                    <Text style={styles.faultHint}>Analiz hesaplaniyor...</Text>
                  ) : (
                    <Text style={styles.faultHint}>Haritada uzun basarak sismik risk analizini goster.</Text>
                  )}
                </View>
              )}

              <Text style={styles.overlayNote}>{overlayNote}</Text>
            </View>

            {locating && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#f472b6" />
                <Text style={styles.loadingText}>Konum aliniyor...</Text>
              </View>
            )}

            {errorMessage && (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorOverlayText}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.fab, showHazardMap && styles.fabActive]}
              onPress={toggleHazardMap}
              activeOpacity={0.85}
            >
              <Text style={styles.fabText}>
                {showHazardMap ? 'Haritayı Gizle' : 'Tehlike Haritası'}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: '#0A0A0A',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  mapFallback: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 23, 23, 0.65)',
  },
  mapFallbackTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  mapFallbackText: {
    textAlign: 'center',
    color: '#9CA3AF',
    lineHeight: 24,
    fontSize: 15,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 12, 0.85)', // Dark blur
  },
  mapPlaceholderText: {
    color: '#D1D5DB', // Gray 300
    marginTop: 12,
    fontWeight: '600',
    fontSize: 16,
  },
  overlayStack: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    gap: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(23, 23, 23, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  loadingText: {
    color: '#F9FAFB',
    fontWeight: '600',
    marginLeft: 10,
    fontSize: 14,
  },
  errorOverlay: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(220, 38, 38, 0.95)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorOverlayText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 14,
  },
  vs30Card: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)', // Hem biraz daha mat hem transparan
    borderRadius: 20, // Köşeler ufaltıldı
    padding: 16, // Daraltıldı
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  vs30Title: {
    color: '#94A3B8', // Slate 400
    fontSize: 11, // Ufaltıldı
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  vs30Row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8, // Dar
  },
  vs30Value: {
    fontSize: 26, // Bayağı küçültüldü
    fontWeight: '900',
    color: '#F472B6', // Pink 400
  },
  vs30Unit: {
    color: '#F1F5F9',
    marginLeft: 6,
    fontWeight: '700',
    fontSize: 14,
  },
  vs30Coords: {
    color: '#64748B', 
    marginTop: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  vs30Hint: {
    color: '#CBD5E1', 
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
  },
  vs30Error: {
    color: '#FCA5A5',
    marginTop: 8,
    fontWeight: '700',
    fontSize: 12,
  },
  vs30Badge: {
    marginLeft: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: 'rgba(244, 114, 182, 0.1)', 
    borderWidth: 1,
    borderColor: 'rgba(244, 114, 182, 0.3)',
    alignSelf: 'center',
  },
  vs30BadgeText: {
    color: '#FBCFE8',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  faultCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)', // Slate 900
    borderRadius: 20, // Küçültüldü
    padding: 16, // Küçültüldü
    borderWidth: 1,
    borderColor: '#334155', // Slate 700
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  faultTitle: {
    color: '#94A3B8', // Slate 400
    fontSize: 11, // Küçültüldü
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  faultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8, // Küçültüldü
  },
  riskScoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10,
    gap: 6,
  },
  riskScoreBig: {
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 40,
  },
  riskScoreMax: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '700',
    marginBottom: 2,
  },
  riskLevelBadge: {
    marginLeft: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  riskLevelText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  riskComponents: {
    marginTop: 10,
    gap: 5,
  },
  riskComponentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskComponentLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  riskComponentValue: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
  },
  riskContainer: {
    marginTop: 10,
    alignItems: 'flex-start',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  riskBadgeText: {
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  dimmedDesc: {
    color: '#64748B', // Slate 500
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  faultHint: {
    color: '#CBD5E1',
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
  },
  faultNote: {
    marginTop: 10,
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 20,
  },
  faultError: {
    marginTop: 12,
    color: '#FCA5A5',
    fontWeight: '700',
  },
  overlayNote: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  fabActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.90)',
    borderColor: 'rgba(255, 100, 100, 0.4)',
  },
  fabText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});

export default MapExplorerScreen;
