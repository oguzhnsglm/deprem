import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const BottomNavBar = ({ activeTab = 'home', city, floating = false, navigation }) => {
  if (!navigation) {
    return null;
  }

  const routeNames = navigation?.getState?.()?.routeNames || [];
  const hasMapExplorer = routeNames.includes('MapExplorer');
  const selectedCity = city || 'Istanbul';

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

  return (
    <View style={[styles.container, floating && styles.containerFloating]}>
      <View style={styles.bar}>
        {navItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, isActive && styles.navItemActive]}
              activeOpacity={0.85}
              onPress={() => handleNavigate(item.key)}
            >
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
              {isActive ? <View style={styles.activeIndicator} /> : null}
            </TouchableOpacity>
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
    backgroundColor: '#0b0d10',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1f2933',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navItemActive: {
    opacity: 1,
  },
  navLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 16,
  },
  navLabelActive: {
    color: '#f8fafc',
  },
  activeIndicator: {
    marginTop: 4,
    width: 26,
    height: 3,
    borderRadius: 999,
    backgroundColor: '#f8fafc',
  },
});

export default BottomNavBar;
