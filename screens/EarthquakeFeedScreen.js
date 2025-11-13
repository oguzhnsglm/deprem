import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import { getAllEarthquakes } from '../logic/mockEarthquakes';
import PROVINCES from '../logic/provinces';
import PrimaryButton from '../components/PrimaryButton';
import { getProfilePreferences } from '../logic/profileStore';

const EarthquakeFeedScreen = ({ route }) => {
  const dataset = getAllEarthquakes();
  const profilePrefs = getProfilePreferences();
  const initialCity = route.params?.city || profilePrefs.city || 'İstanbul';
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [cityModalVisible, setCityModalVisible] = useState(false);

  const events = useMemo(() => {
    const entry = dataset.find((item) => item.city === selectedCity);
    return entry ? entry.events : [];
  }, [selectedCity, dataset]);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Deprem geçmişi</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setCityModalVisible(true)}
          activeOpacity={0.85}
        >
          <Text style={styles.selectorLabel}>Şehir</Text>
          <Text style={styles.selectorValue}>{selectedCity}</Text>
        </TouchableOpacity>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {events.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.magnitude}>{event.magnitude.toFixed(1)}</Text>
                <View style={styles.headerDetails}>
                  <Text style={styles.location}>{event.location}</Text>
                  <Text style={styles.meta}>
                    {new Date(event.time).toLocaleString('tr-TR')} · {event.depthKm} km
                  </Text>
                </View>
              </View>
              <Text style={styles.eventNote}>
                Bu liste yalnızca bilgi amaçlıdır. Profilindeki eşik değerinden düşük sarsıntılar bildirim tetiklemez. Gerçek
                zamanlı veriler için Google Deprem Haritaları ve AFAD duyurularını takip et.
              </Text>
            </View>
          ))}
          {events.length === 0 ? (
            <Text style={styles.empty}>
              Bu şehir için prototip veri bulunamadı. En güncel veriler için Google Deprem Haritaları ve AFAD’ı takip et.
            </Text>
          ) : null}
        </ScrollView>
      </View>
      <Modal visible={cityModalVisible} transparent animationType="slide" onRequestClose={() => setCityModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Şehri seç</Text>
            <ScrollView style={styles.modalList}>
              {PROVINCES.map((province) => (
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
  selector: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#be185d',
  },
  selectorValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#831843',
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
});

export default EarthquakeFeedScreen;
