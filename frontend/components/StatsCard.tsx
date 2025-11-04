import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GolfColors } from '@/constants/theme';

interface StatsCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: string;
}

export default function StatsCard({ icon, label, value, subtitle, trend, accentColor = GolfColors.primary }: StatsCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➖';
  };

  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
        {subtitle && (
          <View style={styles.subtitleRow}>
            {trend && <Text style={styles.trendIcon}>{getTrendIcon()}</Text>}
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: GolfColors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GolfColors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: GolfColors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    fontWeight: '600',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: GolfColors.black,
    marginBottom: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  subtitle: {
    fontSize: 12,
    color: GolfColors.darkGray,
  },
});
