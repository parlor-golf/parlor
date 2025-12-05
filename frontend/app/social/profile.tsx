import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, TextInput, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GolfSession as ApiGolfSession, getUserProfile, getUserSessionsById, UserProfile as ApiUserProfile } from '@/services/api';
import { useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GolfColors } from '@/constants/theme';

interface GolfSession {
  id: string;
  courseName: string;
  date: string;
  holes: number;
  totalScore: number;
  par: number;
  images?: string[];
  isPrivate: boolean;
}

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  handicap: number;
  totalRounds: number;
  averageScore: number;
  avatar?: string;
  friends: string[];
}

export default function Profile() {
  const params = useLocalSearchParams();
  const [isEditing, setIsEditing] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [golfSessions, setGolfSessions] = useState<GolfSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isViewingSelf, setIsViewingSelf] = useState(true);
  const [friendsCount, setFriendsCount] = useState(0);

  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'currentUser',
    name: 'Golfer',
    username: 'golfer',
    email: '',
    handicap: 15,
    totalRounds: 0,
    averageScore: 0,
    friends: ['alice123', 'mikeg', 'sarahc'],
  });

  useEffect(() => {
    loadProfileAndSessions();
  }, [params.userId]);

  const loadProfileAndSessions = async () => {
    setIsProfileLoading(true);
    setIsLoading(true);

    const nameFromStorage = await AsyncStorage.getItem('name');
    const uidFromStorage = await AsyncStorage.getItem('uid');
    const incomingUid = typeof params.userId === 'string' ? params.userId : undefined;
    const targetUid = incomingUid || uidFromStorage || '';

    setIsViewingSelf(!incomingUid || incomingUid === uidFromStorage);

    if (!targetUid) {
      setIsProfileLoading(false);
      setIsLoading(false);
      return;
    }

    try {
      const [profileRes, sessionsRes] = await Promise.all([
        getUserProfile(targetUid),
        getUserSessionsById(targetUid),
      ]);

      const profileData: ApiUserProfile | undefined = profileRes.data?.profile;
      const fetchedSessions = (sessionsRes.data?.sessions || []).map((session: ApiGolfSession) => ({
        id: session.id || '',
        courseName: session.courseName,
        date: session.endTime || session.timestamp || '',
        holes: session.holes,
        totalScore: session.totalScore,
        par: session.holes === 18 ? 72 : 36,
        isPrivate: session.privacy === 'private',
      }));

      setGolfSessions(fetchedSessions);

      const totalRounds = fetchedSessions.length;
      const averageScore = totalRounds > 0
        ? Math.round(fetchedSessions.reduce((sum, s) => sum + s.totalScore, 0) / totalRounds)
        : 0;

      setUserProfile(prev => ({
        ...prev,
        id: targetUid,
        name: profileData?.name || nameFromStorage || prev.name,
        username: profileData?.name
          ? profileData.name.toLowerCase().replace(/\s+/g, '')
          : prev.username,
        email: profileData?.email || prev.email,
        handicap: profileData?.final_score ?? prev.handicap,
        totalRounds: profileData?.total_sessions ?? totalRounds,
        averageScore,
        friends: prev.friends,
      }));

      setFriendsCount(profileData?.friends_count ?? 0);
    } catch (error) {
      Alert.alert('Error', 'Unable to load profile right now.');
    } finally {
      setIsProfileLoading(false);
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileAndSessions();
    setRefreshing(false);
  };

  const addFriend = () => {
    if (!searchUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    if (userProfile.friends.includes(searchUsername)) {
      Alert.alert('Already Friends', 'You are already friends with this user');
      return;
    }

    setUserProfile(prev => ({
      ...prev,
      friends: [...prev.friends, searchUsername],
    }));
    
    setSearchUsername('');
    Alert.alert('Success', `Friend request sent to ${searchUsername}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const renderSessionItem = (session: GolfSession) => (
    <View key={session.id} style={styles.sessionItem}>
      <View style={styles.sessionHeader}>
        <Text style={styles.courseName}>{session.courseName}</Text>
        <Text style={styles.sessionDate}>{formatDate(session.date)}</Text>
      </View>
      
      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{session.totalScore}</Text>
          <Text style={styles.statLabel}>Score</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{session.totalScore - session.par > 0 ? '+' : ''}{session.totalScore - session.par}</Text>
          <Text style={styles.statLabel}>To Par</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{session.holes}</Text>
          <Text style={styles.statLabel}>Holes</Text>
        </View>
      </View>
      
      {session.isPrivate && (
        <View style={styles.privateIndicator}>
          <Text style={styles.privateText}>Private</Text>
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isProfileLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={GolfColors.primary} />
            <Text style={{ marginTop: 8, color: GolfColors.gray }}>Loading profile...</Text>
          </View>
        ) : (
          <>
        {/* Profile Info */}
        <ThemedView style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userProfile.name.charAt(0)}</Text>
            </View>
          </View>
          
          <Text style={styles.userName}>{userProfile.name}</Text>
          <Text style={styles.userHandle}>@{userProfile.username}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{userProfile.handicap}</Text>
              <Text style={styles.profileStatLabel}>Handicap</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{userProfile.totalRounds}</Text>
              <Text style={styles.profileStatLabel}>Rounds</Text>
            </View>
            <View style={styles.profileStat}>
              <Text style={styles.profileStatValue}>{userProfile.averageScore}</Text>
              <Text style={styles.profileStatLabel}>Avg Score</Text>
            </View>
          </View>
        </ThemedView>

        {/* Friends Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Friends ({friendsCount || userProfile.friends.length})</ThemedText>
          
          {isViewingSelf ? (
            <View style={styles.addFriendContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Enter username"
                value={searchUsername}
                onChangeText={setSearchUsername}
              />
              <TouchableOpacity style={styles.addButton} onPress={addFriend}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={{ color: GolfColors.gray, marginTop: 8 }}>
              You&apos;re viewing a public profile.
            </Text>
          )}
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.friendsList}>
            {userProfile.friends.map((friend, index) => (
              <View key={index} style={styles.friendItem}>
                <View style={styles.friendAvatar}>
                  <Text style={styles.friendAvatarText}>{friend.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.friendName}>{friend}</Text>
              </View>
            ))}
          </ScrollView>
        </ThemedView>

        {/* Golf Sessions */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Recent Rounds</ThemedText>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : golfSessions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No rounds recorded yet</Text>
              <Text style={styles.emptySubtext}>Start recording your golf sessions!</Text>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              {golfSessions.map(renderSessionItem)}
            </View>
          )}
        </ThemedView>
          </>
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
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: GolfColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: GolfColors.fairway,
  },
  avatarText: {
    color: GolfColors.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: GolfColors.black,
  },
  userHandle: {
    fontSize: 16,
    color: GolfColors.gray,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GolfColors.primary,
  },
  profileStatLabel: {
    fontSize: 12,
    color: GolfColors.gray,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 24,
  },
  addFriendContainer: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: GolfColors.gray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: GolfColors.white,
  },
  addButton: {
    backgroundColor: GolfColors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: GolfColors.white,
    fontWeight: '600',
  },
  friendsList: {
    marginTop: 8,
  },
  friendItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: GolfColors.fairway,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: GolfColors.primary,
  },
  friendAvatarText: {
    color: GolfColors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 12,
    textAlign: 'center',
    color: GolfColors.black,
  },
  sessionsList: {
    marginTop: 12,
  },
  sessionItem: {
    backgroundColor: GolfColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: GolfColors.cardBgAlt,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: GolfColors.primaryDark,
  },
  sessionDate: {
    fontSize: 14,
    color: GolfColors.gray,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GolfColors.black,
  },
  statLabel: {
    fontSize: 12,
    color: GolfColors.gray,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  privateIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: GolfColors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  privateText: {
    color: GolfColors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: GolfColors.darkGray,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: GolfColors.gray,
  },
});
