import React, { useRef, useMemo } from 'react';
import { Animated, Pressable, Text, StyleSheet } from 'react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const COLOR_SCHEMES = {
  primary: {
    start: '#EF4444', // Red 500
    end: '#DC2626',   // Red 600
    border: '#B91C1C',
    shadow: '#7F1D1D',
    text: '#ffffff',
    ripple: 'rgba(255, 255, 255, 0.2)',
  },
  mint: {
    start: '#10B981', // Emerald 500
    end: '#059669',   // Emerald 600
    border: '#047857',
    shadow: '#064E3B',
    text: '#ffffff',
    ripple: 'rgba(255, 255, 255, 0.2)',
  },
  danger: {
    start: '#DC2626', // Red 600
    end: '#991B1B',   // Red 800
    border: '#7F1D1D',
    shadow: '#450A0A',
    text: '#ffffff',
    ripple: 'rgba(255, 255, 255, 0.3)',
  },
  location: {
    start: '#3B82F6', // Blue 500
    end: '#2563EB',   // Blue 600
    border: '#1D4ED8',
    shadow: '#1E3A8A',
    text: '#ffffff',
    ripple: 'rgba(255, 255, 255, 0.2)',
  },
  outline: {
    start: 'rgba(255, 255, 255, 0.03)',
    end: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.15)',
    shadow: 'transparent',
    text: '#F3F4F6', // Gray 100
    ripple: 'rgba(255, 255, 255, 0.1)',
  }
};

const PrimaryButton = ({ title, onPress, style, textStyle, colorScheme = 'primary', ...rest }) => {
  const scale = useRef(new Animated.Value(1)).current;
  
  const scheme = useMemo(() => {
    if (typeof colorScheme === 'string') {
      return COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.primary;
    }
    return {
      start: colorScheme.start || COLOR_SCHEMES.primary.start,
      end: colorScheme.end || COLOR_SCHEMES.primary.end,
      border: colorScheme.border || COLOR_SCHEMES.primary.border,
      shadow: colorScheme.shadow || COLOR_SCHEMES.primary.shadow,
      text: colorScheme.text || COLOR_SCHEMES.primary.text,
      ripple: colorScheme.ripple || COLOR_SCHEMES.primary.ripple,
    };
  }, [colorScheme]);

  const backgroundColor = scheme.start;
  const shadowOpacity = 0.25;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 25,
      bounciness: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 8,
    }).start();
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      android_ripple={{ color: scheme.ripple, borderless: false }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        style,
        {
          transform: [{ scale }],
          backgroundColor: colorScheme === 'outline' ? scheme.end : backgroundColor,
          borderColor: scheme.border,
          shadowOpacity: colorScheme === 'outline' ? 0 : shadowOpacity,
          shadowColor: scheme.shadow,
        },
      ]}
      {...rest}
    >
      <Text style={[styles.text, { color: scheme.text }, textStyle]}>{title}</Text>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  text: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});

export default PrimaryButton;
