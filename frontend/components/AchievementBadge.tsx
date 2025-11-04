import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { GolfColors } from '@/constants/theme';

interface AchievementBadgeProps {
  icon: string;
  title: string;
  description: string;
  isUnlocked: boolean;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

export default function AchievementBadge({
  icon,
  title,
  description,
  isUnlocked,
  rarity = 'common'
}: AchievementBadgeProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isUnlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmer, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isUnlocked]);

  const getRarityColor = () => {
    switch (rarity) {
      case 'legendary':
        return '#FFD700'; // Gold
      case 'epic':
        return '#9B59B6'; // Purple
      case 'rare':
        return '#3498DB'; // Blue
      default:
        return GolfColors.gray; // Gray
    }
  };

  const rarityColor = getRarityColor();

  return (
    <View style={[
      styles.badge,
      !isUnlocked && styles.lockedBadge,
      isUnlocked && { borderColor: rarityColor }
    ]}>
      <Animated.View
        style={[
          styles.iconContainer,
          isUnlocked && {
            backgroundColor: rarityColor,
            opacity: shimmer.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0.7],
            }),
          }
        ]}
      >
        <Text style={[styles.icon, !isUnlocked && styles.lockedIcon]}>
          {isUnlocked ? icon : '🔒'}
        </Text>
      </Animated.View>
      <Text style={[styles.title, !isUnlocked && styles.lockedText]}>
        {isUnlocked ? title : '???'}
      </Text>
      <Text style={[styles.description, !isUnlocked && styles.lockedText]}>
        {isUnlocked ? description : 'Locked'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 100,
    alignItems: 'center',
    padding: 12,
    backgroundColor: GolfColors.white,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: GolfColors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedBadge: {
    opacity: 0.6,
    borderColor: GolfColors.lightGray,
    borderStyle: 'dashed',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: GolfColors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
  },
  lockedIcon: {
    opacity: 0.4,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: GolfColors.black,
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    color: GolfColors.gray,
    textAlign: 'center',
    lineHeight: 12,
  },
  lockedText: {
    opacity: 0.5,
  },
});
