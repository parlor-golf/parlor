import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GolfColors, Spacing, BorderRadius, Colors, Gradients } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const notifications = [
  { id: '1', title: 'New Like', description: 'Alex liked your round at Pebble Beach.', time: '2h ago', icon: 'heart' as const },
  { id: '2', title: 'New Comment', description: 'Jamie commented: “Great round!”', time: '5h ago', icon: 'chatbubble-ellipses' as const },
  { id: '3', title: 'Friend Request', description: 'Taylor sent you a friend request.', time: '1d ago', icon: 'people' as const },
];

export default function Notifications() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const dynamicColors = useMemo(() => ({
    background: isDarkMode ? Colors.dark.background : GolfColors.lightGray,
    card: isDarkMode ? '#223222' : GolfColors.white,
    textPrimary: isDarkMode ? Colors.dark.text : GolfColors.black,
    textSecondary: isDarkMode ? Colors.dark.icon : GolfColors.gray,
  }), [isDarkMode]);

  return (
    <View style={[styles.container, { backgroundColor: dynamicColors.background }]}>
      <LinearGradient
        colors={isDarkMode ? [GolfColors.primaryDark, GolfColors.primary] : [GolfColors.primary, GolfColors.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Notifications</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {notifications.map((item) => (
          <View key={item.id} style={[styles.card, { backgroundColor: dynamicColors.card }]}>
            <View style={[styles.iconCircle, { backgroundColor: isDarkMode ? Gradients.cardDark[0] : 'rgba(45,125,62,0.12)' }]}>
              <Ionicons name={item.icon} size={18} color={GolfColors.primary} />
            </View>
            <View style={styles.textBlock}>
              <Text style={[styles.title, { color: dynamicColors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.description, { color: dynamicColors.textSecondary }]}>{item.description}</Text>
              <Text style={[styles.time, { color: dynamicColors.textSecondary }]}>{item.time}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: GolfColors.white,
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  textBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
  },
  time: {
    fontSize: 12,
  },
});
