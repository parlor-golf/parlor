import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GolfColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

// Single skeleton element with shimmer
export const Skeleton: React.FC<SkeletonProps> = ({
  width: skeletonWidth = '100%',
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width: skeletonWidth,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.4)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

// Feed card skeleton
export const FeedCardSkeleton: React.FC = () => {
  return (
    <Animated.View style={styles.cardSkeleton}>
      {/* Header */}
      <View style={styles.headerSkeleton}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.headerTextSkeleton}>
          <Skeleton width={120} height={14} />
          <Skeleton width={80} height={10} style={styles.subtextMargin} />
        </View>
      </View>

      {/* Image placeholder */}
      <Skeleton width="100%" height={180} borderRadius={0} style={styles.imageSkeleton} />

      {/* Course info */}
      <View style={styles.courseInfoSkeleton}>
        <Skeleton width="60%" height={16} />
        <Skeleton width={60} height={24} borderRadius={BorderRadius.sm} />
      </View>

      {/* Stats */}
      <View style={styles.statsSkeleton}>
        <View style={styles.statItemSkeleton}>
          <Skeleton width={40} height={10} />
          <Skeleton width={30} height={20} style={styles.subtextMargin} />
        </View>
        <View style={styles.statItemSkeleton}>
          <Skeleton width={40} height={10} />
          <Skeleton width={30} height={20} style={styles.subtextMargin} />
        </View>
        <View style={styles.statItemSkeleton}>
          <Skeleton width={40} height={10} />
          <Skeleton width={30} height={20} style={styles.subtextMargin} />
        </View>
      </View>

      {/* Action bar */}
      <View style={styles.actionBarSkeleton}>
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={24} height={24} borderRadius={12} />
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
    </Animated.View>
  );
};

// Ranking item skeleton
export const RankingItemSkeleton: React.FC = () => {
  return (
    <View style={styles.rankingItemSkeleton}>
      <View style={styles.rankInfoSkeleton}>
        <Skeleton width={36} height={36} borderRadius={18} />
        <View style={styles.playerInfoSkeleton}>
          <Skeleton width={100} height={14} />
          <Skeleton width={80} height={10} style={styles.subtextMargin} />
        </View>
      </View>
      <Skeleton width={50} height={36} borderRadius={BorderRadius.sm} />
    </View>
  );
};

// Profile card skeleton
export const ProfileSkeleton: React.FC = () => {
  return (
    <View style={styles.profileSkeleton}>
      <Skeleton width={70} height={70} borderRadius={35} />
      <View style={styles.profileInfoSkeleton}>
        <Skeleton width={120} height={20} />
        <Skeleton width={80} height={14} style={styles.subtextMargin} />
      </View>
    </View>
  );
};

// Stats grid skeleton
export const StatsGridSkeleton: React.FC = () => {
  return (
    <View style={styles.statsGridSkeleton}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.statGridItem}>
          <Skeleton width={48} height={48} borderRadius={24} />
          <Skeleton width={60} height={12} style={styles.subtextMargin} />
        </View>
      ))}
    </View>
  );
};

// Full feed skeleton loader
export const FeedSkeletonLoader: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <View style={styles.loaderContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <FeedCardSkeleton key={index} />
      ))}
    </View>
  );
};

// Ranking skeleton loader
export const RankingSkeletonLoader: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <View style={styles.loaderContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <RankingItemSkeleton key={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: GolfColors.cardBgAlt,
    overflow: 'hidden',
  },
  loaderContainer: {
    gap: Spacing.md,
  },
  cardSkeleton: {
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  headerTextSkeleton: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  subtextMargin: {
    marginTop: Spacing.xs,
  },
  imageSkeleton: {
    marginVertical: 0,
  },
  courseInfoSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  statsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.md,
    paddingTop: 0,
  },
  statItemSkeleton: {
    alignItems: 'center',
  },
  actionBarSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: GolfColors.lightGray,
  },
  rankingItemSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: GolfColors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  rankInfoSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playerInfoSkeleton: {
    marginLeft: Spacing.sm,
  },
  profileSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GolfColors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  profileInfoSkeleton: {
    marginLeft: Spacing.md,
  },
  statsGridSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: Spacing.md,
  },
  statGridItem: {
    alignItems: 'center',
  },
});
