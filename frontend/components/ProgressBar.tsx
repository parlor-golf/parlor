import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { GolfColors } from '@/constants/theme';

interface ProgressBarProps {
  label: string;
  value: number;
  maxValue: number;
  color?: string;
  showValue?: boolean;
}

export default function ProgressBar({
  label,
  value,
  maxValue,
  color = GolfColors.primary,
  showValue = true
}: ProgressBarProps) {
  const progress = useRef(new Animated.Value(0)).current;
  const percentage = Math.min((value / maxValue) * 100, 100);

  useEffect(() => {
    Animated.spring(progress, {
      toValue: percentage,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {showValue && (
          <Text style={styles.value}>
            {value} / {maxValue}
          </Text>
        )}
      </View>
      <View style={styles.barContainer}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: color,
              width: progressWidth,
            },
          ]}
        />
      </View>
      <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: GolfColors.black,
  },
  value: {
    fontSize: 12,
    color: GolfColors.gray,
    fontWeight: '500',
  },
  barContainer: {
    height: 12,
    backgroundColor: GolfColors.lightGray,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentage: {
    fontSize: 10,
    color: GolfColors.darkGray,
    textAlign: 'right',
    marginTop: 4,
    fontWeight: '600',
  },
});
