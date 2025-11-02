import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';

const EmergencyStatusScreen = ({ navigation }) => {
  const handleSelectStatus = (status) => {
    navigation.navigate('Alert', { status });
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Durumunu sec</Text>
          <Text style={styles.subtitle}>
            Bir secenek belirlediginde bilgin guvenli sekilde bildirim ekranina tasinir. Ani durumlarda tek dokunusla
            haber verebilirsin.
          </Text>
          <View style={styles.statusHints}>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>Guvenli misin?</Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>Yardim gerekiyor mu?</Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="Iyiyim" onPress={() => handleSelectStatus('Iyiyim')} />
          <PrimaryButton title="Yardima ihtiyacim var" onPress={() => handleSelectStatus('Yardima ihtiyacim var')} />
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
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(216, 180, 254, 0.4)',
    shadowColor: '#150236',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 22,
    elevation: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fdf4ff',
    letterSpacing: 0.4,
  },
  subtitle: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 23,
    color: 'rgba(237, 233, 254, 0.85)',
  },
  statusHints: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(147, 112, 219, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(196, 181, 253, 0.45)',
    marginRight: 10,
    marginBottom: 10,
  },
  statusPillText: {
    color: '#f4edff',
    fontWeight: '600',
    letterSpacing: 0.5,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  actions: {
    marginTop: 20,
    paddingBottom: 12,
  },
});

export default EmergencyStatusScreen;
