import React, { useMemo, useState, useEffect } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';
import BottomNavBar from './components/BottomNavBar';
import { getProfilePreferences } from './logic/profileStore';
import { initAuth } from './logic/authStore';
import { loadProfile } from './logic/profileService';
import { I18nProvider } from './i18n/index';

if (Platform.OS === 'web') {
  require('./src/styles/globals.css');
}

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#120a0f',
    card: '#0f1114',
    text: '#f8fafc',
    border: '#1f2933',
  },
};

const mapRouteToTab = (routeName) => {
  switch (routeName) {
    case 'Home':
      return 'home';
    case 'MapExplorer':
      return 'map';
    case 'EarthquakeFeed':
      return 'earthquake';
    case 'Profile':
      return 'profile';
    default:
      return undefined;
  }
};

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const [activeRouteName, setActiveRouteName] = useState();
  const activeTab = useMemo(() => mapRouteToTab(activeRouteName), [activeRouteName]);
  const prefs = getProfilePreferences();
  const preferredCity = prefs.city || 'İstanbul';
  const initialLang = prefs.language || 'tr';

  useEffect(() => {
    initAuth().then((user) => {
      if (user) {
        loadProfile(user.id);
      }
    });
  }, []);

  const handleNavReady = () => {
    setActiveRouteName(navigationRef.getCurrentRoute()?.name);
  };

  const handleStateChange = () => {
    setActiveRouteName(navigationRef.getCurrentRoute()?.name);
  };

  return (
    <I18nProvider initialLang={initialLang}>
      <View style={{ flex: 1, backgroundColor: '#0b0508' }}>
        <StatusBar barStyle="light-content" />
        <NavigationContainer theme={navigationTheme} ref={navigationRef} onReady={handleNavReady} onStateChange={handleStateChange}>
          <StackNavigator />
        </NavigationContainer>
        <BottomNavBar navigation={navigationRef.current} activeTab={activeTab} city={preferredCity} floating />
      </View>
    </I18nProvider>
  );
}

