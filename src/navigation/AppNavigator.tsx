import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuthStore } from '../stores/authStore';
import { isProfileComplete } from '../types';

// Screens
import LoginScreen from '../screens/LoginScreen';
import VerifyCodeScreen from '../screens/VerifyCodeScreen';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';

// Tab Navigators
import ClientTabs from './ClientTabs';
import ManagerTabs from './ManagerTabs';

// Types pour la navigation
export type RootStackParamList = {
  // Auth Stack
  Login: undefined;
  VerifyCode: { phone: string };
  // Onboarding Stack
  CompleteProfile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Stack d'authentification
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen
        name="VerifyCode"
        component={VerifyCodeScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}

// Stack d'onboarding (complétion du profil)
function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
    </Stack.Navigator>
  );
}

// Écran de chargement
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#F97316" />
    </View>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, checkSession, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session au démarrage
    const initAuth = async () => {
      await checkSession();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Déterminer quel stack afficher
  const getActiveStack = () => {
    if (!isAuthenticated) {
      return <AuthStack />;
    }

    // Si authentifié mais profil incomplet -> onboarding
    if (!isProfileComplete(user)) {
      return <OnboardingStack />;
    }

    // Détection du rôle pour afficher le bon navigateur
    if (user?.role === 'manager' || user?.role === 'admin') {
      return <ManagerTabs />;
    }

    // Client standard -> tabs client
    return <ClientTabs />;
  };

  return (
    <NavigationContainer>
      {getActiveStack()}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
