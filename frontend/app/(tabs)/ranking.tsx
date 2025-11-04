import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GolfColors } from '@/constants/theme';

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

  // Rankings will come from API - empty for now
  const sampleRankings: PlayerRanking[] = [];

  const renderRankingItem = (player: PlayerRanking, rank: number) => (
    <View key={player.id} style={styles.rankingItem}>
      <View style={styles.rankInfo}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankNumber}>{rank}</Text>
        </View>
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, player.name === 'You' && styles.currentPlayer]}>
            {player.name}
          </Text>
          <Text style={styles.playerStats}>
            {player.rounds} rounds • Handicap {player.handicap}
          </Text>
        </View>
      </View>
      <View style={styles.scoreInfo}>
        <Text style={styles.netScore}>{player.netScore}</Text>
        <Text style={styles.scoreLabel}>Net Score</Text>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Leaderboard</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* Filter Type */}
        <ThemedView style={styles.filterSection}>
          <ThemedText style={styles.filterLabel}>Category</ThemedText>
          <View style={styles.filterRow}>
            {(['friends', 'league', 'global'] as FilterType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterButton, filterType === type && styles.activeFilter]}
                onPress={() => setFilterType(type)}
              >
                <Text style={[styles.filterText, filterType === type && styles.activeFilterText]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* Hole Filter */}
        <ThemedView style={styles.filterSection}>
          <ThemedText style={styles.filterLabel}>Round Type</ThemedText>
          <View style={styles.filterRow}>
            {(['9-hole', '18-hole'] as HoleType[]).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.filterButton, holeFilter === type && styles.activeFilter]}
                onPress={() => setHoleFilter(type)}
              >
                <Text style={[styles.filterText, holeFilter === type && styles.activeFilterText]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* Time Range */}
        <ThemedView style={styles.filterSection}>
          <ThemedText style={styles.filterLabel}>Time Period</ThemedText>
          <View style={styles.filterRow}>
            {(['weekly', 'monthly', 'yearly'] as TimeRange[]).map((range) => (
              <TouchableOpacity
                key={range}
                style={[styles.filterButton, timeRange === range && styles.activeFilter]}
                onPress={() => setTimeRange(range)}
              >
                <Text style={[styles.filterText, timeRange === range && styles.activeFilterText]}>
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* Rankings */}
        <ThemedView style={styles.rankingsSection}>
          <ThemedText type="subtitle">
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)} Rankings - {holeFilter} ({timeRange})
          </ThemedText>

          <View style={styles.rankingsList}>
            {sampleRankings.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyIconRow}>⛳ 🏌️ ⛳</Text>
                <Text style={styles.emptyText}>No Rankings Yet</Text>
                <Text style={styles.emptySubtext}>
                  Record your rounds and compete{'\n'}
                  with friends to see who's on top!
                </Text>
                <View style={styles.emptyHint}>
                  <Text style={styles.emptyHintEmoji}>💡</Text>
                  <Text style={styles.emptyHintText}>
                    Tip: Play 3+ rounds to get your ranking
                  </Text>
                </View>
              </View>
            ) : (
              sampleRankings.map((player, index) => renderRankingItem(player, index + 1))
            )}
          </View>
        </ThemedView>

        {/* Info Section */}
        <ThemedView style={styles.infoSection}>
          <ThemedText style={styles.infoText}>
            Rankings are calculated using World Handicap System net scores.
            Play more rounds to improve your position!
          </ThemedText>
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
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    padding: 10,
    borderWidth: 2,
    borderColor: GolfColors.gray,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: GolfColors.white,
  },
  activeFilter: {
    backgroundColor: GolfColors.primary,
    borderColor: GolfColors.primary,
  },
  filterText: {
    fontSize: 14,
    color: GolfColors.darkGray,
  },
  activeFilterText: {
    color: GolfColors.white,
    fontWeight: '600',
  },
  rankingsSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  rankingsList: {
    marginTop: 12,
  },
  rankingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: GolfColors.cardBg,
    borderWidth: 1,
    borderColor: GolfColors.cardBgAlt,
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GolfColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: GolfColors.fairway,
  },
  rankNumber: {
    color: GolfColors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: GolfColors.black,
  },
  currentPlayer: {
    color: GolfColors.primary,
  },
  playerStats: {
    fontSize: 12,
    color: GolfColors.gray,
  },
  scoreInfo: {
    alignItems: 'center',
  },
  netScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GolfColors.success,
  },
  scoreLabel: {
    fontSize: 10,
    color: GolfColors.gray,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoSection: {
    padding: 16,
    backgroundColor: GolfColors.cardBgAlt,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: GolfColors.lightGray,
  },
  infoText: {
    fontSize: 14,
    color: GolfColors.darkGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: GolfColors.cardBg,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 8,
  },
  emptyIconRow: {
    fontSize: 32,
    marginBottom: 16,
    letterSpacing: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: GolfColors.primaryDark,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: GolfColors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GolfColors.sand,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyHintEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  emptyHintText: {
    fontSize: 13,
    color: GolfColors.primaryDark,
    fontWeight: '500',
  },
});