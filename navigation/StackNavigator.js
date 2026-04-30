import React from 'react';
import { Text, View, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SafeSpotScreen from '../screens/SafeSpotScreen';
import EmergencyStatusScreen from '../screens/EmergencyStatusScreen';
import AlertScreen from '../screens/AlertScreen';
import ContactsScreen from '../screens/ContactsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EarthquakeFeedScreen from '../screens/EarthquakeFeedScreen';
import DataSourcesScreen from '../screens/DataSourcesScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SignInScreen from '../screens/SignInScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';

// Conditionally import MapExplorerScreen only on native platforms
let MapExplorerScreen = null;
if (Platform.OS !== 'web') {
  MapExplorerScreen = require('../screens/MapExplorerScreen').default;
}

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="MapExplorer"
      detachInactiveScreens={false}
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: route.params?.transitionAnimation || 'slide_from_right',
        contentStyle: { backgroundColor: '#0A0F1E' },
        detachPreviousScreen: false,
      })}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen name="SafeSpot" component={SafeSpotScreen} options={{ title: 'Güvenli Alan Analizi' }} />
      <Stack.Screen name="EmergencyStatus" component={EmergencyStatusScreen} options={{ title: 'Acil Durum' }} />
      <Stack.Screen name="Alert" component={AlertScreen} options={{ title: 'Durum Bildirimi' }} />
      <Stack.Screen name="Contacts" component={ContactsScreen} options={{ title: 'Acil Durum Kişileri' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profilim', headerBackVisible: false }} />
      <Stack.Screen name="DataSources" component={DataSourcesScreen} options={{ title: 'Veri Kaynaklari ve Lisanslar' }} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Gizlilik Politikasi' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Kayit Ol' }} />
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Giris Yap' }} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} options={{ title: 'Email Onayi' }} />
      <Stack.Screen
        name="EarthquakeFeed"
        component={EarthquakeFeedScreen}
        options={{ title: 'Deprem Akışı', headerBackVisible: false }}
      />
      {Platform.OS !== 'web' && MapExplorerScreen && (
        <Stack.Screen name="MapExplorer" component={MapExplorerScreen} options={{ title: 'Harita ve Risk', headerBackVisible: false }} />
      )}
    </Stack.Navigator>
  );
};

export default StackNavigator;
