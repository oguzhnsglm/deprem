import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PrimaryButton = ({ title, onPress, style, textStyle, ...rest }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulsate = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2400, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 2400, useNativeDriver: false }),
      ])
    );
    pulsate.start();
    return () => pulsate.stop();
  }, [glow]);

  const backgroundColor = glow.interpolate({
    inputRange: [0, 1],
    outputRange: ['#9b5df5', '#7c3aed'],
  });

  const shadowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 0.32],
  });

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: false,
      speed: 20,
      bounciness: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: false,
      speed: 16,
      bounciness: 7,
    }).start();
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      android_ripple={{ color: 'rgba(255, 255, 255, 0.25)' }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        style,
        {
          transform: [{ scale }],
          backgroundColor,
          shadowOpacity,
        },
      ]}
      {...rest}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    elevation: 6,
    shadowColor: '#1f0a4e',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});

export default PrimaryButton;
