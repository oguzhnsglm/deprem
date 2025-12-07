import React, { useMemo, useState } from 'react';
import { StatusBar, View } from 'react-native';
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';
import BottomNavBar from './components/BottomNavBar';
import { getProfilePreferences } from './logic/profileStore';

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
  const preferredCity = getProfilePreferences().city || 'İstanbul';

  const handleNavReady = () => {
    setActiveRouteName(navigationRef.getCurrentRoute()?.name);
  };

  const handleStateChange = () => {
    setActiveRouteName(navigationRef.getCurrentRoute()?.name);
  };

  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <NavigationContainer theme={navigationTheme} ref={navigationRef} onReady={handleNavReady} onStateChange={handleStateChange}>
        <StackNavigator />
      </NavigationContainer>
      <BottomNavBar navigation={navigationRef.current} activeTab={activeTab} city={preferredCity} floating />
    </View>
  );
}

