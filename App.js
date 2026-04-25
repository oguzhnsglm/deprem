import React, { useEffect, useMemo, useState } from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';
import BottomNavBar from './components/BottomNavBar';
import ErrorBoundary from './components/ErrorBoundary';
import { getProfilePreferences } from './logic/profileStore';
import { initAuth } from './logic/authStore';
import { loadProfile, loadLocalPreferences } from './logic/profileService';
import { I18nProvider } from './i18n/index';

if (Platform.OS === 'web') {
  require('./src/styles/globals.css');
}

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0A0F1E',
    card: '#0A0F1E',
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
  const [navigationReady, setNavigationReady] = useState(false);
  const [localPrefsReady, setLocalPrefsReady] = useState(false);
  const activeTab = useMemo(() => mapRouteToTab(activeRouteName), [activeRouteName]);

  useEffect(() => {
    // Load country + language from SecureStore before anything else renders
    loadLocalPreferences().then(() => {
      setLocalPrefsReady(true);
      initAuth().then((user) => {
        if (user) {
          loadProfile(user.id);
        }
      });
    });
  }, []);

  if (!localPrefsReady) return null;

  const prefs = getProfilePreferences();
  const preferredCity = prefs.city || 'İstanbul';
  const initialLang = prefs.language || 'tr';

  const handleNavReady = () => {
    setNavigationReady((prev) => prev || true);
    const routeName = navigationRef.getCurrentRoute()?.name;
    setActiveRouteName((prev) => (prev === routeName ? prev : routeName));
  };

  const handleStateChange = () => {
    const routeName = navigationRef.getCurrentRoute()?.name;
    setActiveRouteName((prev) => (prev === routeName ? prev : routeName));
  };

  return (
    <ErrorBoundary>
      <I18nProvider initialLang={initialLang}>
        <View style={{ flex: 1, backgroundColor: '#0A0F1E' }}>
          <StatusBar barStyle="light-content" />
          <NavigationContainer theme={navigationTheme} ref={navigationRef} onReady={handleNavReady} onStateChange={handleStateChange}>
            <StackNavigator />
          </NavigationContainer>
          {navigationReady ? (
            <BottomNavBar navigation={navigationRef} activeTab={activeTab} city={preferredCity} floating />
          ) : null}
        </View>
      </I18nProvider>
    </ErrorBoundary>
  );
}

