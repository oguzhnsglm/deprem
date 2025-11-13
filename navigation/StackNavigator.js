import React from 'react';
import { Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SafeSpotScreen from '../screens/SafeSpotScreen';
import EmergencyStatusScreen from '../screens/EmergencyStatusScreen';
import AlertScreen from '../screens/AlertScreen';
import ContactsScreen from '../screens/ContactsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EarthquakeFeedScreen from '../screens/EarthquakeFeedScreen';
import MapExplorerScreen from '../screens/MapExplorerScreen';

const Stack = createNativeStackNavigator();

const HomeHeaderTitle = () => (
  <View style={{ alignItems: 'center' }}>
    <Text
      style={{
        fontSize: 22,
        fontWeight: '900',
        color: '#831843',
        letterSpacing: 0.5,
      }}
    >
      Deprem Rehberi
    </Text>
    <View
      style={{
        marginTop: 4,
        width: 60,
        height: 3,
        borderRadius: 2,
        backgroundColor: '#f472b6',
      }}
    />
  </View>
);

const StackNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#f9a8d4' },
        headerTintColor: '#831843',
        headerTitleStyle: { fontWeight: '700', letterSpacing: 0.6 },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Deprem Rehberi',
          headerTitle: HomeHeaderTitle,
        }}
      />
      <Stack.Screen name="SafeSpot" component={SafeSpotScreen} options={{ title: 'Güvenli Alan Analizi' }} />
      <Stack.Screen name="EmergencyStatus" component={EmergencyStatusScreen} options={{ title: 'Acil Durum' }} />
      <Stack.Screen name="Alert" component={AlertScreen} options={{ title: 'Durum Bildirimi' }} />
      <Stack.Screen name="Contacts" component={ContactsScreen} options={{ title: 'Acil Durum Kişileri' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profilim' }} />
      <Stack.Screen name="EarthquakeFeed" component={EarthquakeFeedScreen} options={{ title: 'Deprem Akışı' }} />
      <Stack.Screen name="MapExplorer" component={MapExplorerScreen} options={{ title: 'Harita ve Risk' }} />
    </Stack.Navigator>
  );
};

export default StackNavigator;
