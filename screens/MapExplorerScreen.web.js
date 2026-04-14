import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const MapExplorerScreen = () => (
  <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
    <View style={styles.container}>
      <Text style={styles.title}>Harita ve Risk</Text>
      <Text style={styles.body}>
        Bu ekran react-native-maps tabanli native harita bilesenlerine ihtiyac duyuyor ve su an web
        ortaminda desteklenmiyor. Lutfen iOS veya Android uygulamasini kullanin.
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
