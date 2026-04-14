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
    { key: 'earthquake', label: 'Geçmiş' },
    { key: 'profile', label: 'Profil' },
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
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(anim, {
          toValue: 1,
          friction: 4,
          tension: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handlePress = (key) => {
    animatePress(key);
    handleNavigate(key);
  };

  // Modern Floating Design for all screens, but adjust bottom padding if not full floating
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
              activeOpacity={0.8}
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
    paddingBottom: 24, // Modern cihazlar (iPhone/Android notch'suz alanları) için biraz daha nefes payı
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  containerFloating: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.95)', // Slate 900 (Şık gece mavisi)
    borderRadius: 28, // Hap şeklinde modern kavis
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E293B', // Slate 800 ince kenarlık
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)', // Çok ince parlama
  },
  navLabel: {
    color: '#64748B', // Slate 500
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: 16,
  },
  navLabelActive: {
    color: '#F8FAFC', // Slate 50
    fontWeight: '900',
  },
  underline: {
    position: 'absolute',
    bottom: -8,
    width: 24,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#38BDF8', // Sky 400 (Premium parlak belirteç)
  },
});

export default BottomNavBar;
