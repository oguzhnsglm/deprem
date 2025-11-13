import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SafeSpotAdvice = ({ advice }) => {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Güvenli Alan Tavsiyesi</Text>
      <Text style={styles.text}>{advice}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#f0fdf4',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#065f46',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    color: '#064e3b',
    lineHeight: 22,
  },
});

export default SafeSpotAdvice;
