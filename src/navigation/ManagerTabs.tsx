import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Manager Screens
import ManagerHomeScreen from '../screens/manager/ManagerHomeScreen';
import ManagerBookingScreen from '../screens/manager/ManagerBookingScreen';
import ManagerClientsScreen from '../screens/manager/ManagerClientsScreen';
import ManagerClientDetailScreen from '../screens/manager/ManagerClientDetailScreen';
import ManagerProfileScreen from '../screens/manager/ManagerProfileScreen';

// Types for Manager navigation
export type ManagerStackParamList = {
  ManagerHome: undefined;
  ManagerBooking: {
    courtId?: string;
    date?: string;
    timeSlotId?: string;
    clientId?: string;
  } | undefined;
  ManagerClients: undefined;
  ManagerClientDetail: { clientId: string };
  ManagerProfile: undefined;
};

export type ManagerTabParamList = {
  HomeTab: undefined;
  ClientsTab: undefined;
  ProfileTab: undefined;
};

const Stack = createNativeStackNavigator<ManagerStackParamList>();
const Tab = createBottomTabNavigator<ManagerTabParamList>();

// Tab icons for manager
const ManagerTabIcon = ({ name, focused }: { name: string; focused: boolean }) => {
  const icons: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
    home: { active: 'calendar', inactive: 'calendar-outline' },
    clients: { active: 'people', inactive: 'people-outline' },
    profile: { active: 'person', inactive: 'person-outline' },
  };

  const icon = icons[name];
  return (
    <Ionicons
      name={focused ? icon.active : icon.inactive}
      size={focused ? 26 : 24}
      color={focused ? '#F97316' : '#9CA3AF'}
    />
  );
};

// Stack for Home tab (day view + create booking)
function ManagerHomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerHome" component={ManagerHomeScreen} />
      <Stack.Screen
        name="ManagerBooking"
        component={ManagerBookingScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

// Stack for Clients tab (clients list + detail)
function ManagerClientsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ManagerClients" component={ManagerClientsScreen} />
      <Stack.Screen
        name="ManagerClientDetail"
        component={ManagerClientDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ManagerBooking"
        component={ManagerBookingScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

// Manager Tab Navigator - 3 tabs: Planning, Clients, Profil
export default function ManagerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={ManagerHomeStack}
        options={{
          tabBarLabel: 'Planning',
          tabBarIcon: ({ focused }) => <ManagerTabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ClientsTab"
        component={ManagerClientsStack}
        options={{
          tabBarLabel: 'Clients',
          tabBarIcon: ({ focused }) => <ManagerTabIcon name="clients" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ManagerProfileScreen}
        options={{
          tabBarLabel: 'Profil',
          tabBarIcon: ({ focused }) => <ManagerTabIcon name="profile" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}
