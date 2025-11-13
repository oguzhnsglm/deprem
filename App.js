import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#fff1f2',
    card: '#fbcfe8',
    text: '#831843',
    border: '#fecdd3',
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

