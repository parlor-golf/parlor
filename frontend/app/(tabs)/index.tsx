import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { GolfColors, Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { SpringConfigs, createButtonPressAnimation, createBreatheAnimation } from '@/utils/animations';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(30)).current;
  const cardScale = useRef(new Animated.Value(0.8)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const featureAnimations = useRef([
    { opacity: new Animated.Value(0), translateX: new Animated.Value(-50) },
    { opacity: new Animated.Value(0), translateX: new Animated.Value(50) },
    { opacity: new Animated.Value(0), translateX: new Animated.Value(-50) },
  ]).current;
  const actionButtonScales = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;
  const logoBreathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Sequence of entrance animations
    Animated.sequence([
      // Logo bounces in
      Animated.spring(logoScale, {
        toValue: 1,
        ...SpringConfigs.bouncy,
        useNativeDriver: true,
      }),
      // Title fades and slides up
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(titleTranslateY, {
          toValue: 0,
          ...SpringConfigs.gentle,
          useNativeDriver: true,
        }),
      ]),
      // Stats card scales in
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          ...SpringConfigs.bouncy,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // Feature cards slide in alternating
      Animated.stagger(150, featureAnimations.map((anim, index) =>
        Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(anim.translateX, {
            toValue: 0,
            ...SpringConfigs.gentle,
            useNativeDriver: true,
          }),
        ])
      )),
    ]).start();

    // Start subtle breathing animation on logo
    const breathe = createBreatheAnimation(logoBreathe);
    breathe.start();

    return () => breathe.stop();
  }, []);

  const handleActionPress = (index: number, route: string) => {
    createButtonPressAnimation(actionButtonScales[index], () => {
      router.push(route as any);
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/golf/golf-course-hero.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(27,62,31,0.85)']}
          style={styles.overlay}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    transform: [
                      { scale: Animated.multiply(logoScale, logoBreathe) },
                    ],
                  },
                ]}
              >
                <Ionicons name="golf" size={48} color={GolfColors.white} />
              </Animated.View>
              <Animated.Text
                style={[
                  styles.title,
                  {
                    opacity: titleOpacity,
                    transform: [{ translateY: titleTranslateY }],
                  },
                ]}
              >
                Parlor
              </Animated.Text>
              <Animated.Text
                style={[
                  styles.subtitle,
                  {
                    opacity: titleOpacity,
                    transform: [{ translateY: titleTranslateY }],
                  },
                ]}
              >
                Your Golf Companion
              </Animated.Text>
            </View>

            {/* Quick Stats Card */}
            <Animated.View
              style={[
                styles.statsCard,
                {
                  opacity: cardOpacity,
                  transform: [{ scale: cardScale }],
                },
              ]}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.95)', 'rgba(248,252,249,0.95)']}
                style={styles.statsCardGradient}
              >
                <Text style={styles.statsTitle}>Quick Actions</Text>
                <View style={styles.statsGrid}>
                  <Animated.View style={{ transform: [{ scale: actionButtonScales[0] }] }}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleActionPress(0, '/(tabs)/record')}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: GolfColors.primary }]}>
                        <Ionicons name="add-circle" size={24} color={GolfColors.white} />
                      </View>
                      <Text style={styles.actionText}>New Round</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View style={{ transform: [{ scale: actionButtonScales[1] }] }}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleActionPress(1, '/(tabs)/feed')}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: GolfColors.fairway }]}>
                        <Ionicons name="newspaper" size={24} color={GolfColors.white} />
                      </View>
                      <Text style={styles.actionText}>Feed</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View style={{ transform: [{ scale: actionButtonScales[2] }] }}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleActionPress(2, '/(tabs)/ranking')}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: GolfColors.sand }]}>
                        <Ionicons name="trophy" size={24} color={GolfColors.white} />
                      </View>
                      <Text style={styles.actionText}>Rankings</Text>
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View style={{ transform: [{ scale: actionButtonScales[3] }] }}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleActionPress(3, '/(tabs)/league')}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.actionIcon, { backgroundColor: GolfColors.primaryDark }]}>
                        <Ionicons name="people" size={24} color={GolfColors.white} />
                      </View>
                      <Text style={styles.actionText}>Leagues</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Feature Highlights */}
            <View style={styles.featuresContainer}>
              <Animated.View
                style={{
                  opacity: featureAnimations[0].opacity,
                  transform: [{ translateX: featureAnimations[0].translateX }],
                }}
              >
                <FeatureCard
                  icon="golf"
                  title="Track Your Rounds"
                  description="Record scores hole by hole with detailed statistics"
                  gradient={['#2D7D3E', '#4CAF50']}
                />
              </Animated.View>
              <Animated.View
                style={{
                  opacity: featureAnimations[1].opacity,
                  transform: [{ translateX: featureAnimations[1].translateX }],
                }}
              >
                <FeatureCard
                  icon="people-circle"
                  title="Connect with Golfers"
                  description="Share rounds and compete with friends"
                  gradient={['#3D9654', '#5B8F6A']}
                />
              </Animated.View>
              <Animated.View
                style={{
                  opacity: featureAnimations[2].opacity,
                  transform: [{ translateX: featureAnimations[2].translateX }],
                }}
              >
                <FeatureCard
                  icon="stats-chart"
                  title="Analyze Performance"
                  description="View trends and improve your game"
                  gradient={['#1B5E2A', '#2D7D3E']}
                />
              </Animated.View>
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

interface FeatureCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  gradient: string[];
}

function FeatureCard({ icon, title, description, gradient }: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureCardGradient}
      >
        <Ionicons name={icon} size={28} color={GolfColors.white} />
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 60,
    paddingHorizontal: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    color: GolfColors.white,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
    letterSpacing: 1,
  },
  statsCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.large,
  },
  statsCardGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GolfColors.primaryDark,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: GolfColors.darkGray,
  },
  featuresContainer: {
    gap: Spacing.md,
  },
  featureCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  featureCardGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GolfColors.white,
    marginTop: Spacing.sm,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.xs,
  },
  bottomSpacer: {
    height: 100,
  },
});
