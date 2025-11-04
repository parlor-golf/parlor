import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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
  const [isEditing, setIsEditing] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  
  // Sample user data - would come from auth/API
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'currentUser',
    name: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    handicap: 15,
    totalRounds: 42,
    averageScore: 85,
    friends: ['alice123', 'mikeg', 'sarahc'],
  });

  // Sample golf sessions - would come from API
  const [golfSessions] = useState<GolfSession[]>([
    {
      id: '1',
      courseName: 'Pebble Beach',
      date: '2024-10-25',
      holes: 18,
      totalScore: 82,
      par: 72,
      isPrivate: false,
    },
    {
      id: '2',
      courseName: 'Augusta National',
      date: '2024-10-20',
      holes: 18,
      totalScore: 78,
      par: 72,
      isPrivate: false,
    },
    {
      id: '3',
      courseName: 'Torrey Pines',
      date: '2024-10-15',
      holes: 9,
      totalScore: 38,
      par: 36,
      isPrivate: true,
    },
  ]);

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

      <ScrollView style={styles.content}>
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
          <ThemedText type="subtitle">Friends ({userProfile.friends.length})</ThemedText>
          
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
          
          <View style={styles.sessionsList}>
            {golfSessions.map(renderSessionItem)}
          </View>
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
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userHandle: {
    fontSize: 16,
    color: '#666',
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
    color: '#007AFF',
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
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
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
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
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  friendAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    fontSize: 12,
    textAlign: 'center',
  },
  sessionsList: {
    marginTop: 12,
  },
  sessionItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
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
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  privateIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  privateText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
});