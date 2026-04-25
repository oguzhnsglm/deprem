import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  PanResponder,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import { getProfilePreferences } from '../logic/profileStore';
import { fetchCityEarthquakes } from '../logic/earthquakeSources';
import { getCountryConfig } from '../logic/countryConfig';
import { computeTabOrder, navigateTabRoute } from '../navigation/tabOrder';
import { useTranslation } from '../i18n/index';

const formatEventMeta = (event, t) => {
  const dateValue = event?.time ? new Date(event.time) : null;
  const hasValidDate = dateValue && !Number.isNaN(dateValue.getTime());
  const dateText = hasValidDate ? dateValue.toLocaleString('tr-TR') : t('unknownDate');

  const distance =
    Number.isFinite(event?.distanceFromCityKm) && event.distanceFromCityKm > 0
      ? `${Math.round(event.distanceFromCityKm)} km`
      : null;

  const depthText =
    Number.isFinite(event?.depthKm) && event.depthKm > 0 ? `${event.depthKm} km` : t('noDepth');

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
  const { t } = useTranslation();
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

  const countryCode = prefs.country || 'TR';
  const countryConfig = getCountryConfig(countryCode);

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
        const result = await fetchCityEarthquakes({ lookbackDays: 2, minMagnitude: 1.2 });
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
    [countryCode]
  );

  useEffect(() => {
    const cancelRef = { current: false };
    loadRecentEvents({ cancelRef });
    return () => {
      cancelRef.current = true;
    };
  }, [loadRecentEvents]);

  const earthquakes = useMemo(() => earthquakeState.events || [], [earthquakeState.events]);
  const displayEvents = useMemo(() => earthquakes.slice(0, 3), [earthquakes]);
  const sourceText = countryConfig.sourceLabel || t('source');

  const isLoading = loadingEvents && earthquakes.length === 0;
  const hasNoEvents = !isLoading && earthquakes.length === 0;

  const handleRefreshEvents = () => {
    loadRecentEvents({ silent: true });
  };

  const navigateByDirection = useCallback(
    (direction) => {
      const routeNames = navigation?.getState?.()?.routeNames || [];
      const order = computeTabOrder(routeNames);
      const currentIndex = order.indexOf('Home');
      if (currentIndex === -1) {
        return;
      }
      const target = direction === 'left' ? order[currentIndex + 1] : order[currentIndex - 1];
      if (!target) {
        return;
      }
      if (target === 'EarthquakeFeed') {
        navigateTabRoute(navigation, routeNames, 'Home', 'EarthquakeFeed', { city });
        return;
      }
      navigateTabRoute(navigation, routeNames, 'Home', target);
    },
    [city, navigation]
  );

  const swipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        const horizontalSwipe = Math.abs(dx) > 26 && Math.abs(dx) > Math.abs(dy) * 1.4;
        return horizontalSwipe;
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

  return (
    <ScreenWrapper variant="modern">
      <StatusBar barStyle="light-content" />
      <View style={styles.root} {...(swipeResponder?.panHandlers || {})}>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefreshEvents} tintColor="#38BDF8" />
          }
        >
          <View style={styles.feedHeader}>
            <View>
              <Text style={styles.greetingText}>{t('greeting')}</Text>
              <Text style={styles.sectionTitle}>{t('recentEarthquakes')}</Text>
            </View>
            <Text style={styles.sourceLabel}>{sourceText}</Text>
          </View>
          <Text style={styles.disclaimerText}>{t('informationalOnlyShort')}</Text>

          {isLoading ? (
            <View style={styles.loaderRow}>
              <ActivityIndicator color="#38BDF8" size="large" />
              <Text style={styles.loadingText}>{t('scanningEarthquakes')}</Text>
            </View>
          ) : (
            <View style={styles.eventList}>
              {hasNoEvents ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>{lastError || t('noData')}</Text>
                </View>
              ) : (
                displayEvents.map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.magnitudeContainer}>
                      <Text style={styles.magnitudeText}>{Number(event.magnitude).toFixed(1)}</Text>
                    </View>
                    <View style={styles.alertDetails}>
                      <Text style={styles.alertTitle}>{event.location}</Text>
                      <Text style={styles.alertMeta}>{event.source ? `${event.source} - ${formatEventMeta(event, t)}` : formatEventMeta(event, t)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {!isLoading && !hasNoEvents ? (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => navigation.navigate('EarthquakeFeed')}
              activeOpacity={0.8}
            >
              <Text style={styles.moreButtonText}>{t('showMore')}</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.quickActions}>
            <Text style={styles.actionsTitle}>{t('preparationTitle')}</Text>
            <ActionButton label={t('safeSpotBtn')} variant="success" onPress={() => navigation.navigate('SafeSpot')} />
            <ActionButton label={t('panicBtn')} variant="danger" onPress={() => navigation.navigate('EmergencyStatus')} />
            <ActionButton label={t('contactsBtn')} variant="success" onPress={() => navigation.navigate('Contacts')} />
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 20, // PanResponder catches edge properly now
    paddingTop: 45, // Çentik (notch) payı ucu ucuna ayarlandı
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 220, // Alt barda kaybolmaması ve alta yapışmaması için büyük boşluk
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 0, // paddingTop eklendiği için bu sıfırlandı
  },
  greetingText: {
    fontSize: 12, // Daha da ufak
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18, // Biraz daha küçüldü
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  sourceLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#38BDF8', // Sky 400
    letterSpacing: 0.8,
    marginBottom: 2,
    maxWidth: 150,
    textAlign: 'right',
    textTransform: 'uppercase',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  disclaimerText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  loaderRow: {
    paddingVertical: 14,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  eventList: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 16,
    padding: 14, // Ferahlatıldı
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  magnitudeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 16,
    marginRight: 16,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  magnitudeText: {
    color: '#e11d48',
    fontSize: 21, // Dengeli boyuta çekildi
    fontWeight: '700',
  },
  alertDetails: {
    flex: 1,
    gap: 4,
  },
  alertTitle: {
    fontSize: 14, // Okunabilir boyut
    fontWeight: '800',
    color: '#F1F5F9', // Slate 100
    letterSpacing: 0.2,
  },
  alertMeta: {
    fontSize: 12,
    color: '#94A3B8', // Slate 400
    fontWeight: '600',
  },
  moreButton: {
    alignSelf: 'flex-start',
    marginTop: 12, // Dar boşluk
    paddingHorizontal: 12, // Tuşu ufalt
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  moreButtonText: {
    color: '#CBD5E1', // Slate 300
    fontSize: 12, // Fontunu küçült
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  quickActions: {
    marginTop: 24, // Yukarı çekildi
  },
  actionsTitle: {
    fontSize: 18, // Biraz küçültüldü
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 12, // Düşürüldü
  },
  actionButton: {
    marginBottom: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // Slate 800 tint
    paddingVertical: 20,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionButtonDanger: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)', // Red tint
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  actionButtonSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  actionButtonSuccessText: {
    color: '#34D399', // Emerald 400
  },
  actionButtonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  actionButtonDangerText: {
    color: '#FCA5A5',
  },
});

export default HomeScreen;
