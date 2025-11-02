import React, { useEffect, useRef } from 'react';
import { Animated, SafeAreaView, StyleSheet } from 'react-native';

const ScreenWrapper = ({ children }) => {
  const pulse = useRef(new Animated.Value(0)).current;

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
    outputRange: ['#311172', '#4b1bb0'],
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
        style={[styles.blobTop, { transform: [{ translateY: blobTopTranslate }] }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.blobBottom, { transform: [{ translateX: blobBottomTranslate }] }]}
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
    backgroundColor: 'rgba(233, 213, 255, 0.35)',
  },
  blobBottom: {
    position: 'absolute',
    bottom: -140,
    right: -60,
    width: 300,
    height: 300,
    borderRadius: 200,
    backgroundColor: 'rgba(165, 180, 252, 0.35)',
  },
});

export default ScreenWrapper;
