import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';

const AlertScreen = ({ route }) => {
  const { status = 'Iyiyim' } = route.params || {};
  const mockLocation = { latitude: 39.92, longitude: 32.85 };

  // TODO: burada yakinlara otomatik bildirim gidecek

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <Text style={styles.label}>Durumun kaydedildi</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
          <Text style={styles.statusInfo}>
            Bu bilgi panik aninda paylasim icin hazirlandi. Yakinin, hangi destegi vermesi gerektigini saniyeler icinde
            ogrenebilir.
          </Text>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>Paylasilan Konum (Mock)</Text>
          <Text style={styles.locationValue}>
            {mockLocation.latitude.toFixed(2)}, {mockLocation.longitude.toFixed(2)}
          </Text>
          <Text style={styles.locationHint}>
            Konum bilgisi yakinda otomatik olarak guncellenecek ve paylasilacak.
          </Text>
        </View>

        <Text style={styles.note}>
          Bu ekran aile bireylerine gonderilecek bildirimin taslagidir. Gercek paylasim ve acil bildirim entegrasyonlari
          prototip sonrasi eklenecektir.
        </Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.4)',
    shadowColor: '#140531',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 18,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    letterSpacing: 0.5,
    color: 'rgba(241, 232, 255, 0.9)',
    marginBottom: 14,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(129, 140, 248, 0.28)',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.55)',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f5f3ff',
    letterSpacing: 0.6,
  },
  statusInfo: {
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(235, 233, 255, 0.85)',
  },
  locationCard: {
    backgroundColor: 'rgba(34, 15, 77, 0.65)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    marginBottom: 18,
  },
  locationLabel: {
    fontSize: 14,
    letterSpacing: 0.6,
    color: 'rgba(221, 214, 254, 0.7)',
    textTransform: 'uppercase',
  },
  locationValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ede9fe',
    marginTop: 12,
  },
  locationHint: {
    marginTop: 10,
    fontSize: 13,
    color: 'rgba(213, 208, 250, 0.75)',
    lineHeight: 19,
  },
  note: {
    fontSize: 13,
    color: 'rgba(221, 214, 254, 0.72)',
    lineHeight: 20,
  },
});

export default AlertScreen;
