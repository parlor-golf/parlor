import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { GolfColors } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>Welcome to Parlor</ThemedText>
      <Text style={styles.subtitle}>Your Golf Companion</Text>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: GolfColors.primaryDark,
  },
  subtitle: {
    fontSize: 16,
    color: GolfColors.gray,
    marginTop: 8,
  },
});
