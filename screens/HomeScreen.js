import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';
import PrimaryButton from '../components/PrimaryButton';

const HomeScreen = ({ navigation }) => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Aile Destek Modu</Text>
          </View>
          <Text style={styles.title}>Deprem Ani Yardimcisi</Text>
          <Text style={styles.subtitle}>
            Panik aninda sakin kalman icin, evde guvenli noktaya ulasmani ve yakinlarina hizlica haber vermeni
            kolaylastirir.
          </Text>
        </View>

        <View style={styles.quickTips}>
          <Text style={styles.quickTipsTitle}>Hizli Hatirlatma</Text>
          <View>
            <Text style={styles.tipItem}>- Sakin nefes al ve esyalardan uzaklas.</Text>
            <Text style={styles.tipItem}>- Ic duvar kosesi veya saglam mobilya yaninda korun.</Text>
            <Text style={styles.tipItem}>- Durumunu yakininla paylasmayi unutma.</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton title="Guvenli Alan Analizi" onPress={() => navigation.navigate('SafeSpot')} />
          <PrimaryButton title="Acil Durum" onPress={() => navigation.navigate('EmergencyStatus')} />
          <PrimaryButton title="Yakinlarim" onPress={() => navigation.navigate('Contacts')} />
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
  hero: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 22,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(224, 213, 255, 0.36)',
    shadowColor: '#10012a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 14,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(168, 85, 247, 0.3)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(233, 213, 255, 0.45)',
    marginBottom: 12,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#f5f3ff',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fdf4ff',
    letterSpacing: 0.3,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(237, 233, 254, 0.85)',
  },
  quickTips: {
    marginTop: 28,
    padding: 18,
    borderRadius: 20,
    backgroundColor: 'rgba(40, 17, 89, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(157, 129, 238, 0.35)',
  },
  quickTipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4edff',
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  tipItem: {
    color: '#e9d5ff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  actions: {
    marginTop: 24,
    paddingBottom: 16,
  },
});

export default HomeScreen;
