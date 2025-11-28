import React, { useEffect, useRef, useMemo } from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLOR_SCHEMES = {
  primary: {
    start: '#f9a8d4',
    end: '#ec4899',
    shadow: '#9f1239',
    ripple: 'rgba(255, 255, 255, 0.25)',
  },
  mint: {
    start: '#34d399',
    end: '#059669',
    shadow: '#064e3b',
    ripple: 'rgba(255, 255, 255, 0.2)',
  },
  danger: {
    start: '#fb7185',
    end: '#dc2626',
    shadow: '#7f1d1d',
    ripple: 'rgba(252, 165, 165, 0.35)',
  },
  location: {
    start: '#4ade80',
    end: '#16a34a',
    shadow: '#14532d',
    ripple: 'rgba(255, 255, 255, 0.2)',
  },
};

const PrimaryButton = ({ title, onPress, style, textStyle, colorScheme = 'primary', ...rest }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const scheme = useMemo(() => {
    if (typeof colorScheme === 'string') {
      return COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.primary;
    }
    return {
      start: colorScheme.start || COLOR_SCHEMES.primary.start,
      end: colorScheme.end || COLOR_SCHEMES.primary.end,
      shadow: colorScheme.shadow || COLOR_SCHEMES.primary.shadow,
      ripple: colorScheme.ripple || COLOR_SCHEMES.primary.ripple,
    };
  }, [colorScheme]);

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
    outputRange: [scheme.start, scheme.end],
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
      android_ripple={{ color: scheme.ripple }}
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
          shadowColor: scheme.shadow,
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
    textAlign: 'center',
  },
});

export default PrimaryButton;
