import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, Animated } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getFeedSessions, GolfSession } from '@/services/api';
import { GolfColors } from '@/constants/theme';

export default function Feed() {
  const [sessions, setSessions] = useState<GolfSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    if (!isLoading && sessions.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading, sessions]);

  const loadFeed = async () => {
    setIsLoading(true);
    const result = await getFeedSessions(20);

    if (result.data && result.data.sessions) {
      setSessions(result.data.sessions);
    }

    setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeed();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getScoreEmoji = (toPar: number) => {
    if (toPar <= -3) return '🦅'; // Eagle or better
    if (toPar === -2) return '🦅'; // Eagle
    if (toPar === -1) return '🐦'; // Birdie
    if (toPar === 0) return '⭐'; // Par
    if (toPar === 1) return '🟡'; // Bogey
    if (toPar === 2) return '🔴'; // Double Bogey
    return '🔴'; // Worse
  };

  const renderSessionItem = (session: GolfSession, index: number) => {
    const par = session.holes === 18 ? 72 : 36;
    const toPar = session.totalScore - par;
    const toParText = toPar > 0 ? `+${toPar}` : toPar === 0 ? 'E' : `${toPar}`;
    const scoreEmoji = getScoreEmoji(toPar);

    return (
      <Animated.View
        key={session.id}
        style={[
          styles.sessionCard,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              }),
            }],
          }
        ]}
      >
        <View style={styles.sessionHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>{session.username?.charAt(0).toUpperCase() || 'U'}</Text>
          </View>
          <View style={styles.sessionHeaderInfo}>
            <Text style={styles.username}>{session.username || 'Unknown User'}</Text>
            <Text style={styles.timeAgo}>{formatDate(session.timestamp || session.endTime || '')}</Text>
          </View>
          {session.privacy === 'public' && (
            <View style={styles.publicBadge}>
              <Text style={styles.publicBadgeText}>Public</Text>
            </View>
          )}
        </View>

        <View style={styles.sessionContent}>
          <View style={styles.courseNameRow}>
            <Text style={styles.courseName}>⛳ {session.courseName}</Text>
            <Text style={styles.scoreEmoji}>{scoreEmoji}</Text>
          </View>
          <View style={styles.sessionStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Score</Text>
              <Text style={styles.statValue}>{session.totalScore}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>To Par</Text>
              <Text style={[styles.statValue, toPar < 0 && styles.underPar]}>{toParText}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Holes</Text>
              <Text style={styles.statValue}>🏌️ {session.holes}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>⏱️ {formatDuration(session.duration)}</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Feed</ThemedText>
      </ThemedView>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GolfColors.primary} />
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyMainIcon}>⛳</Text>
            <Text style={styles.emptyIconRow}>🏌️ 🏌️ 🏌️</Text>
            <Text style={styles.emptyText}>Your Feed is Empty</Text>
            <Text style={styles.emptySubtext}>
              Start recording rounds or add friends{'\n'}
              to see their latest golf sessions!
            </Text>
            <View style={styles.emptyActions}>
              <View style={styles.emptyActionItem}>
                <Text style={styles.emptyActionIcon}>➕</Text>
                <Text style={styles.emptyActionText}>Record a Round</Text>
              </View>
              <View style={styles.emptyActionItem}>
                <Text style={styles.emptyActionIcon}>👥</Text>
                <Text style={styles.emptyActionText}>Add Friends</Text>
              </View>
            </View>
          </View>
        ) : (
          sessions.map((session, index) => renderSessionItem(session, index))
        )}
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
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: GolfColors.cardBg,
    borderRadius: 12,
    margin: 20,
    borderWidth: 2,
    borderColor: GolfColors.primary,
    borderStyle: 'dashed',
  },
  emptyMainIcon: {
    fontSize: 80,
    marginBottom: 8,
  },
  emptyIconRow: {
    fontSize: 28,
    marginBottom: 20,
    letterSpacing: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '700',
    color: GolfColors.primaryDark,
    marginBottom: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: GolfColors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  emptyActionItem: {
    alignItems: 'center',
    backgroundColor: GolfColors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: GolfColors.fairway,
    minWidth: 120,
  },
  emptyActionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  emptyActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: GolfColors.primaryDark,
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: GolfColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: GolfColors.cardBgAlt,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GolfColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: GolfColors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  sessionHeaderInfo: {
    flex: 1,
    marginLeft: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: GolfColors.black,
  },
  timeAgo: {
    fontSize: 12,
    color: GolfColors.gray,
  },
  publicBadge: {
    backgroundColor: GolfColors.fairway,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  publicBadgeText: {
    color: GolfColors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  sessionContent: {
    marginTop: 8,
  },
  courseNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GolfColors.primaryDark,
    flex: 1,
  },
  scoreEmoji: {
    fontSize: 28,
    marginLeft: 8,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: GolfColors.white,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: GolfColors.lightGray,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: GolfColors.gray,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GolfColors.black,
  },
  underPar: {
    color: GolfColors.underPar,
  },
});