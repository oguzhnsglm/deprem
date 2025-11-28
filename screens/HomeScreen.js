import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import { getEarthquakesByCity } from '../logic/mockEarthquakes';
import { getProfilePreferences } from '../logic/profileStore';
import { ensureNotificationSetup, triggerManualThresholdTest } from '../logic/notificationService';

const HomeScreen = ({ navigation }) => {
  const [prefs, setPrefs] = useState(getProfilePreferences());

  useFocusEffect(
    useCallback(() => {
      setPrefs(getProfilePreferences());
    }, [])
  );

  const city = prefs.city || 'İstanbul';
  const alertThreshold = Number(prefs.threshold || 5);

  const earthquakes = useMemo(() => getEarthquakesByCity(city), [city]);
  const informativeEvents = useMemo(
    () => earthquakes.filter((event) => event.magnitude >= 2),
    [earthquakes]
  );
  useEffect(() => {
    ensureNotificationSetup();
  }, []);

  const handleTestNotification = async () => {
    const result = await triggerManualThresholdTest({
      city,
      threshold: alertThreshold,
      events: earthquakes,
    });

    if (result.sent) {
      Alert.alert('Test bildirimi gönderildi', 'Birkaç saniye içinde cihazında görünür.');
      return;
    }

    if (result.reason === 'permission') {
      Alert.alert('İzin gerekli', 'Bildirim izni verilmediği için uyarı gönderilemedi.');
    } else if (result.reason === 'missing-data') {
      Alert.alert('Veri bulunamadı', `${city} için örnek deprem kaydı yok.`);
    } else {
      Alert.alert('Eşik aşılmadı', `${alertThreshold.toFixed(1)}+ sarsıntı olmadığı için test yapılamadı.`);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
        <View style={styles.hero}>
          <TouchableOpacity style={styles.testBadge} onPress={handleTestNotification} activeOpacity={0.8}>
            <Text style={styles.testBadgeText}>Test</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileFab}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
            hitSlop={{ top: 18, bottom: 18, left: 18, right: 18 }}
          >
            <Text style={styles.profileFabText}>Profilim</Text>
          </TouchableOpacity>
          <Text style={styles.heroTitle}>Son Uyarılar</Text>
          <Text style={styles.heroHint}>
            {city} için son sarsıntılar (2.0+). Kaynak: Google Deprem Haritaları örnek datası.
          </Text>
          {informativeEvents.length === 0 ? (
            <Text style={styles.emptyText}>Şu anda bilgi amaçlı kayıt bulunmuyor.</Text>
          ) : (
            informativeEvents.slice(0, 5).map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <Text style={styles.eventMagnitude}>{event.magnitude.toFixed(1)}</Text>
                <View style={styles.eventDetails}>
                  <Text style={styles.eventLocation}>{event.location}</Text>
                  <Text style={styles.eventMeta}>
                    {new Date(event.time).toLocaleString('tr-TR')} · {event.depthKm} km
                  </Text>
                </View>
              </View>
            ))
          )}
          <Text style={styles.cityNote}>Profilimde seçili şehir: {city}</Text>
        </View>

        <View style={styles.actions}>
          {Platform.OS !== 'web' && (
            <PrimaryButton
              title="Konumum"
              onPress={() => navigation.navigate('MapExplorer')}
              colorScheme="mint"
            />
          )}
          <PrimaryButton
            title="Güvenli Alan Analizi"
            onPress={() => navigation.navigate('SafeSpot')}
            colorScheme="mint"
          />
          <PrimaryButton
            title="Acil Durum"
            onPress={() => navigation.navigate('EmergencyStatus')}
            colorScheme="danger"
            style={styles.emergencyButton}
            textStyle={styles.emergencyButtonText}
          />
          <PrimaryButton
            title="Acil Durum Kişileri"
            onPress={() => navigation.navigate('Contacts')}
            colorScheme="mint"
          />
          <PrimaryButton
            title="Deprem Geçmişi"
            onPress={() => navigation.navigate('EarthquakeFeed', { city })}
            colorScheme="mint"
          />
        </View>

        <View style={styles.alertsGrid} />
      </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#fecdd3',
    shadowColor: 'rgba(190, 24, 93, 0.18)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 22,
    elevation: 14,
    position: 'relative',
  },
  profileFab: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#f472b6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(244, 114, 182, 0.5)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  profileFabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  testBadge: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#fecdd3',
    borderWidth: 1,
    borderColor: '#fda4af',
    elevation: 4,
    shadowColor: 'rgba(244, 114, 182, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  testBadgeText: {
    color: '#831843',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#831843',
  },
  heroHint: {
    fontSize: 13,
    color: '#9f1239',
    marginVertical: 8,
  },
  cityNote: {
    marginTop: 12,
    fontSize: 13,
    color: '#be185d',
  },
  actions: {
    marginTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 10,
  },
  emergencyButton: {
    paddingVertical: 28,
    marginTop: 6,
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: 'rgba(239, 68, 68, 0.6)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 18,
  },
  emergencyButtonText: {
    fontSize: 22,
    letterSpacing: 1.2,
  },
  alertsGrid: {
    marginTop: 16,
  },
  emptyText: {
    color: '#831843',
    marginTop: 6,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  eventMagnitude: {
    width: 48,
    fontSize: 20,
    fontWeight: '800',
    color: '#f43f5e',
  },
  eventDetails: {
    flex: 1,
  },
  eventLocation: {
    fontSize: 15,
    fontWeight:  '700',
    color: '#831843',
  },
  eventMeta: {
    fontSize: 12,
    color: '#9f1239',
  },
});

export default HomeScreen;
