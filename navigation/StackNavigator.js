import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SafeSpotScreen from '../screens/SafeSpotScreen';
import EmergencyStatusScreen from '../screens/EmergencyStatusScreen';
import AlertScreen from '../screens/AlertScreen';
import ContactsScreen from '../screens/ContactsScreen';

const Stack = createNativeStackNavigator();

const StackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#3b0a7c' },
        headerTintColor: '#f4edff',
        headerTitleStyle: { fontWeight: '700', letterSpacing: 0.6 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Deprem Rehberi' }} />
      <Stack.Screen name="SafeSpot" component={SafeSpotScreen} options={{ title: 'Guvenli Alan Analizi' }} />
      <Stack.Screen name="EmergencyStatus" component={EmergencyStatusScreen} options={{ title: 'Acil Durum' }} />
      <Stack.Screen name="Alert" component={AlertScreen} options={{ title: 'Durum Bildirimi' }} />
      <Stack.Screen name="Contacts" component={ContactsScreen} options={{ title: 'Yakinlarim' }} />
    </Stack.Navigator>
  );
};

export default StackNavigator;
