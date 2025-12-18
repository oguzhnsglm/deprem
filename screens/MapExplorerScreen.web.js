import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

const MapExplorerScreen = () => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <Text style={styles.title}>Harita ve Risk</Text>
      <Text style={styles.body}>
        Bu ekran harita bileşenlerine (react-native-maps) ihtiyaç duyuyor ve şu an web ortamında desteklenmiyor.
        Lütfen iOS veya Android uygulamasını kullanın.
      </Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#120a0f',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b0508',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#cbd5e1',
    textAlign: 'center',
  },
});

export default MapExplorerScreen;
