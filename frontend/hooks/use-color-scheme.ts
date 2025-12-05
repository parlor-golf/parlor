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

export function useColorScheme() {
  const systemTheme = useRNColorScheme();
  const [currentTheme, setCurrentTheme] = useState<ThemePreference>(
    overrideTheme || systemTheme || 'light'
  );

  // Listen for manual override changes
  useEffect(() => {
    const listener = (theme: ThemePreference) => setCurrentTheme(theme);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  // Sync with stored preference on mount
  useEffect(() => {
    let isActive = true;
    const hydrate = async () => {
      const stored = await loadStoredThemePreference();
      if (!isActive) return;
      if (stored) {
        setCurrentTheme(stored);
      }
    };
    hydrate();
    return () => {
      isActive = false;
    };
  }, []);

  // Fallback to system theme when no override is set
  useEffect(() => {
    if (!overrideTheme && systemTheme && systemTheme !== currentTheme) {
      setCurrentTheme(systemTheme as ThemePreference);
    }
  }, [systemTheme, currentTheme]);

  // Ensure we always return a valid theme
  if (!currentTheme) {
    return (Appearance.getColorScheme() || 'light') as ThemePreference;
  }

  return currentTheme;
}
