import React, { useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BottomNavBar = ({ activeTab = 'home', city, floating = false, navigation }) => {
  if (!navigation) {
    return null;
  }

  const routeNames = navigation?.getState?.()?.routeNames || [];
  const hasMapExplorer = routeNames.includes('MapExplorer');
  const selectedCity = city || 'Istanbul';
  const AnimatedTouchable = useMemo(() => Animated.createAnimatedComponent(TouchableOpacity), []);

  const handleNavigate = (key) => {
    if (!navigation) {
      return;
    }
    switch (key) {
      case 'home':
        navigation.navigate('Home');
        break;
      case 'map':
        if (hasMapExplorer) {
          navigation.navigate('MapExplorer');
        } else {
          navigation.navigate('EarthquakeFeed', { city: selectedCity });
        }
        break;
      case 'earthquake':
        navigation.navigate('EarthquakeFeed', { city: selectedCity });
        break;
      case 'profile':
        navigation.navigate('Profile');
        break;
      default:
        break;
    }
  };

  const navItems = [
    { key: 'home', label: 'Ana Sayfa' },
    { key: 'map', label: 'Harita' },
    { key: 'earthquake', label: 'Deprem Geçmişi' },
    { key: 'profile', label: 'Profilim' },
  ];

  const pressAnimations = useRef(
    navItems.reduce((acc, item) => ({ ...acc, [item.key]: new Animated.Value(1) }), {})
  ).current;

  const animatePress = (key) => {
    const anim = pressAnimations[key];
    if (!anim) {
      return;
    }
    anim.stopAnimation(() => {
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 0.94,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.spring(anim, {
          toValue: 1,
          friction: 5,
          tension: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handlePress = (key) => {
    animatePress(key);
    handleNavigate(key);
  };

  return (
    <View style={[styles.container, floating && styles.containerFloating]}>
      <View style={styles.bar}>
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          const buttonClassName = `btn ${isActive ? 'btn--primary' : 'btn--ghost'}`;
          const scale = pressAnimations[item.key] || 1;
          return (
            <AnimatedTouchable
              key={item.key}
              className={buttonClassName}
              style={[styles.navItem, isActive && styles.navItemActive, { transform: [{ scale }] }]}
              activeOpacity={0.85}
              onPress={() => handlePress(item.key)}
            >
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
            </AnimatedTouchable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 10,
  },
  containerFloating: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    paddingBottom: 0,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 8,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 0,
    borderColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    shadowColor: '#ff2f85',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
  },
  navItemActive: {
    backgroundColor: '#ff2f85',
    borderColor: '#ff5fa2',
    shadowOpacity: 0.34,
    opacity: 1,
  },
  navLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 16,
  },
  navLabelActive: {
    color: '#f8fafc',
  },
});

export default BottomNavBar;
