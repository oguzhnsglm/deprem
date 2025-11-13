import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';

const EMERGENCY_NUMBERS = [
  { label: 'AFAD 122', value: '122' },
  { label: '112 Acil', value: '112' },
  { label: 'Alo Deprem 184', value: '184' },
];

const AlertScreen = ({ route }) => {
  const { status = 'İyiyim' } = route.params || {};
  const handleDial = (number) => {
    Linking.openURL(`tel:${number}`).catch(() => {});
  };

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
          <Text style={styles.statusNote}>
            Kaydettiğin acil durum kişilerine bildirim gönderildi. Eğer durum kritikse aşağıdaki acil numaralardan birini
            aramayı unutma.
          </Text>
        </View>

        <View style={styles.emergencyButtons}>
          {EMERGENCY_NUMBERS.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={styles.emergencyButton}
              onPress={() => handleDial(item.value)}
              activeOpacity={0.85}
            >
              <Text style={styles.emergencyButtonText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.emergencyHint}>Numaraya dokunduğunda telefon uygulaması açılır.</Text>
        </View>

        <Text style={styles.note}>
          Bu ekran aile bireylerine gönderilecek bildirimin taslağıdır. Konum bilgilerinin otomatik paylaşımı ve acil bildirim
          entegrasyonları prototip sonrasında eklenecektir.
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
    marginBottom: 12,
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
  statusNote: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    color: '#be185d',
  },
  emergencyButtons: {
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: '#dc2626',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginBottom: 12,
    marginHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(220, 38, 38, 0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  emergencyHint: {
    textAlign: 'center',
    color: '#be185d',
    marginTop: 4,
    fontSize: 12,
  },
  note: {
    fontSize: 13,
    color: '#9f1239',
    lineHeight: 20,
  },
});

export default AlertScreen;
