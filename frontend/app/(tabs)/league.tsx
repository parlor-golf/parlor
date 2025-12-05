import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { GolfColors } from '@/constants/theme';
import { createLeague as createLeagueApi, getLeagues, joinLeague as joinLeagueApi } from '@/services/api';
import type { League } from '@/services/api';

export default function League() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [leagueName, setLeagueName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const loadLeagues = async () => {
    setIsLoading(true);
    setError(null);
    const response = await getLeagues();
    if (response.error) {
      setError(response.error);
    } else {
      setLeagues(response.data?.leagues || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLeagues();
  }, []);

  const handleCreateLeague = async () => {
    if (!leagueName.trim()) {
      Alert.alert('Error', 'Please enter a league name');
      return;
    }

    const response = await createLeagueApi(leagueName);
    if (response.error) {
      Alert.alert('Error', response.error);
      return;
    }

    setShowCreateForm(false);
    setLeagueName('');
    Alert.alert('Success', `League "${leagueName}" created!`);
    loadLeagues();
  };

  const handleJoinLeague = async () => {
    if (!joinCode.trim()) {
      Alert.alert('Error', 'Please enter a league code');
      return;
    }

    const response = await joinLeagueApi(joinCode);
    if (response.error) {
      Alert.alert('Error', response.error);
    } else {
      Alert.alert('Success', 'Joined league!');
      setShowJoinForm(false);
      setJoinCode('');
      loadLeagues();
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Leagues</ThemedText>
        <ThemedText style={styles.ownerBadge}>See the clubs you belong to</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        <ThemedView style={styles.heroSection}>
          <Text style={styles.heroIcon}>🏆</Text>
          <Text style={styles.heroTitle}>Compete together</Text>
          <Text style={styles.heroSubtext}>
            Check out the leagues you are part of, then search or create a new one.
          </Text>
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Your Leagues</ThemedText>
            <TouchableOpacity onPress={loadLeagues}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={styles.centered}>
              <ActivityIndicator color={GolfColors.primary} />
            </View>
          )}

          {!!error && (
            <ThemedText style={styles.errorText}>{error}</ThemedText>
          )}

          {!isLoading && !error && leagues.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🌱</Text>
              <Text style={styles.emptyText}>No leagues yet. Start one below!</Text>
            </View>
          )}

          {!isLoading && leagues.map((league) => (
            <View key={league.id} style={styles.leagueCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.leagueName}>{league.name || 'Untitled League'}</Text>
                <Text style={styles.leagueMeta}>
                  Members: {league.memberCount ?? 0}
                </Text>
              </View>
              <View style={styles.leagueBadge}>
                <Text style={styles.leagueBadgeText}>Active</Text>
              </View>
            </View>
          ))}
        </ThemedView>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => setShowJoinForm((prev) => !prev)}
        >
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Search / Join League
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowCreateForm((prev) => !prev)}
        >
          <Text style={styles.actionButtonText}>Create League</Text>
        </TouchableOpacity>

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
                onPress={handleJoinLeague}
              >
                <Text style={styles.confirmButtonText}>Join</Text>
              </TouchableOpacity>
            </View>
          </ThemedView>
        )}

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
                onPress={handleCreateLeague}
              >
                <Text style={styles.confirmButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </ThemedView>
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
  ownerBadge: {
    fontSize: 14,
    color: GolfColors.primary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  heroSection: {
    backgroundColor: GolfColors.cardBg,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: GolfColors.primary,
  },
  heroIcon: {
    fontSize: 72,
    marginBottom: 8,
  },
  heroIconRow: {
    fontSize: 28,
    letterSpacing: 12,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: GolfColors.primaryDark,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroSubtext: {
    fontSize: 14,
    color: GolfColors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  heroBenefits: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 8,
  },
  benefitItem: {
    alignItems: 'center',
    flex: 1,
  },
  benefitIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 11,
    fontWeight: '600',
    color: GolfColors.primaryDark,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refreshText: {
    color: GolfColors.primary,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: GolfColors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: GolfColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  secondaryButtonText: {
    color: GolfColors.primary,
  },
  formSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: GolfColors.gray,
  },
  input: {
    borderWidth: 1,
    borderColor: GolfColors.gray,
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
    backgroundColor: GolfColors.cardBg,
  },
  cancelButtonText: {
    color: GolfColors.gray,
  },
  confirmButton: {
    backgroundColor: GolfColors.success,
  },
  confirmButtonText: {
    color: GolfColors.white,
    fontWeight: '600',
  },
  challengeText: {
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 8,
  },
  leagueCard: {
    backgroundColor: GolfColors.cardBg,
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eaeaea',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  leagueName: {
    fontSize: 18,
    fontWeight: '700',
    color: GolfColors.primaryDark,
  },
  leagueMeta: {
    color: GolfColors.gray,
    marginTop: 4,
  },
  leagueBadge: {
    backgroundColor: GolfColors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  leagueBadgeText: {
    color: GolfColors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  emptyText: {
    color: GolfColors.gray,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  errorText: {
    color: GolfColors.error,
    marginBottom: 8,
  },
});
