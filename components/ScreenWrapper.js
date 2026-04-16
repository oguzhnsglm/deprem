import React from 'react';
import { View, SafeAreaView, StyleSheet } from 'react-native';

const VARIANTS = {
  modern: '#0A0F1E',
  pink: '#0A0F1E',
  crimson: '#0A0F1E',
  green: '#0A0F1E',
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
