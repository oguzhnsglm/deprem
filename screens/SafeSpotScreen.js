import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';
import SafeSpotAdvice from '../components/SafeSpotAdvice';
import { getMockSafeSpotAdvice } from '../logic/mockSafeSpotAnalysis';

const SafeSpotScreen = () => {
  const advice = getMockSafeSpotAdvice();

  const handleMockPhoto = () => {
    // TODO: burada ileride yapay zeka fotoğraf analizi yapılacak
    Alert.alert('Prototip', 'Fotoğraf çekme özelliği şu an için yalnızca simülasyondur.');
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionTitle}>Güvenli Alan Hatırlatması</Text>
          <Text style={styles.descriptionText}>
            Depremde cam, aynalar ve devrilebilecek mobilyalardan uzak dur. İç duvar köşeleri ve sağlam mobilya
            yanları en güvenli bölgelerdir.
          </Text>
        </View>

        <View style={styles.photoCard}>
          <Text style={styles.photoTitle}>Alanını kontrol et</Text>
          <Text style={styles.photoText}>
            Çevrenin fotoğrafını çekerek potansiyel riskleri tespit etmeyi planlıyoruz. Şimdilik mock olarak deneyebilirsin.
          </Text>
          <PrimaryButton title="Fotoğraf çek (Mock)" onPress={handleMockPhoto} />
          <Text style={styles.photoHint}>Robot destekli analiz yakında burada olacak.</Text>
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
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 22,
    shadowColor: 'rgba(190, 24, 93, 0.08)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 16,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#831843',
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#9f1239',
  },
  photoCard: {
    backgroundColor: '#ffe4e6',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#fecdd3',
    marginBottom: 16,
  },
  photoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#be185d',
    marginBottom: 10,
  },
  photoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#9f1239',
    marginBottom: 14,
  },
  photoHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#be185d',
  },
});

export default SafeSpotScreen;
