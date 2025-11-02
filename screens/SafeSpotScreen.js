import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import SafeSpotAdvice from '../components/SafeSpotAdvice';
import { getMockSafeSpotAdvice } from '../logic/mockSafeSpotAnalysis';

const SafeSpotScreen = () => {
  const advice = getMockSafeSpotAdvice();

  const handleMockPhoto = () => {
    // TODO: burada ileride yapay zeka fotograf analizi yapilacak
    Alert.alert('Prototip', 'Fotograf cekme ozelligi su an icin yalnizca simulasyondur.');
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>Guvenli Alan Hatirlatmasi</Text>
          <Text style={styles.descriptionText}>
            Depremde cam, aynalar ve devrilebilecek mobilyalardan uzak dur. Ic duvar koseleri ve saglam mobilya
            yanlari en guvenli bolgelerdir.
          </Text>
        </View>

        <View style={styles.photoCard}>
          <Text style={styles.photoTitle}>Alanini kontrol et</Text>
          <Text style={styles.photoText}>
            Cevrenin fotografini cekerek potansiyel riskleri tespit etmeyi planliyoruz. Simdilik mock olarak deneyebilirsin.
          </Text>
          <PrimaryButton title="Fotograf cek (Mock)" onPress={handleMockPhoto} />
          <Text style={styles.photoHint}>Robot destekli analiz yakinda burada olacak.</Text>
        </View>

        <SafeSpotAdvice advice={advice} />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  descriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(194, 181, 255, 0.35)',
    marginBottom: 22,
    shadowColor: '#120235',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f3e8ff',
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(237, 233, 254, 0.85)',
  },
  photoCard: {
    backgroundColor: 'rgba(29, 13, 66, 0.65)',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.35)',
    marginBottom: 16,
  },
  photoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ede9fe',
    marginBottom: 10,
  },
  photoText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(224, 213, 255, 0.8)',
    marginBottom: 14,
  },
  photoHint: {
    marginTop: 12,
    fontSize: 13,
    color: 'rgba(221, 214, 254, 0.7)',
  },
});

export default SafeSpotScreen;
