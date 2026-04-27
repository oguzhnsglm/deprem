import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, PanResponder, Platform, SafeAreaView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { computeTabOrder, navigateTabRoute } from '../navigation/tabOrder';
import { getProfilePreferences } from '../logic/profileStore';
import { getCountryConfig } from '../logic/countryConfig';
import { useTranslation } from '../i18n/index';

let MapView = null;
let Marker = null;
let UrlTile = null;
const isNativePlatform = Platform.OS === 'ios' || Platform.OS === 'android';

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
  const { t } = useTranslation();

  const describeSoilStrength = (score) => {
    if (typeof score !== 'number') return null;
    if (score >= 80) return { level: t('riskLevelLow'), color: '#34D399', desc: t('soilVeryLowDesc') }; // Pastel Yeşil
    if (score >= 60) return { level: t('riskLevelLow'), color: '#A3E635', desc: t('soilLowDesc') }; // Pastel Açık Yeşil
    if (score >= 45) return { level: t('riskLevelMedium'), color: '#FDE047', desc: t('soilMediumDesc') }; // Pastel Sarı
    if (score >= 30) return { level: t('riskLevelHigh'), color: '#FDBA74', desc: t('soilHighDesc') }; // Pastel Turuncu
    return { level: t('riskLevelHigh'), color: '#FCA5A5', desc: t('soilVeryHighDesc') }; // Pastel Kırmızı
  };

  const describeFaultRisk = (score) => {
    if (score == null) return { level: t('riskLevelUnknown'), color: '#94A3B8' };
    if (score >= 90)  return { level: t('riskLevelVeryHigh'), color: '#EF4444' };
    if (score >= 70)  return { level: t('riskLevelHigh'),     color: '#F87171' };
    if (score >= 40)  return { level: t('riskLevelMedium'),   color: '#FACC15' };
    return { level: t('riskLevelLow'), color: '#34D399' };
  };

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

  const apiBaseRaw = process.env.EXPO_PUBLIC_API_BASE;
  const vs30ApiBase = normalizeBaseUrl(apiBaseRaw);
  const vs30Available = Boolean(vs30ApiBase && isNativePlatform);

  const faultApiBase = vs30ApiBase;
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
          t('locationPermTitle'),
          t('locationPermMsg'),
          [
            { text: t('ok'), style: 'cancel' },
            { text: t('openSettings'), onPress: () => Linking.openSettings() },
          ]
        );
        setErrorMessage(t('locationPermDenied'));
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
      setErrorMessage(t('locationFailed'));
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
      ? `${faultApiBase}/tiles/hazard-current/{z}/{x}/{y}.png  ← YERELden`
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
        navigateTabRoute(navigation, routeNames, 'MapExplorer', 'EarthquakeFeed');
        return;
      }
      navigateTabRoute(navigation, routeNames, 'MapExplorer', target);
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

  const showRiskInfo = useCallback(() => {
    Alert.alert(t('riskInfoTitle'), t('riskInfoBody'));
  }, [t]);

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
      setVs30Error(t('soilNotAvailable'));
    }

    if (faultAvailable) {
      setFaultLoading(true);
      setFaultError(null);
    } else {
      setFaultInfo(null);
      setFaultError(t('faultNotAvailable'));
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
        setVs30Error(error?.name === 'AbortError' ? t('vs30Timeout') : t('vs30Failed'));
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
        setFaultError(error?.name === 'AbortError' ? t('faultTimeout') : t('faultFailed'));
      } finally {
        setFaultLoading(false);
      }
    }
  }, [faultApiBase, faultAvailable, vs30ApiBase, vs30Available]);


  const overlayNote = useMemo(() => {
    if (!canPickPoint) {
      return t('envConfigHint');
    }
    if (!selectedSoilPoint) {
      return t('longPressHint');
    }
    return `${selectedSoilPoint.latitude.toFixed(4)}, ${selectedSoilPoint.longitude.toFixed(4)}`;
  }, [canPickPoint, selectedSoilPoint, t]);

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
              {showHazardMap && UrlTile && faultApiBase && (
                <UrlTile
                  urlTemplate={`${faultApiBase}/tiles/hazard-current/{z}/{x}/{y}.png`}
                  opacity={0.85}
                  zIndex={1}
                  minimumZ={0}
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
                <Text style={styles.mapPlaceholderText}>{t('loadingMap')}</Text>
              </View>
            ) : null}

            <View style={styles.overlayStack}>
              <View style={styles.analysisCard}>
                <View style={styles.analysisSection}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.faultTitle}>RİSK ANALİZİ</Text>
                    <TouchableOpacity
                      style={styles.infoButton}
                      onPress={showRiskInfo}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={t('riskInfoTitle')}
                    >
                      <Text style={styles.infoButtonText}>i</Text>
                    </TouchableOpacity>
                  </View>

                  {!faultAvailable && !vs30Available ? (
                    <Text style={styles.faultHint}>{t('faultNotAvailable')}</Text>
                  ) : (!faultInfo && !vs30Info && selectedSoilPoint) ? (
                    <View style={styles.faultRow}>
                      <ActivityIndicator color="#fde047" size="small" />
                      <Text style={[styles.faultHint, { marginLeft: 10 }]}>{t('faultCalculating')}</Text>
                    </View>
                  ) : faultInfo || vs30Info ? (
                    <>
                      {/* --- SİSMİK RİSK & BEKLENEN SARSINTI KARTLARI --- */}
                      {faultInfo && (() => {
                        const risk = describeFaultRisk(faultInfo.seismic_risk_score ?? faultInfo.proximity_score);
                        return (
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, paddingBottom: 14, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }}>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                <Text style={{ fontSize: 36, fontWeight: '900', color: risk.color, lineHeight: 40 }}>
                                  {faultInfo.seismic_risk_score ?? faultInfo.proximity_score ?? '--'}
                                </Text>
                                <Text style={{ fontSize: 13, color: '#64748B', marginLeft: 2, fontWeight: '700' }}>/100</Text>
                              </View>
                              <View style={[styles.riskLevelBadge, { borderColor: risk.color + '44', backgroundColor: risk.color + '15', alignSelf: 'flex-start', marginTop: 4, marginLeft: 0 }]}>
                                <Text style={[styles.riskLevelText, { color: risk.color }]}>{risk.level}</Text>
                              </View>
                            </View>

                            {/* Dikey Ayraç */}
                            <View style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 16 }} />

                            {faultInfo.expected_magnitude?.min != null && faultInfo.expected_magnitude?.max != null && (
                              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '700', marginBottom: 2, letterSpacing: 0.5 }}>TAHMİNİ MAKS.</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                  <Text style={{ fontSize: 24, fontWeight: '900', color: '#FDE047', lineHeight: 28 }}>
                                    {faultInfo.expected_magnitude.min.toFixed(1)} - {faultInfo.expected_magnitude.max.toFixed(1)}
                                  </Text>
                                  <Text style={{ fontSize: 13, color: '#FDE047', marginLeft: 4, fontWeight: '800' }}>Mw</Text>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })()}

                      <View style={styles.riskComponents}>
                        {/* --- ZEMİN SERTLİĞİ (VURGULU SUB-COMPONENT) --- */}
                        {/* --- ZEMİN SERTLİĞİ (VURGULU SUB-COMPONENT) --- */}
                        {vs30Available && (() => {
                          const soilScore = vs30Info?.vs30 ? Math.min(100, Math.round((vs30Info.vs30 / 800) * 100)) : 0;
                          const soil = typeof soilScore === 'number' && vs30Info?.vs30 ? describeSoilStrength(soilScore) : null;
                          return (
                            <View style={[styles.riskComponentRow, { marginVertical: 8, paddingVertical: 12, borderBottomWidth: 1, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)', flexDirection: 'column', alignItems: 'stretch' }]}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                {/* SOL TARAF: Etiket ve m/s Değeri */}
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.riskComponentLabel, { fontSize: 13, color: '#CBD5E1' }]}>{t('soilTitle')}</Text>
                                  {vs30Info?.vs30 != null && (
                                    <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2, fontWeight: '600' }}>
                                      {vs30Info.vs30} m/s {vs30Info.soilClass ? `(Sınıf ${vs30Info.soilClass})` : ''}
                                    </Text>
                                  )}
                                </View>
                                
                                {/* SAĞ TARAF: Yüzdelik Skor ve Risk Seviyesi */}
                                {vs30Info ? (
                                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                                    <Text style={{ fontSize: 24, fontWeight: '900', color: soil?.color || '#F472B6' }}>
                                      %{soilScore}
                                    </Text>
                                    {soil && (
                                      <View style={[styles.riskLevelBadge, { borderColor: soil.color + '55', backgroundColor: soil.color + '18', marginLeft: 8, marginBottom: 0 }]}>
                                        <Text style={[styles.riskLevelText, { color: soil.color }]}>{soil.level}</Text>
                                      </View>
                                    )}
                                  </View>
                                ) : vs30Error ? (
                                  <Text style={styles.vs30Error}>{vs30Error}</Text>
                                ) : selectedSoilPoint ? (
                                  <ActivityIndicator color="#f472b6" size="small" />
                                ) : (
                                  <Text style={styles.faultHint}>-</Text>
                                )}
                              </View>
                              
                              {/* AÇIKLAMA METNİ (Geri getirildi) */}
                              {soil?.desc && (
                                <Text style={[styles.faultHint, { marginTop: 6, fontSize: 11 }]}>{soil.desc}</Text>
                              )}
                            </View>
                          );
                        })()}

                        {/* --- DİĞER RİSK ÖZELLİKLERİ --- */}
                        {faultInfo && (
                          <>
                            <View style={styles.riskComponentRow}>
                              <Text style={styles.riskComponentLabel}>{t('faultDistLabel')}</Text>
                              <Text style={styles.riskComponentValue}>
                                {faultInfo.distance_km != null ? `${faultInfo.distance_km} km` : '—'}
                              </Text>
                            </View>
                            <View style={styles.riskComponentRow}>
                              <Text style={styles.riskComponentLabel}>{t('slipRateLabel')}</Text>
                              <Text style={styles.riskComponentValue}>
                                {faultInfo.slip_rate_mm_per_year != null ? `${faultInfo.slip_rate_mm_per_year} ${t('slipRateUnit')}` : '—'}
                              </Text>
                            </View>

                            {/* FAY AÇIKLAMA METNİ (Geri getirildi) */}
                            {faultInfo.note ? (
                              <Text style={[styles.faultNote, { marginTop: 8, fontSize: 11 }]}>{faultInfo.note}</Text>
                            ) : null}
                          </>
                        )}
                      </View>
                    </>
                  ) : (
                    <Text style={styles.faultHint}>{t('faultLongPress')}</Text>
                  )}
                </View>
              </View>

              <Text style={styles.overlayNote}>{overlayNote}</Text>
            </View>

            {locating && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#f472b6" />
                <Text style={styles.loadingText}>{t('locating')}</Text>
              </View>
            )}

            {errorMessage && (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorOverlayText}>{errorMessage}</Text>
              </View>
            )}

            {showHazardMap && (
              <View style={styles.legend}>
                {[
                  { color: '#B80000', label: t('legendHigh') },
                  { color: '#FF7200', label: t('legendMedium') },
                  { color: '#91DA12', label: t('legendLow') },
                  { color: '#2EB9FF', label: t('legendMinimal') },
                ].map(({ color, label }) => (
                  <View key={label} style={styles.legendRow}>
                    <View style={[styles.legendSwatch, { backgroundColor: color }]} />
                    <Text style={styles.legendLabel}>{label}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[styles.fab, showHazardMap && styles.fabActive]}
              onPress={toggleHazardMap}
              activeOpacity={0.85}
            >
              <Text style={styles.fabText}>
                {showHazardMap ? t('hideMap') : t('hazardMap')}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackTitle}>{t('mapLoadFailed')}</Text>
            <Text style={styles.mapFallbackText}>{t('mapPlatformMsg')}</Text>
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
  analysisCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
  },
  analysisSection: {
    padding: 16,
    paddingBottom: 14,
  },
  faultTitle: {
    color: '#94A3B8', // Slate 400
    fontSize: 11, // Küçültüldü
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  infoButtonText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 14,
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
    fontSize: 14,
    color: '#F1F5F9',
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
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  riskComponentValue: {
    color: '#F1F5F9',
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
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
  },
  faultNote: {
    marginTop: 8,
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
  },
  faultError: {
    color: '#FCA5A5',
    marginTop: 8,
    fontSize: 12,
    fontWeight: '700',
  },
  overlayNote: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
  legend: {
    position: 'absolute',
    bottom: 108,
    left: 14,
    backgroundColor: 'rgba(10, 15, 30, 0.78)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    gap: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendLabel: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
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
