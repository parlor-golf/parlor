import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function Feed() {
  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Feed</ThemedText>
      </ThemedView>
      
      <ScrollView style={styles.content}>
        <ThemedView style={styles.feedItem}>
          <ThemedText type="subtitle">Recent Golf Sessions</ThemedText>
          <ThemedText>Your friends' and league members' golf sessions will appear here</ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  feedItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
});