import { useEffect, useState } from 'react';
import { Appearance, useColorScheme as useRNColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemePreference = 'light' | 'dark';

const THEME_STORAGE_KEY = 'preferredTheme';

let overrideTheme: ThemePreference | null = null;
const listeners = new Set<(theme: ThemePreference) => void>();

const notifyListeners = (theme: ThemePreference) => {
  listeners.forEach((listener) => listener(theme));
};

export async function setThemePreference(theme: ThemePreference) {
  overrideTheme = theme;
  await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
  notifyListeners(theme);
}

export async function loadStoredThemePreference() {
  const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    overrideTheme = stored;
    return stored;
  }
  return null;
}

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const colorScheme = useRNColorScheme();
  const [currentTheme, setCurrentTheme] = useState<ThemePreference>(
    overrideTheme || colorScheme || 'light'
  );

  useEffect(() => {
    const listener = (theme: ThemePreference) => setCurrentTheme(theme);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  useEffect(() => {
    let isActive = true;
    const hydrate = async () => {
      const stored = await loadStoredThemePreference();
      if (!isActive) return;
      if (stored) {
        setCurrentTheme(stored);
      } else if (colorScheme) {
        setCurrentTheme(colorScheme as ThemePreference);
      }
    };
    hydrate();
    return () => {
      isActive = false;
    };
  }, [colorScheme]);

  if (!currentTheme) {
    return (Appearance.getColorScheme() || 'light') as ThemePreference;
  }

  return currentTheme;
}
