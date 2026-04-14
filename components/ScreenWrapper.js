import React from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';

const VARIANTS = {
  modern: '#0A0F1E',
  pink: '#160E1E',
  crimson: '#1A0E0E',
  green: '#0E1A10',
};

const ScreenWrapper = ({ children, variant = 'modern' }) => {
  const backgroundColor = VARIANTS[variant] || VARIANTS.modern;

  return (
    <View style={[styles.root, { backgroundColor }]}>
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingTop: 20,
  },
});

export default ScreenWrapper;
