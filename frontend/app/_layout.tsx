import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { GolfColors } from '@/constants/theme';

export const unstable_settings = {
  initialRouteName: 'auth',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      await checkAuth();
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Re-check auth when segments change (in case AsyncStorage was updated)
    const recheckAuth = async () => {
      const token = await AsyncStorage.getItem('idToken');
      const authenticated = !!token;

      // Only update if different to prevent loops
      if (authenticated !== isAuthenticated) {
        setIsAuthenticated(authenticated);
      }
    };

    recheckAuth();

    const inAuthGroup = segments[0] === 'auth';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to sign in if not authenticated
      router.replace('/auth/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated but on auth screen
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading]);

  const checkAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('idToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      setIsAuthenticated(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: GolfColors.primary }}>
        <ActivityIndicator size="large" color={GolfColors.white} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
