import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PROVINCES from '../logic/provinces';
import PrimaryButton from '../components/PrimaryButton';
import { getProfilePreferences } from '../logic/profileStore';
import { fetchCityEarthquakes } from '../logic/earthquakeSources';

const ALL_CITIES_OPTION = 'Tüm Şehirler';

const EarthquakeFeedScreen = ({ route }) => {
  const profilePrefs = getProfilePreferences();
  const initialCity = route.params?.city || profilePrefs.city || 'İstanbul';
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

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Deprem geçmişi</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshMiniButton} activeOpacity={0.8}>
            <Text style={styles.refreshMiniText}>Yenile</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.selector} onPress={() => setCityModalVisible(true)} activeOpacity={0.85}>
          <View style={styles.selectorValueRow}>
            <View>
              <Text style={styles.selectorLabel}>Şehir</Text>
              <Text style={styles.selectorValue}>{selectedCity}</Text>
            </View>
            <Text style={styles.selectorArrow}>{'∨'}</Text>
          </View>
        </TouchableOpacity>

        {lastError ? <Text style={styles.errorText}>{lastError}</Text> : null}
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color="#be185d" />
            <Text style={styles.loaderText}>Veriler çekiliyor...</Text>
          </View>
        ) : null}
        {showAllCities ? (
          <Text style={styles.allHint}>Tüm Türkiye için 60 günlük 1.2+ kayıtlar listelenir.</Text>
        ) : null}

        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#be185d" />}
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
    color: '#831843',
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
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
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
    color: '#be185d',
    marginBottom: 2,
  },
  selectorValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#831843',
  },
  selectorArrow: {
    marginLeft: 12,
    fontSize: 30,
    color: '#6b021a',
    fontWeight: '900',
  },
  errorText: {
    color: '#b91c1c',
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 48,
  },
  eventCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#ffffff',
    padding: 16,
    marginBottom: 14,
    shadowColor: 'rgba(190, 24, 93, 0.12)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
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
    color: '#831843',
  },
  meta: {
    fontSize: 13,
    color: '#9f1239',
  },
  eventNote: {
    fontSize: 13,
    color: '#9d174d',
  },
  empty: {
    color: '#831843',
    textAlign: 'center',
    marginTop: 40,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    maxHeight: '75%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
  },
  modalList: {
    marginBottom: 16,
  },
  modalItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fde2e4',
  },
  modalItemActive: {
    backgroundColor: '#fff1f2',
  },
  modalItemText: {
    color: '#831843',
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
    color: '#be185d',
  },
  allHint: {
    fontSize: 12,
    color: '#9f1239',
    marginBottom: 8,
  },
});

export default EarthquakeFeedScreen;
