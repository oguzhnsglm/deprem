import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';

const panicSteps = [
  'Derin nefes al, sağlam bir mobilyanın yanına çök/kapan.',
  'Başını ve enseni kolunla koru, pencerelerden uzak kal.',
  'Ulaşabiliyorsan Acil Durum Kişileri listene “Yardıma ihtiyacım var” bildirimi gönder.',
  'Güvendeysen toplanma alanına çık ve burada tekrar haber ver.',
];

const emergencyNumbers = [
  { label: 'AFAD', value: '122' },
  { label: '112 Acil', value: '112' },
  { label: 'Alo Deprem', value: '184' },
];

const EmergencyStatusScreen = ({ navigation }) => {
  const handleSelectStatus = (status) => {
    navigation.navigate('Alert', { status });
  };

  const handleDial = (number) => {
    Linking.openURL(`tel:${number}`).catch(() => {});
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Panik anında ne yapmalı?</Text>
          {panicSteps.map((step) => (
            <Text key={step} style={styles.step}>
              • {step}
            </Text>
          ))}

          <Text style={styles.emergencyTitle}>Acil numaralar</Text>
          {emergencyNumbers.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={styles.emergencyRow}
              onPress={() => handleDial(item.value)}
              activeOpacity={0.85}
            >
              <Text style={styles.emergencyLabel}>{item.label}</Text>
              <Text style={styles.emergencyValue}>{item.value}</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.note}>
            Numaranın üzerine dokunduğunda telefon uygulaması açılır ve numara otomatik olarak yazılır.
          </Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title="Yardıma ihtiyacım var"
            onPress={() => handleSelectStatus('Yardıma ihtiyacım var')}
            colorScheme="danger"
            style={styles.helpButton}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: '#fecdd3',
    shadowColor: 'rgba(190, 24, 93, 0.15)',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#831843',
    marginBottom: 12,
  },
  step: {
    fontSize: 14,
    color: '#9d174d',
    marginBottom: 8,
    lineHeight: 20,
  },
  emergencyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#be185d',
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  emergencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#fee2e2',
  },
  emergencyLabel: {
    color: '#831843',
    fontWeight: '700',
  },
  emergencyValue: {
    color: '#dc2626',
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  note: {
    marginTop: 10,
    fontSize: 12,
    color: '#9f1239',
  },
  actions: {
    marginTop: 20,
    paddingBottom: 12,
  },
  helpButton: {
    marginTop: 12,
  },
});

export default EmergencyStatusScreen;
