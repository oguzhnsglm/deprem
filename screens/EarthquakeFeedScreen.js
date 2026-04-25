import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  RefreshControl,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import { getProfilePreferences } from '../logic/profileStore';
import { fetchCityEarthquakes } from '../logic/earthquakeSources';
import { computeTabOrder, navigateTabRoute } from '../navigation/tabOrder';
import { useTranslation } from '../i18n/index';
import { getCountryConfig } from '../logic/countryConfig';
import {
  getCitiesForCountry,
  getDefaultRegionForCountry,
  resolveRegionLabelForCountry,
} from '../logic/worldCities';

const getValidRegionLabel = (countryCode, candidate, fallback) => {
  const validLabels = getCitiesForCountry(countryCode);
  const resolved = resolveRegionLabelForCountry(countryCode, candidate);
  if (validLabels.includes(resolved)) {
    return resolved;
  }
  return fallback;
};

const EarthquakeFeedScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const profilePrefs = getProfilePreferences();
  const countryCode = profilePrefs.country || 'TR';
  const countryConfig = getCountryConfig(countryCode);
  const citiesForCountry = getCitiesForCountry(countryCode);
  const usesStateRegion = countryConfig?.regionType === 'state';
  const ALL_CITIES_OPTION = t('allRegions');
  const initialCity = getValidRegionLabel(
    countryCode,
    route.params?.city || profilePrefs.city,
    getDefaultRegionForCountry(countryCode) || citiesForCountry[0] || 'Istanbul'
  );
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const lastFetchedCountry = useRef(getProfilePreferences().country || 'TR');
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastError, setLastError] = useState('');
  const [visibleCount, setVisibleCount] = useState(10);
  const lastAppliedRouteCity = useRef();

  const loadCityEvents = useCallback(
    async (cityName, { silent } = {}) => {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setLastError('');

      try {
        const isAllCities = cityName === ALL_CITIES_OPTION;
        const result = await fetchCityEarthquakes({
          city: isAllCities ? undefined : cityName,
          lookbackDays: 2,
          minMagnitude: 1.2,
        });
        setEvents(result.events || []);
        setVisibleCount(10);
      } catch (error) {
        setEvents([]);
        setLastError(error?.message || t('loadFailed'));
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  // When navigating to this screen with a new city param (e.g. after profile save), update selectedCity
  useEffect(() => {
    const paramCity = route.params?.city;
    const routeCityKey = `${countryCode}:${paramCity || ''}`;
    if (!paramCity || lastAppliedRouteCity.current === routeCityKey) {
      return;
    }
    lastAppliedRouteCity.current = routeCityKey;
    const resolvedParamCity = getValidRegionLabel(countryCode, paramCity, null);
    if (resolvedParamCity) {
      setSelectedCity((prev) => (prev === resolvedParamCity ? prev : resolvedParamCity));
    }
  }, [route.params?.city, countryCode]);

  // On every focus: detect country change and reload or reset city accordingly
  useFocusEffect(
    useCallback(() => {
      const prefs = getProfilePreferences();
      const currentCountry = prefs.country || 'TR';
      const validCities = getCitiesForCountry(currentCountry);
      const resolvedCity = resolveRegionLabelForCountry(currentCountry, selectedCity);
      if (selectedCity !== ALL_CITIES_OPTION && resolvedCity !== selectedCity && validCities.includes(resolvedCity)) {
        setSelectedCity(resolvedCity);
      } else if (selectedCity !== ALL_CITIES_OPTION && !validCities.includes(selectedCity)) {
        // City doesn't belong to new country → reset (triggers loadCityEvents via useEffect)
        setSelectedCity(ALL_CITIES_OPTION);
      } else if (lastFetchedCountry.current !== currentCountry) {
        // Country changed but city is still valid → force reload with new country's sources
        lastFetchedCountry.current = currentCountry;
        loadCityEvents(selectedCity);
      }
    }, [selectedCity, ALL_CITIES_OPTION, loadCityEvents])
  );

  useEffect(() => {
    lastFetchedCountry.current = getProfilePreferences().country || 'TR';
    loadCityEvents(selectedCity);
  }, [selectedCity, loadCityEvents]);

  const handleRefresh = () => {
    loadCityEvents(selectedCity, { silent: true });
  };

  const hadEvents = events.length > 0;
  const showAllCities = selectedCity === ALL_CITIES_OPTION;

  const navigateByDirection = useCallback(
    (direction) => {
      const routeNames = navigation?.getState?.()?.routeNames || [];
      const order = computeTabOrder(routeNames);
      const currentIndex = order.indexOf('EarthquakeFeed');
      if (currentIndex === -1) {
        return;
      }
      const target = direction === 'left' ? order[currentIndex + 1] : order[currentIndex - 1];
      if (!target) {
        return;
      }
      if (target === 'EarthquakeFeed') {
        navigateTabRoute(navigation, routeNames, 'EarthquakeFeed', 'EarthquakeFeed', { city: selectedCity });
        return;
      }
      navigateTabRoute(navigation, routeNames, 'EarthquakeFeed', target);
    },
    [navigation, selectedCity]
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
    <ScreenWrapper>
      <View style={styles.container} {...(swipeResponder?.panHandlers || {})}>
        <Text style={styles.title}>{t('regionQuakesTitle', { country: countryConfig.name })}</Text>
        <TouchableOpacity style={styles.modernSelector} onPress={() => setCityModalVisible(true)} activeOpacity={0.85}>
          <Text style={styles.modernSelectorLabel}>{t('displayDatasetLabel')}</Text>
          <View style={styles.modernSelectorValueRow}>
            <Text style={styles.modernSelectorValue}>{selectedCity}</Text>
            <Text style={styles.modernSelectorArrow}>▼</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>{t('informationalOnlyShort')}</Text>

        {lastError ? <Text style={styles.errorText}>{lastError}</Text> : null}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#f8fafc" />
            <Text style={styles.loaderText}>{t('loadingData')}</Text>
          </View>
        ) : null}
        {showAllCities ? (
          <Text style={styles.allHint}>{t('allCountryHint', { country: countryConfig.name })}</Text>
        ) : null}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f8fafc" />}
        >
          {events.slice(0, visibleCount).map((event) => (
            <View key={`${event.source}-${event.id}`} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.magnitudeContainer}>
                  <Text style={styles.magnitude}>{Number(event.magnitude).toFixed(1)}</Text>
                </View>
                <View style={styles.headerDetails}>
                  <Text style={styles.location}>{event.location}</Text>
                  <Text style={styles.meta}>
                    {new Date(event.time).toLocaleString('tr-TR')} • {event.depthKm ?? '?'} km • {event.source}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {visibleCount < events.length && !loading ? (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={() => setVisibleCount((prev) => prev + 10)}
              activeOpacity={0.8}
            >
              <Text style={styles.loadMoreText}>{t('showMoreLeft', { count: events.length - visibleCount })}</Text>
            </TouchableOpacity>
          ) : null}

          {!hadEvents && !loading ? (
            <Text style={styles.empty}>
              {showAllCities ? t('noRecordsAll') : (usesStateRegion ? t('noRecordsRegion') : t('noRecordsCity'))}
            </Text>
          ) : null}
        </ScrollView>
      </View>

      <Modal visible={cityModalVisible} transparent animationType="slide" onRequestClose={() => setCityModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{usesStateRegion ? t('selectRegionModal') : t('selectCityModal')}</Text>
            <ScrollView style={styles.modalList}>
              {[ALL_CITIES_OPTION, ...citiesForCountry].map((province) => (
                <TouchableOpacity
                  key={province}
                  style={[styles.modalItem, province === selectedCity && styles.modalItemActive]}
                  onPress={() => {
                    setSelectedCity(province);
                    setCityModalVisible(false);
                  }}
                >
                  <Text style={[styles.modalItemText, province === selectedCity && styles.modalItemTextActive]}>
                    {province}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <PrimaryButton title={t('close')} onPress={() => setCityModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 45, // Çentik payı eklendi
  },
  title: {
    fontSize: 20, // Küçültüldü
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  modernSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 6,
  },
  modernSelectorLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginRight: 8,
  },
  modernSelectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  modernSelectorValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8', // Sky 400
  },
  modernSelectorArrow: {
    marginLeft: 6,
    fontSize: 10,
    color: '#38BDF8',
  },
  disclaimerText: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    marginTop: -10,
    marginBottom: 14,
  },
  errorText: {
    color: '#FCA5A5',
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 220, // Modern floating bar pass
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.7)', // Deep Slate translucent
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  magnitudeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 14,
    marginRight: 14,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  magnitude: {
    color: '#e11d48', // Red 600 orjinal renk
    fontSize: 22,
    fontWeight: '700', // Eski ağırlık
  },
  headerDetails: {
    flex: 1,
    gap: 6,
  },
  location: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F1F5F9', // Slate 100
    letterSpacing: 0.2,
  },
  meta: {
    fontSize: 12,
    color: '#94A3B8', // Slate 400
    fontWeight: '600',
  },
  empty: {
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    padding: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
  },
  loadMoreText: {
    color: '#CBD5E1', // Slate 300
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)', // Deep Slate backdrop
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F172A', // Slate 900
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    padding: 24,
    paddingTop: 32,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalList: {
    marginBottom: 24,
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  modalItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)', // Sky tint for active item
    borderRadius: 12,
    borderBottomWidth: 0,
    marginTop: 4,
    marginBottom: 4,
  },
  modalItemText: {
    color: '#94A3B8',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalItemTextActive: {
    fontWeight: '800',
    color: '#38BDF8', // Sky 400
  },
  loader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 30,
  },
  loaderText: {
    marginLeft: 12,
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 15,
  },
  allHint: {
    fontSize: 12,
    color: '#38BDF8',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default EarthquakeFeedScreen;

