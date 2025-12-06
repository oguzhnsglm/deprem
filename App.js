import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';

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

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <NavigationContainer theme={navigationTheme}>
        <StackNavigator />
      </NavigationContainer>
    </>
  );
}

