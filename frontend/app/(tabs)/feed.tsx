import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Animated,
  Image,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Alert,
  Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getFeedSessions, GolfSession, toggleLike, addComment, SessionComment, deleteSession } from '@/services/api';
import { GolfColors, Shadows, Spacing, BorderRadius, Colors, Gradients } from '@/constants/theme';
import { FeedSkeletonLoader } from '@/components/SkeletonLoader';
import { SpringConfigs, CustomEasing, createButtonPressAnimation } from '@/utils/animations';
import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function Feed() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const dynamicColors = {
    background: isDarkMode ? Colors.dark.background : GolfColors.lightGray,
    card: isDarkMode ? '#223222' : GolfColors.white,
    overlayCard: isDarkMode ? '#1e2c1e' : 'rgba(0,0,0,0.02)',
    textPrimary: isDarkMode ? Colors.dark.text : GolfColors.black,
    textSecondary: isDarkMode ? Colors.dark.icon : GolfColors.gray,
    divider: isDarkMode ? '#2f4230' : GolfColors.lightGray,
    statGradient: isDarkMode ? Gradients.cardDark : ['#F8FCF9', '#EBF5ED'],
  };
  const [sessions, setSessions] = useState<GolfSession[]>([]);
  const [likeState, setLikeState] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [commentState, setCommentState] = useState<Record<string, SessionComment[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUid, setCurrentUid] = useState<string>('');

  // Animation refs for staggered list
  const cardAnimations = useRef<{ opacity: Animated.Value; translateY: Animated.Value; scale: Animated.Value }[]>([]).current;
  const headerAnim = useRef(new Animated.Value(0)).current;
  const notificationScale = useRef(new Animated.Value(1)).current;

  // Initialize animations for cards
  const initializeAnimations = (count: number) => {
    while (cardAnimations.length < count) {
      cardAnimations.push({
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(40),
        scale: new Animated.Value(0.95),
      });
    }
  };

  useEffect(() => {
    loadFeed();
    AsyncStorage.getItem('uid').then((uid) => {
      if (uid) setCurrentUid(uid);
    });
    // Animate header in
    Animated.spring(headerAnim, {
      toValue: 1,
      ...SpringConfigs.gentle,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!isLoading && sessions.length > 0) {
      initializeAnimations(sessions.length);
      animateCards();
    }
  }, [isLoading, sessions]);

  const animateCards = () => {
    const animations = cardAnimations.slice(0, sessions.length).map((anim, index) =>
      Animated.parallel([
        Animated.spring(anim.opacity, {
          toValue: 1,
          ...SpringConfigs.gentle,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.spring(anim.translateY, {
          toValue: 0,
          ...SpringConfigs.bouncy,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: 1,
          ...SpringConfigs.gentle,
          delay: index * 80,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(80, animations).start();
  };

  const loadFeed = async () => {
    setIsLoading(true);
    console.log('[Feed] Loading feed...');
    const result = await getFeedSessions(20);

    if (result.data && result.data.sessions) {
      console.log('[Feed] Loaded sessions:', result.data.sessions.length);
      setSessions(result.data.sessions);
      const initialLikes: Record<string, { liked: boolean; count: number }> = {};
      const initialComments: Record<string, SessionComment[]> = {};
      result.data.sessions.forEach((session) => {
        const likes = (session as any).likes || {};
        const comments = (session as any).comments || {};
        initialLikes[session.id || ''] = {
          liked: false,
          count: Object.keys(likes).length,
        };
        initialComments[session.id || ''] = Object.values(comments) as SessionComment[];
      });
      setLikeState(initialLikes);
      setCommentState(initialComments);
    } else if (result.error) {
      console.error('[Feed] Error loading feed:', result.error);
      Alert.alert('Error', `Failed to load feed: ${result.error}`);
    } else {
      console.log('[Feed] No sessions found');
    }

    setIsLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Reset animations
    cardAnimations.forEach(anim => {
      anim.opacity.setValue(0);
      anim.translateY.setValue(40);
      anim.scale.setValue(0.95);
    });
    await loadFeed();
    setRefreshing(false);
  };

  const handleNotificationPress = () => {
    createButtonPressAnimation(notificationScale, handleNotifications);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
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

  const getScoreColor = (toPar: number) => {
    if (toPar < 0) return GolfColors.underPar;
    if (toPar === 0) return GolfColors.par;
    return GolfColors.overPar;
  };

  const handleLike = (sessionId: string) => {
    if (!sessionId) return;

    // Optimistic UI
    setLikeState(prev => {
      const current = prev[sessionId] || { liked: false, count: 0 };
      return {
        ...prev,
        [sessionId]: {
          liked: !current.liked,
          count: current.count + (current.liked ? -1 : 1),
        },
      };
    });

    toggleLike(sessionId).then((result) => {
      if (result.error) {
        Alert.alert('Error', result.error);
        // rollback
        setLikeState(prev => {
          const current = prev[sessionId] || { liked: false, count: 0 };
          return {
            ...prev,
            [sessionId]: {
              liked: !current.liked,
              count: current.count + (current.liked ? -1 : 1),
            },
          };
        });
      } else if (result.data) {
        setLikeState(prev => ({
          ...prev,
          [sessionId]: {
            liked: result.data.liked,
            count: result.data.like_count,
          },
        }));
      }
    });
  };

  const handleComment = (sessionId: string) => {
    Alert.prompt(
      'Add Comment',
      'Share your thoughts on this round',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Post',
          onPress: async (text) => {
            if (!text) return;
            const result = await addComment(sessionId, text);
            if (result.error) {
              Alert.alert('Error', result.error);
            } else if (result.data?.comment) {
              setCommentState(prev => ({
                ...prev,
                [sessionId]: [...(prev[sessionId] || []), result.data!.comment],
              }));
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const handleShare = async (session: GolfSession) => {
    try {
      const par = session.holes === 18 ? 72 : 36;
      const toPar = session.totalScore - par;
      const toParText = toPar > 0 ? `+${toPar}` : toPar === 0 ? 'E' : `${toPar}`;

      await Share.share({
        message: `Check out this round at ${session.courseName}! Score: ${session.totalScore} (${toParText}) - ${session.holes} holes. Shared via Parlor Golf App`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleMoreOptions = (session: GolfSession) => {
    const isOwner = session.uid && session.uid === currentUid;
    const options = [
      { text: 'Report', onPress: () => Alert.alert('Reported', 'Thank you for your feedback.') },
    ];

    if (isOwner) {
      options.push({
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (!session.id) return;
          deleteSession(session.id).then((result) => {
            if (result.error) {
              Alert.alert('Error', result.error);
            } else {
              setSessions(prev => prev.filter(s => s.id !== session.id));
              setLikeState(prev => {
                const updated = { ...prev };
                delete updated[session.id!];
                return updated;
              });
              setCommentState(prev => {
                const updated = { ...prev };
                delete updated[session.id!];
                return updated;
              });
            }
          });
        },
      });
    }

    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Options', 'What would you like to do?', options);
  };

  const handleNotifications = () => {
    router.push('/(tabs)/notifications');
  };

  const handleFindFriends = () => {
    Alert.alert(
      'Find Friends',
      'Search for golfers to connect with. (Feature coming soon)',
      [{ text: 'OK' }]
    );
  };

  const renderSessionItem = (session: GolfSession, index: number) => {
    const par = session.holes === 18 ? 72 : 36;
    const toPar = session.totalScore - par;
    const toParText = toPar > 0 ? `+${toPar}` : toPar === 0 ? 'E' : `${toPar}`;
    const hasPhotos = session.images && session.images.length > 0;

    const anim = cardAnimations[index] || {
      opacity: new Animated.Value(1),
      translateY: new Animated.Value(0),
      scale: new Animated.Value(1),
    };

    return (
      <Animated.View
        key={session.id || index}
        style={[
          styles.sessionCard,
          {
            backgroundColor: dynamicColors.card,
            opacity: anim.opacity,
            transform: [
              { translateY: anim.translateY },
              { scale: anim.scale },
            ],
          }
        ]}
      >
        {/* Session Header */}
        <View style={styles.sessionHeader}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => router.push({
              pathname: '/social/profile',
              params: { userId: session.uid }
            })}
          >
            <LinearGradient
              colors={[GolfColors.primary, GolfColors.primaryLight]}
              style={styles.userAvatar}
            >
              <Text style={styles.avatarText}>
                {session.username?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
            <View style={styles.sessionHeaderInfo}>
              <Text style={[styles.username, { color: dynamicColors.textPrimary }]}>{session.username || 'Unknown'}</Text>
              <View style={styles.metaRow}>
                <Ionicons name="time-outline" size={12} color={dynamicColors.textSecondary} />
                <Text style={[styles.timeAgo, { color: dynamicColors.textSecondary }]}>{formatDate(session.timestamp || session.endTime || '')}</Text>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerRight}>
            {session.privacy === 'public' && (
              <View style={styles.publicBadge}>
                <Ionicons name="globe-outline" size={10} color={GolfColors.white} />
              </View>
            )}
            <TouchableOpacity style={styles.moreButton} onPress={() => handleMoreOptions(session)}>
              <Ionicons name="ellipsis-horizontal" size={20} color={GolfColors.gray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Photo Gallery */}
        {hasPhotos && (
          <View style={styles.photoContainer}>
            <Image
              source={{ uri: session.images![0] }}
              style={styles.sessionPhoto}
              resizeMode="cover"
            />
            {session.images!.length > 1 && (
              <View style={styles.photoCount}>
                <Ionicons name="images" size={12} color={GolfColors.white} />
                <Text style={styles.photoCountText}>{session.images!.length}</Text>
              </View>
            )}
          </View>
        )}

        {/* Course Info */}
        <View style={styles.courseInfo}>
          <View style={styles.courseNameContainer}>
            <Ionicons name="golf" size={18} color={GolfColors.primary} />
            <Text style={[styles.courseName, { color: dynamicColors.textPrimary }]}>{session.courseName}</Text>
          </View>
          <View style={styles.holesInfo}>
            <Text style={[styles.holesText, { color: dynamicColors.textSecondary }]}>{session.holes} holes</Text>
          </View>
        </View>

        {/* Score Stats */}
        <View style={styles.statsContainer}>
          <LinearGradient
            colors={dynamicColors.statGradient as any}
            style={styles.statsGradient}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: dynamicColors.textSecondary }]}>Score</Text>
              <Text style={[styles.statValue, { color: dynamicColors.textPrimary }]}>{session.totalScore}</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: dynamicColors.textSecondary }]}>To Par</Text>
              <Text style={[styles.statValue, { color: getScoreColor(toPar) }]}>
                {toParText}
              </Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: dynamicColors.textSecondary }]}>Duration</Text>
              <Text style={[styles.statValue, { color: dynamicColors.textPrimary }]}>{formatDuration(session.duration)}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Action Bar */}
        <View style={[styles.actionBar, { borderTopColor: dynamicColors.divider }]}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: dynamicColors.overlayCard }]} onPress={() => handleLike(session.id || '')}>
            <Ionicons
              name={likeState[session.id || '']?.liked ? 'heart' : 'heart-outline'}
              size={22}
              color={likeState[session.id || '']?.liked ? GolfColors.error : GolfColors.gray}
            />
            <Text style={[styles.actionCount, { color: dynamicColors.textSecondary }]}>{likeState[session.id || '']?.count ?? 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: dynamicColors.overlayCard }]} onPress={() => handleComment(session.id || '')}>
            <Ionicons name="chatbubble-outline" size={20} color={GolfColors.gray} />
            <Text style={[styles.actionCount, { color: dynamicColors.textSecondary }]}>{(commentState[session.id || ''] || []).length}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: dynamicColors.overlayCard }]} onPress={() => handleShare(session)}>
            <Ionicons name="share-outline" size={22} color={GolfColors.gray} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: dynamicColors.background }]}>
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
          <Text style={styles.headerTitle}>Feed</Text>
          <Animated.View style={{ transform: [{ scale: notificationScale }] }}>
            <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
              <Ionicons name="notifications-outline" size={24} color={GolfColors.white} />
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={GolfColors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <FeedSkeletonLoader count={3} />
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ImageBackground
              source={require('@/assets/images/golf/golf-fairway.jpg')}
              style={styles.emptyBackground}
              imageStyle={styles.emptyBackgroundImage}
            >
              <LinearGradient
                colors={isDarkMode ? ['rgba(26,46,26,0.95)', 'rgba(26,46,26,0.85)'] : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
                style={styles.emptyOverlay}
              >
                <View style={styles.emptyIconContainer}>
                  <Ionicons name="golf" size={48} color={GolfColors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: dynamicColors.textPrimary }]}>Your Feed is Empty</Text>
                <Text style={[styles.emptySubtext, { color: dynamicColors.textSecondary }]}>
                  Start recording rounds or add friends to see their latest golf sessions
                </Text>

                <View style={styles.emptyActions}>
                  <TouchableOpacity
                    style={styles.emptyActionButton}
                    onPress={() => router.push('/(tabs)/record')}
                  >
                    <LinearGradient
                      colors={[GolfColors.primary, GolfColors.primaryLight]}
                      style={styles.emptyActionGradient}
                    >
                      <Ionicons name="add" size={20} color={GolfColors.white} />
                      <Text style={styles.emptyActionText}>New Round</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.emptyActionButtonOutline} onPress={handleFindFriends}>
                    <Ionicons name="people" size={20} color={GolfColors.primary} />
                    <Text style={styles.emptyActionTextOutline}>Find Friends</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>
        ) : (
          sessions.map((session, index) => renderSessionItem(session, index))
        )}

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
  notificationButton: {
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
    backgroundColor: 'rgba(45,125,62,0.1)',
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
  emptyActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  emptyActionButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  emptyActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  emptyActionText: {
    color: GolfColors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyActionButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: GolfColors.primary,
    gap: Spacing.xs,
  },
  emptyActionTextOutline: {
    color: GolfColors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  sessionCard: {
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: GolfColors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  sessionHeaderInfo: {
    marginLeft: Spacing.sm,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    color: GolfColors.black,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  timeAgo: {
    fontSize: 12,
    color: GolfColors.gray,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  publicBadge: {
    backgroundColor: GolfColors.fairway,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    padding: 4,
  },
  photoContainer: {
    position: 'relative',
  },
  sessionPhoto: {
    width: '100%',
    height: 200,
  },
  photoCount: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  photoCountText: {
    color: GolfColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  courseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  courseNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: GolfColors.primaryDark,
  },
  holesInfo: {
    backgroundColor: GolfColors.cardBgAlt,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  holesText: {
    fontSize: 12,
    fontWeight: '500',
    color: GolfColors.gray,
  },
  statsContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  statsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: GolfColors.gray,
    opacity: 0.3,
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
    fontWeight: '700',
    color: GolfColors.black,
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: GolfColors.lightGray,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    backgroundColor: GolfColors.cardBg,
    borderRadius: BorderRadius.sm,
  },
  actionCount: {
    fontSize: 13,
    color: GolfColors.gray,
  },
  bottomSpacer: {
    height: 100,
  },
});
