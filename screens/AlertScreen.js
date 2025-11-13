import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';

const AlertScreen = ({ route }) => {
  const { status = 'İyiyim' } = route.params || {};
  const mockLocation = { latitude: 39.92, longitude: 32.85 };

  // TODO: burada yakınlara otomatik bildirim gidecek

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.statusCard}>
          <Text style={styles.label}>Durumun kaydedildi</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
          <Text style={styles.statusInfo}>
            Bu bilgi panik anında paylaşım için hazırlandı. Yakının, hangi desteği vermesi gerektiğini saniyeler içinde
            öğrenebilir.
          </Text>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>Paylaşılan Konum (Mock)</Text>
          <Text style={styles.locationValue}>
            {mockLocation.latitude.toFixed(2)}, {mockLocation.longitude.toFixed(2)}
          </Text>
          <Text style={styles.locationHint}>
            Konum bilgisi yakında otomatik olarak güncellenecek ve paylaşılacak.
          </Text>
        </View>

        <Text style={styles.note}>
          Bu ekran aile bireylerine gönderilecek bildirimin taslağıdır. Gerçek paylaşım ve acil bildirim entegrasyonları
          prototip sonrası eklenecektir.
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
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#fecdd3',
    shadowColor: 'rgba(190, 24, 93, 0.18)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    elevation: 18,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    letterSpacing: 0.5,
    color: '#be185d',
    marginBottom: 14,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(248, 187, 208, 0.35)',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#f9a8d4',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#9d174d',
    letterSpacing: 0.6,
  },
  statusInfo: {
    fontSize: 15,
    lineHeight: 22,
    color: '#0f172a',
  },
  locationCard: {
    backgroundColor: '#ffe4e6',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 18,
  },
  locationLabel: {
    fontSize: 14,
    letterSpacing: 0.6,
    color: '#be123c',
    textTransform: 'uppercase',
  },
  locationValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#9d174d',
    marginTop: 12,
  },
  locationHint: {
    marginTop: 10,
    fontSize: 13,
    color: '#be185d',
    lineHeight: 19,
  },
  note: {
    fontSize: 13,
    color: '#9f1239',
    lineHeight: 20,
  },
});

export default AlertScreen;
