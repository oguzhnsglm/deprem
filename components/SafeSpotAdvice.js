import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SafeSpotAdvice = ({ advice }) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Güvenli Alan Tavsiyesi</Text>
      <View style={styles.divider} />
      <Text style={styles.text}>{advice}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 16,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8', // Sky 400 (or Emerald #34D399) - sticking to Sky for modern AI feel
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  divider: {
    display: 'none', // Kalın eski tarz çizgiyi gizle
  },
  text: {
    fontSize: 15,
    color: '#94A3B8', // Slate 400
    lineHeight: 24,
    fontWeight: '500',
  },
});

export default SafeSpotAdvice;
