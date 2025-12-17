import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import PROVINCES from '../logic/provinces';
import PrimaryButton from '../components/PrimaryButton';
import { getProfilePreferences } from '../logic/profileStore';
import { fetchCityEarthquakes } from '../logic/earthquakeSources';
import { computeTabOrder } from '../navigation/tabOrder';

const ALL_CITIES_OPTION = 'Tum Sehirler';

const EarthquakeFeedScreen = ({ route, navigation }) => {
  const profilePrefs = getProfilePreferences();
  const initialCity = route.params?.city || profilePrefs.city || 'Istanbul';
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastError, setLastError] = useState('');

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
          lookbackDays: 60,
          minMagnitude: 1.2,
        });
        setEvents(result.events || []);
      } catch (error) {
        setEvents([]);
        setLastError(error?.message || 'Veri yüklenemedi.');
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

  useEffect(() => {
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
        navigation.navigate('EarthquakeFeed', { city: selectedCity });
        return;
      }
      navigation.navigate(target);
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
        <View style={styles.headerRow}>
          <Text style={styles.title}>Deprem Gecmisi</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshMiniButton} activeOpacity={0.8}>
            <Text style={styles.refreshMiniText}>Yenile</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.selector} onPress={() => setCityModalVisible(true)} activeOpacity={0.85}>
          <View style={styles.selectorValueRow}>
            <View>
              <Text style={styles.selectorLabel}>Sehir</Text>
              <Text style={styles.selectorValue}>{selectedCity}</Text>
            </View>
            <Text style={styles.selectorArrow}>v</Text>
          </View>
        </TouchableOpacity>

        {lastError ? <Text style={styles.errorText}>{lastError}</Text> : null}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#f8fafc" />
            <Text style={styles.loaderText}>Veriler çekiliyor...</Text>
          </View>
        ) : null}
        {showAllCities ? (
          <Text style={styles.allHint}>Tüm Türkiye için 60 günlük 1.2+ kayıtlar listelenir.</Text>
        ) : null}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#f8fafc" />}
        >
          {events.map((event) => (
            <View key={`${event.source}-${event.id}`} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.magnitude}>{Number(event.magnitude).toFixed(1)}</Text>
                <View style={styles.headerDetails}>
                  <Text style={styles.location}>{event.location}</Text>
                  <Text style={styles.meta}>
                    {new Date(event.time).toLocaleString('tr-TR')} - {event.depthKm ?? '?'} km - {event.source}
                  </Text>
                </View>
              </View>
              <Text style={styles.eventNote}>
                Bu liste bilgilendirme amaclidir. Kritik duyurular icin resmi kurum bildirimlerini takip et.
              </Text>
            </View>
          ))}

          {!hadEvents && !loading ? (
            <Text style={styles.empty}>
              {showAllCities
                ? 'Bu tarih aralığında kayıt bulunamadı. Resmi bildirimler için AFAD ve Kandilli kanallarını kontrol et.'
                : 'Bu şehir için seçilen tarih aralığında kayıt bulunamadı. Resmi bildirimler için AFAD ve Kandilli kanallarını kontrol et.'}
            </Text>
          ) : null}
        </ScrollView>
      </View>

      <Modal visible={cityModalVisible} transparent animationType="slide" onRequestClose={() => setCityModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Şehri seç</Text>
            <ScrollView style={styles.modalList}>
              {[ALL_CITIES_OPTION, ...PROVINCES].map((province) => (
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
            <PrimaryButton title="Kapat" onPress={() => setCityModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  refreshMiniButton: {
    position: 'absolute',
    right: 0,
    top: 2,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(187, 247, 208, 0.8)',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  refreshMiniText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
  },
  selector: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2933',
    backgroundColor: '#120a0f',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 10,
  },
  selectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  selectorLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#f8fafc',
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  selectorArrow: {
    marginLeft: 12,
    fontSize: 30,
    color: '#f97316',
    fontWeight: '900',
  },
  errorText: {
    color: '#f97316',
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 160,
  },
  eventCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1f2933',
    backgroundColor: '#0f1114',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  magnitude: {
    fontSize: 30,
    fontWeight: '800',
    color: '#dc2626',
    marginRight: 12,
  },
  headerDetails: {
    flex: 1,
  },
  location: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
  },
  meta: {
    fontSize: 13,
    color: '#f59e0b',
  },
  eventNote: {
    fontSize: 13,
    color: '#f97316',
  },
  empty: {
    color: '#f8fafc',
    textAlign: 'center',
    marginTop: 40,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f1114',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 12,
  },
  modalList: {
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2933',
  },
  modalItemActive: {
    backgroundColor: '#120a0f',
  },
  modalItemText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  modalItemTextActive: {
    fontWeight: '700',
  },
  loader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loaderText: {
    marginLeft: 8,
    color: '#f8fafc',
  },
  allHint: {
    fontSize: 12,
    color: '#f59e0b',
    marginBottom: 8,
  },
});

export default EarthquakeFeedScreen;

