import React, { useMemo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { getProfilePreferences } from '../logic/profileStore';
import { ensureNotificationSetup } from '../logic/notificationService';
import { fetchCityEarthquakes } from '../logic/earthquakeSources';

const formatEventMeta = (event) => {
  const dateValue = event?.time ? new Date(event.time) : null;
  const hasValidDate = dateValue && !Number.isNaN(dateValue.getTime());
  const dateText = hasValidDate ? dateValue.toLocaleString('tr-TR') : 'Tarih bilinmiyor';

  const distance =
    Number.isFinite(event?.distanceFromCityKm) && event.distanceFromCityKm > 0
      ? `${Math.round(event.distanceFromCityKm)} km`
      : null;

  const depthText =
    Number.isFinite(event?.depthKm) && event.depthKm > 0 ? `${event.depthKm} km` : 'Derinlik yok';

  const trailing = distance || depthText;
  return `${dateText} · ${trailing}`;
};

const ActionButton = ({ label, onPress, variant = 'default' }) => (
  <TouchableOpacity
    style={[
      styles.actionButton,
      variant === 'danger' && styles.actionButtonDanger,
      variant === 'success' && styles.actionButtonSuccess,
    ]}
    onPress={onPress}
    activeOpacity={0.85}
  >
    <Text
      style={[
        styles.actionButtonText,
        variant === 'danger' && styles.actionButtonDangerText,
        variant === 'success' && styles.actionButtonSuccessText,
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const HomeScreen = ({ navigation }) => {
  const [prefs, setPrefs] = useState(getProfilePreferences());
  const [earthquakeState, setEarthquakeState] = useState({ events: [] });
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [lastError, setLastError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setPrefs(getProfilePreferences());
    }, [])
  );

  const city = prefs.city || 'İstanbul';

  const loadRecentEvents = useCallback(
    async ({ silent = false, cancelRef } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoadingEvents(true);
      }
      setLastError('');

      try {
        const result = await fetchCityEarthquakes({ lookbackDays: 7, minMagnitude: 1.2 });
        if (cancelRef?.current) {
          return;
        }
        setEarthquakeState(result);
      } catch (error) {
        if (cancelRef?.current) {
          return;
        }
        setEarthquakeState({ events: [] });
        setLastError(error?.message || 'Veri kaynaklarına ulaşılamadı.');
      } finally {
        if (cancelRef?.current) {
          return;
        }
        if (silent) {
          setRefreshing(false);
        } else {
          setLoadingEvents(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const cancelRef = { current: false };
    loadRecentEvents({ cancelRef });
    return () => {
      cancelRef.current = true;
    };
  }, [loadRecentEvents]);

  useEffect(() => {
    ensureNotificationSetup();
  }, []);

  const earthquakes = earthquakeState.events || [];
  const primaryEvents = useMemo(
    () => earthquakes.filter((event) => Number(event.magnitude) >= 3),
    [earthquakes]
  );
  const displayEvents = useMemo(() => {
    if (primaryEvents.length > 0) {
      return primaryEvents;
    }
    return earthquakes;
  }, [primaryEvents, earthquakes]);
  const usingFallbackEvents = primaryEvents.length === 0 && earthquakes.length > 0;

  const isLoading = loadingEvents && displayEvents.length === 0;
  const hasNoEvents = !isLoading && displayEvents.length === 0;

  const handleRefreshEvents = () => {
    loadRecentEvents({ silent: true });
  };

  const navigateToMap = useCallback(() => {
    const routeNames = navigation?.getState?.()?.routeNames || [];
    if (routeNames.includes('MapExplorer')) {
      navigation.navigate('MapExplorer');
      return;
    }
    navigation.navigate('EarthquakeFeed', { city });
  }, [city, navigation]);

  return (
    <ScreenWrapper variant="crimson">
      <StatusBar barStyle="light-content" />
      <View style={styles.root}>
        <View style={styles.backgroundLayer}>
          <View style={styles.backgroundGlowTop} />
          <View style={styles.backgroundGlowBottom} />
        </View>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefreshEvents} tintColor="#f8fafc" />
          }
        >
          <View style={styles.card}>
            <View style={styles.appTitleWrapper}>
              <Text style={styles.appTitle}>Deprem Rehberi</Text>
              <View style={styles.appTitleDivider} />
            </View>

            <Text style={styles.sectionTitle}>Son Uyarılar</Text>
            <Text style={styles.sectionSubtitle}>
              {city} için son sarsıntılar (2.0+). Kaynak: Google Deprem Haritaları örnek datası.
            </Text>

            {isLoading ? (
              <View style={styles.loaderRow}>
                <ActivityIndicator color="#f97316" />
                <Text style={styles.loadingText}>Veriler güncelleniyor...</Text>
              </View>
            ) : (
              <View style={styles.alertCard}>
                {hasNoEvents ? (
                  <Text style={styles.emptyText}>{lastError || 'Bu aralıkta kayıt bulunamadı.'}</Text>
                ) : (
                  displayEvents.slice(0, 3).map((event) => (
                    <View key={event.id} style={styles.alertRow}>
                      <View style={styles.magnitudeBadge}>
                        <Text style={styles.magnitudeText}>{Number(event.magnitude).toFixed(1)}</Text>
                      </View>
                      <View style={styles.alertDetails}>
                        <Text style={styles.alertTitle}>{event.location}</Text>
                        <Text style={styles.alertMeta}>{formatEventMeta(event)}</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {usingFallbackEvents ? (
              <Text style={styles.fallbackNote}>3.0+ kayıt yok; son sarsıntıları listeliyoruz.</Text>
            ) : null}

            <Text style={styles.profileNote}>Profilimde seçili şehir: {city}</Text>
          </View>

          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
            <ActionButton label="Güvenli Alan Analizi" variant="success" onPress={() => navigation.navigate('SafeSpot')} />
            <ActionButton label="Acil Durum" variant="danger" onPress={() => navigation.navigate('EmergencyStatus')} />
            <ActionButton label="Acil Durum Kişileri" variant="success" onPress={() => navigation.navigate('Contacts')} />
          </View>
        </ScrollView>

      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 180,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -160,
    left: -120,
    width: 360,
    height: 360,
    borderRadius: 260,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: -220,
    right: -120,
    width: 420,
    height: 420,
    borderRadius: 280,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  card: {
    position: 'relative',
    backgroundColor: 'rgba(10, 10, 12, 0.78)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 26,
    elevation: 14,
  },
  appTitleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  appTitleDivider: {
    width: 120,
    height: 3,
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: '#c2410c',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#e5e7eb',
    lineHeight: 20,
    marginTop: 10,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  loadingText: {
    color: '#e2e8f0',
    fontSize: 13,
    marginLeft: 10,
  },
  alertCard: {
    marginTop: 16,
    backgroundColor: '#0f1114',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 12,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  magnitudeBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#7f1d1d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  magnitudeText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800',
  },
  alertDetails: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  alertMeta: {
    fontSize: 12,
    color: '#cbd5e1',
    marginTop: 2,
  },
  emptyText: {
    color: '#e5e7eb',
    fontSize: 13,
    paddingVertical: 4,
  },
  fallbackNote: {
    color: '#fcd34d',
    fontSize: 12,
    marginTop: 10,
  },
  profileNote: {
    color: '#d1d5db',
    fontSize: 12,
    marginTop: 12,
  },
  quickActions: {
    marginTop: 22,
    alignItems: 'center',
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: '#0f1114',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1f2933',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
    width: '85%',
  },
  actionButtonDanger: {
    backgroundColor: '#b91c1c',
    borderColor: '#dc2626',
    shadowColor: '#dc2626',
    shadowOpacity: 0.7,
  },
  actionButtonSuccess: {
    backgroundColor: '#0f2a1d',
    borderColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOpacity: 0.55,
  },
  actionButtonSuccessText: {
    color: '#d1fae5',
  },
  actionButtonText: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  actionButtonDangerText: {
    color: '#f8fafc',
  },
});

export default HomeScreen;
