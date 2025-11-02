import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SafeSpotAdvice = ({ advice }) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Guvenli Alan Tavsiyesi</Text>
      <Text style={styles.text}>{advice}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(221, 214, 254, 0.5)',
    marginTop: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ede9fe',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    color: 'rgba(237, 233, 254, 0.92)',
    lineHeight: 22,
  },
});

export default SafeSpotAdvice;
