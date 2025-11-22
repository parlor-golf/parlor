import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GolfColors, Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { SpringConfigs, createButtonPressAnimation } from '@/utils/animations';
import { getRankings } from '@/services/api';

interface PlayerRanking {
  id: string;
  name: string;
  netScore: number;
  rounds: number;
  handicap: number;
  avatar?: string;
}

type FilterType = 'friends' | 'league' | 'global';
type HoleType = '9-hole' | '18-hole';
type TimeRange = 'weekly' | 'monthly' | 'yearly';

export default function Ranking() {
  const [filterType, setFilterType] = useState<FilterType>('friends');
  const [holeFilter, setHoleFilter] = useState<HoleType>('18-hole');
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [rankings, setRankings] = useState<PlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const filterCardAnim = useRef(new Animated.Value(0)).current;
  const filterCardScale = useRef(new Animated.Value(0.9)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const searchButtonScale = useRef(new Animated.Value(1)).current;
  const trophyRotate = useRef(new Animated.Value(0)).current;

  // Fetch rankings from API
  useEffect(() => {
    fetchRankings();
  }, []);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRankings();
      
      if (response.error) {
        setError(response.error);
        setRankings([]);
      } else if (response.data) {
        // Transform backend data to PlayerRanking format
        const transformedRankings: PlayerRanking[] = response.data.map((player: any, index: number) => ({
          id: `player-${index}`,
          name: player.name,
          netScore: Math.round(player.average_score),
          rounds: 1, // Backend doesn't provide this yet
          handicap: 0, // Backend doesn't provide this yet
        }));
        setRankings(transformedRankings);
      }
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError('Failed to load rankings');
      setRankings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      // Header slides down
      Animated.spring(headerAnim, {
        toValue: 1,
        ...SpringConfigs.gentle,
        useNativeDriver: true,
      }),
      // Filter card scales in
      Animated.parallel([
        Animated.spring(filterCardAnim, {
          toValue: 1,
          ...SpringConfigs.gentle,
          useNativeDriver: true,
        }),
        Animated.spring(filterCardScale, {
          toValue: 1,
          ...SpringConfigs.bouncy,
          useNativeDriver: true,
        }),
      ]),
      // Content fades in
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Trophy wiggle animation
    const wiggle = Animated.loop(
      Animated.sequence([
        Animated.timing(trophyRotate, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(trophyRotate, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    wiggle.start();

    return () => wiggle.stop();
  }, []);

  const handleSearch = () => {
    createButtonPressAnimation(searchButtonScale, () => {
      Alert.alert('Search', 'Search for players on the leaderboard. (Feature coming soon)');
    });
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) return { backgroundColor: '#FFD700' }; // Gold
    if (rank === 2) return { backgroundColor: '#C0C0C0' }; // Silver
    if (rank === 3) return { backgroundColor: '#CD7F32' }; // Bronze
    return { backgroundColor: GolfColors.primary };
  };

  const renderRankingItem = (player: PlayerRanking, rank: number) => (
    <View key={player.id} style={styles.rankingItem}>
      <View style={styles.rankInfo}>
        <LinearGradient
          colors={rank <= 3 ? ['#FFD700', '#FFA500'] : [GolfColors.primary, GolfColors.primaryLight]}
          style={[styles.rankBadge, getRankBadgeStyle(rank)]}
        >
          {rank <= 3 ? (
            <Ionicons
              name="trophy"
              size={16}
              color={rank === 1 ? '#8B6914' : rank === 2 ? '#5A5A5A' : '#5D3A1A'}
            />
          ) : (
            <Text style={styles.rankNumber}>{rank}</Text>
          )}
        </LinearGradient>
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, player.name === 'You' && styles.currentPlayer]}>
            {player.name}
          </Text>
          <Text style={styles.playerStats}>
            {player.rounds} rounds • HCP {player.handicap}
          </Text>
        </View>
      </View>
      <View style={styles.scoreInfo}>
        <Text style={styles.netScore}>{player.netScore}</Text>
        <Text style={styles.scoreLabel}>Net</Text>
      </View>
    </View>
  );

  const trophyRotation = trophyRotate.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-5deg', '5deg', '-5deg'],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[GolfColors.primary, GolfColors.primaryDark]}
        style={styles.header}
      >
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <Animated.View style={{ transform: [{ scale: searchButtonScale }] }}>
            <TouchableOpacity style={styles.headerButton} onPress={handleSearch}>
              <Ionicons name="search" size={24} color={GolfColors.white} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter Cards */}
        <Animated.View
          style={[
            styles.filterCard,
            {
              opacity: filterCardAnim,
              transform: [{ scale: filterCardScale }],
            },
          ]}
        >
          {/* Category Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Category</Text>
            <View style={styles.filterRow}>
              {(['friends', 'league', 'global'] as FilterType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.filterButton, filterType === type && styles.activeFilter]}
                  onPress={() => setFilterType(type)}
                >
                  <Ionicons
                    name={type === 'friends' ? 'people' : type === 'league' ? 'trophy' : 'globe'}
                    size={16}
                    color={filterType === type ? GolfColors.white : GolfColors.primary}
                  />
                  <Text style={[styles.filterText, filterType === type && styles.activeFilterText]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Hole & Time Filters */}
          <View style={styles.filterRow}>
            <View style={styles.filterHalf}>
              <Text style={styles.filterLabel}>Holes</Text>
              <View style={styles.smallFilterRow}>
                {(['9-hole', '18-hole'] as HoleType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.smallFilterButton, holeFilter === type && styles.activeSmallFilter]}
                    onPress={() => setHoleFilter(type)}
                  >
                    <Text style={[styles.smallFilterText, holeFilter === type && styles.activeSmallFilterText]}>
                      {type.split('-')[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterHalf}>
              <Text style={styles.filterLabel}>Period</Text>
              <View style={styles.smallFilterRow}>
                {(['weekly', 'monthly', 'yearly'] as TimeRange[]).map((range) => (
                  <TouchableOpacity
                    key={range}
                    style={[styles.smallFilterButton, timeRange === range && styles.activeSmallFilter]}
                    onPress={() => setTimeRange(range)}
                  >
                    <Text style={[styles.smallFilterText, timeRange === range && styles.activeSmallFilterText]}>
                      {range.charAt(0).toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Rankings Section */}
        <Animated.View
          style={[
            styles.rankingsSection,
            { opacity: contentAnim },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Animated.View style={{ transform: [{ rotate: trophyRotation }] }}>
              <Ionicons name="trophy" size={20} color={GolfColors.primary} />
            </Animated.View>
            <Text style={styles.sectionTitle}>
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)} Rankings
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={GolfColors.primary} />
              <Text style={styles.loadingText}>Loading rankings...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={48} color="#E74C3C" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchRankings}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : rankings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ImageBackground
                source={require('@/assets/images/golf/golf-sunset.jpg')}
                style={styles.emptyBackground}
                imageStyle={styles.emptyBackgroundImage}
              >
                <LinearGradient
                  colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                  style={styles.emptyOverlay}
                >
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="trophy" size={48} color={GolfColors.sand} />
                  </View>
                  <Text style={styles.emptyTitle}>No Rankings Yet</Text>
                  <Text style={styles.emptySubtext}>
                    Record your rounds and compete with friends to climb the leaderboard
                  </Text>

                  <View style={styles.tipCard}>
                    <Ionicons name="bulb" size={20} color={GolfColors.sand} />
                    <Text style={styles.tipText}>
                      Play 3+ rounds to get your ranking
                    </Text>
                  </View>
                </LinearGradient>
              </ImageBackground>
            </View>
          ) : (
            <View style={styles.rankingsList}>
              {rankings.map((player, index) => renderRankingItem(player, index + 1))}
            </View>
          )}
        </Animated.View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <LinearGradient
            colors={[GolfColors.cardBg, GolfColors.cardBgAlt]}
            style={styles.infoGradient}
          >
            <Ionicons name="information-circle" size={20} color={GolfColors.primary} />
            <Text style={styles.infoText}>
              Rankings use World Handicap System net scores. Play more rounds to improve!
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GolfColors.lightGray,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: GolfColors.white,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  filterCard: {
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  filterSection: {
    marginBottom: Spacing.md,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: GolfColors.gray,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: GolfColors.primary,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  activeFilter: {
    backgroundColor: GolfColors.primary,
    borderColor: GolfColors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: GolfColors.primary,
  },
  activeFilterText: {
    color: GolfColors.white,
  },
  filterHalf: {
    flex: 1,
  },
  smallFilterRow: {
    flexDirection: 'row',
    gap: 4,
  },
  smallFilterButton: {
    flex: 1,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: GolfColors.cardBgAlt,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    backgroundColor: GolfColors.cardBg,
  },
  activeSmallFilter: {
    backgroundColor: GolfColors.primaryLight,
    borderColor: GolfColors.primaryLight,
  },
  smallFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: GolfColors.gray,
  },
  activeSmallFilterText: {
    color: GolfColors.white,
  },
  rankingsSection: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: GolfColors.primaryDark,
  },
  rankingsList: {
    gap: Spacing.sm,
  },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: GolfColors.white,
    ...Shadows.small,
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  rankNumber: {
    color: GolfColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '600',
    color: GolfColors.black,
    marginBottom: 2,
  },
  currentPlayer: {
    color: GolfColors.primary,
  },
  playerStats: {
    fontSize: 11,
    color: GolfColors.gray,
  },
  scoreInfo: {
    alignItems: 'center',
    backgroundColor: GolfColors.cardBg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  netScore: {
    fontSize: 18,
    fontWeight: '700',
    color: GolfColors.underPar,
  },
  scoreLabel: {
    fontSize: 9,
    color: GolfColors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  emptyBackground: {
    width: '100%',
  },
  emptyBackgroundImage: {
    borderRadius: BorderRadius.lg,
  },
  emptyOverlay: {
    padding: Spacing.xl,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(212,165,116,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GolfColors.primaryDark,
    marginBottom: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: GolfColors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212,165,116,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  tipText: {
    fontSize: 13,
    fontWeight: '500',
    color: GolfColors.primaryDark,
  },
  infoCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  infoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: GolfColors.darkGray,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 100,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: GolfColors.gray,
  },
  errorContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: GolfColors.primary,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: GolfColors.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
