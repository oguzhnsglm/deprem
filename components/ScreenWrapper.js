import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, StyleSheet } from 'react-native';

const VARIANTS = {
  pink: {
    background: ['#fff1f2', '#ffe4e6'],
    blobTop: 'rgba(251, 207, 232, 0.6)',
    blobBottom: 'rgba(254, 226, 226, 0.55)',
  },
  crimson: {
    background: ['#1a0c12', '#3b0f18'],
    blobTop: 'rgba(255, 76, 112, 0.28)',
    blobBottom: 'rgba(120, 15, 40, 0.38)',
  },
  green: {
    background: ['#c7f9cc', '#e8f8f5'],
    blobTop: 'rgba(74, 222, 128, 0.35)',
    blobBottom: 'rgba(187, 247, 208, 0.5)',
  },
};

const ScreenWrapper = ({ children, variant = 'crimson' }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const scheme = VARIANTS[variant] || VARIANTS.pink;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 6000,
          useNativeDriver: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 6000,
          useNativeDriver: false,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const background = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: scheme.background,
  });

  const blobTopTranslate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 30],
  });

  const blobBottomTranslate = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [20, -20],
  });

  return (
    <Animated.View style={[styles.root, { backgroundColor: background }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobTop,
          { backgroundColor: scheme.blobTop, transform: [{ translateY: blobTopTranslate }] },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.blobBottom,
          { backgroundColor: scheme.blobBottom, transform: [{ translateX: blobBottomTranslate }] },
        ]}
      />
      <SafeAreaView style={styles.safeArea}>{children}</SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  blobTop: {
    position: 'absolute',
    top: -90,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 200,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -140,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 200,
  },
});

export default ScreenWrapper;
