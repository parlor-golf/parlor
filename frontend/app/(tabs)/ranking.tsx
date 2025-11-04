import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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

  // Sample data - would come from API
  const sampleRankings: PlayerRanking[] = [
    { id: '1', name: 'You', netScore: 72, rounds: 5, handicap: 12 },
    { id: '2', name: 'Alex Johnson', netScore: 75, rounds: 8, handicap: 15 },
    { id: '3', name: 'Sarah Chen', netScore: 78, rounds: 6, handicap: 18 },
    { id: '4', name: 'Mike Davis', netScore: 80, rounds: 4, handicap: 20 },
    { id: '5', name: 'Emma Wilson', netScore: 82, rounds: 7, handicap: 22 },
  ];

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
            {sampleRankings.map((player, index) => renderRankingItem(player, index + 1))}
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
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
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
    backgroundColor: '#f8f9fa',
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: 'white',
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
  },
  currentPlayer: {
    color: '#007AFF',
  },
  playerStats: {
    fontSize: 12,
    color: '#666',
  },
  scoreInfo: {
    alignItems: 'center',
  },
  netScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#34C759',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  infoSection: {
    padding: 16,
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});