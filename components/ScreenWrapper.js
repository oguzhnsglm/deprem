import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, StyleSheet } from 'react-native';

const VARIANTS = {
  pink: {
    background: ['#130606', '#2b0b0b'],
    blobTop: 'rgba(127, 29, 29, 0.35)',
    blobBottom: 'rgba(69, 10, 10, 0.4)',
  },
  crimson: {
    background: ['#090205', '#1b0a0f'],
    blobTop: 'rgba(153, 27, 27, 0.3)',
    blobBottom: 'rgba(76, 5, 25, 0.4)',
  },
  green: {
    background: ['#140808', '#250d0d'],
    blobTop: 'rgba(190, 18, 60, 0.35)',
    blobBottom: 'rgba(67, 20, 7, 0.35)',
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
    backgroundColor: '#0b0508',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    backgroundColor: 'transparent',
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
