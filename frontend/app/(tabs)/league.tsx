import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface League {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  weeklyChallenge?: string;
  isOwner: boolean;
}

export default function League() {
  const [userLeague, setUserLeague] = useState<League | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');

  const createLeague = () => {
    if (!leagueName.trim()) {
      Alert.alert('Error', 'Please enter a league name');
      return;
    }

    const newLeague: League = {
      id: Date.now().toString(),
      name: leagueName,
      ownerId: 'currentUserId', // This would come from auth
      members: ['currentUserId'],
      weeklyChallenge: generateWeeklyChallenge(),
      isOwner: true,
    };

    setUserLeague(newLeague);
    setShowCreateForm(false);
    setLeagueName('');
    Alert.alert('Success', `League "${leagueName}" created!`);
  };

  const joinLeague = () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a league code');
      return;
    }

    // Simulate joining a league
    const joinedLeague: League = {
      id: joinCode,
      name: 'Sample League',
      ownerId: 'otherUserId',
      members: ['currentUserId', 'otherUserId'],
      weeklyChallenge: generateWeeklyChallenge(),
      isOwner: false,
    };

    setUserLeague(joinedLeague);
    setShowJoinForm(false);
    setJoinCode('');
    Alert.alert('Success', `Joined league "${joinedLeague.name}"!`);
  };

  const leaveLeague = () => {
    Alert.alert(
      'Leave League',
      'Are you sure you want to leave this league?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => setUserLeague(null) },
      ]
    );
  };

  const inviteMember = () => {
    if (!inviteUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    Alert.alert('Invite Sent', `Invitation sent to ${inviteUsername}`);
    setInviteUsername('');
  };

  const generateWeeklyChallenge = () => {
    const challenges = [
      'Complete an 18-hole round under par',
      'Achieve 3 birdies in a single round',
      'Play 3 rounds this week',
      'Improve your average score by 2 strokes',
      'Complete a round with no bogeys',
      'Play at a new golf course',
    ];
    return challenges[Math.floor(Math.random() * challenges.length)];
  };

  if (!userLeague) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">League</ThemedText>
        </ThemedView>

        <ScrollView style={styles.content}>
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Join or Create a League</ThemedText>
            <ThemedText>Compete with friends in weekly challenges and track your progress together.</ThemedText>
          </ThemedView>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCreateForm(true)}
          >
            <Text style={styles.actionButtonText}>Create League</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => setShowJoinForm(true)}
          >
            <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Join League</Text>
          </TouchableOpacity>

          {showCreateForm && (
            <ThemedView style={styles.formSection}>
              <ThemedText type="subtitle">Create New League</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="League Name"
                value={leagueName}
                onChangeText={setLeagueName}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowCreateForm(false);
                    setLeagueName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.confirmButton]}
                  onPress={createLeague}
                >
                  <Text style={styles.confirmButtonText}>Create</Text>
                </TouchableOpacity>
              </View>
            </ThemedView>
          )}

          {showJoinForm && (
            <ThemedView style={styles.formSection}>
              <ThemedText type="subtitle">Join League</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="League Code"
                value={joinCode}
                onChangeText={setJoinCode}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowJoinForm(false);
                    setJoinCode('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.confirmButton]}
                  onPress={joinLeague}
                >
                  <Text style={styles.confirmButtonText}>Join</Text>
                </TouchableOpacity>
              </View>
            </ThemedView>
          )}
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">{userLeague.name}</ThemedText>
        {userLeague.isOwner && <ThemedText style={styles.ownerBadge}>Owner</ThemedText>}
      </ThemedView>

      <ScrollView style={styles.content}>
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Weekly Challenge</ThemedText>
          <Text style={styles.challengeText}>{userLeague.weeklyChallenge}</Text>
        </ThemedView>

        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Members ({userLeague.members.length})</ThemedText>
          {userLeague.members.map((member, index) => (
            <View key={index} style={styles.memberItem}>
              <Text style={styles.memberName}>{member === 'currentUserId' ? 'You' : `Member ${index + 1}`}</Text>
            </View>
          ))}
        </ThemedView>

        {userLeague.isOwner && (
          <ThemedView style={styles.section}>
            <ThemedText type="subtitle">Invite Members</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={inviteUsername}
              onChangeText={setInviteUsername}
            />
            <TouchableOpacity style={styles.inviteButton} onPress={inviteMember}>
              <Text style={styles.inviteButtonText}>Send Invite</Text>
            </TouchableOpacity>
          </ThemedView>
        )}

        <TouchableOpacity style={styles.leaveButton} onPress={leaveLeague}>
          <Text style={styles.leaveButtonText}>Leave League</Text>
        </TouchableOpacity>
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
  ownerBadge: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: '#007AFF',
  },
  formSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    marginBottom: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
  },
  confirmButton: {
    backgroundColor: '#34C759',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  challengeText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 8,
  },
  memberItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberName: {
    fontSize: 16,
  },
  inviteButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});