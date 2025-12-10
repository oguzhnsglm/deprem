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
          const scale = pressAnimations[item.key] || 1;
          return (
            <AnimatedTouchable
              key={item.key}
              style={[styles.navItem, isActive && styles.navItemActive, { transform: [{ scale }] }]}
              activeOpacity={0.85}
              onPress={() => handlePress(item.key)}
            >
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
              {isActive ? <View style={styles.underline} /> : null}
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
    backgroundColor: 'rgba(12, 8, 18, 0.65)',
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 6,
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  navItemActive: {
    opacity: 1,
  },
  navLabel: {
    color: '#d8dce9',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.15,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 16,
  },
  navLabelActive: {
    color: '#f8fafc',
  },
  underline: {
    marginTop: 6,
    width: 24,
    height: 2,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
  },
});

export default BottomNavBar;
