import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Animated } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createSession, GolfSession as ApiGolfSession } from '@/services/api';
import { GolfColors } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GolfCourseMap from '@/components/GolfCourseMap';

interface GolfSession {
  id: string;
  courseId: string;
  courseName: string;
  holes: number;
  selectedHoles?: number[];
  scores: { [holeNumber: number]: number };
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
}

export default function Record() {
  const [activeSession, setActiveSession] = useState<GolfSession | null>(null);
  const [timer, setTimer] = useState(0);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedHoles, setSelectedHoles] = useState<number>(18);
  const [customHoles, setCustomHoles] = useState<number[]>([]);
  const [scores, setScores] = useState<{ [key: number]: string }>({});
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('friends');
  const [isSaving, setIsSaving] = useState(false);
  const [currentHole, setCurrentHole] = useState<number>(1);

  // Animation values
  const timerPulse = useRef(new Animated.Value(1)).current;
  const mapFadeIn = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Pulse animation for timer
  useEffect(() => {
    if (activeSession?.isActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(timerPulse, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(timerPulse, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [activeSession?.isActive]);

  // Fade in map when session starts
  useEffect(() => {
    if (activeSession) {
      Animated.timing(mapFadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } else {
      mapFadeIn.setValue(0);
    }
  }, [activeSession]);

  // Set up test authentication token for development
  useEffect(() => {
    const setupTestAuth = async () => {
      // Check if token exists
      const existingToken = await AsyncStorage.getItem('idToken');
      if (!existingToken) {
        // For testing, set a mock token (you'll need to sign up a real user later)
        Alert.alert(
          'Authentication Required',
          'Please note: You need to sign up/sign in to save sessions. For now, sessions will fail to save.',
          [{ text: 'OK' }]
        );
      }
    };
    setupTestAuth();
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeSession?.isActive) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession?.isActive]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const animateButtonPress = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => callback());
  };

  const startSession = () => {
    if (!selectedCourse) {
      Alert.alert('Error', 'Please select a golf course');
      return;
    }

    const newSession: GolfSession = {
      id: Date.now().toString(),
      courseId: selectedCourse,
      courseName: selectedCourse,
      holes: selectedHoles,
      selectedHoles: selectedHoles === 9 ? customHoles : undefined,
      scores: {},
      startTime: new Date(),
      isActive: true,
    };

    setActiveSession(newSession);
    setTimer(0);
  };

  const endSession = async () => {
    if (activeSession) {
      setIsSaving(true);

      const holeScores = Object.fromEntries(
        Object.entries(scores).map(([hole, score]) => [parseInt(hole), parseInt(score) || 0])
      );

      const totalScore = Object.values(holeScores).reduce((sum, score) => sum + score, 0);

      const sessionData: ApiGolfSession = {
        courseName: activeSession.courseName,
        holes: activeSession.holes,
        selectedHoles: activeSession.selectedHoles,
        scores: holeScores,
        totalScore,
        duration: timer,
        startTime: activeSession.startTime.toISOString(),
        endTime: new Date().toISOString(),
        privacy,
      };

      const result = await createSession(sessionData);
      setIsSaving(false);

      if (result.error) {
        Alert.alert('Error Saving Session',
          result.error + '\n\nNote: You need to be signed in to save sessions. Session data has been logged to console.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset anyway for testing
                setActiveSession(null);
                setTimer(0);
                setScores({});
                setPrivacy('friends');
              },
            },
          ]
        );
        console.log('Session would have saved:', sessionData);
      } else {
        Alert.alert('Session Complete', 'Golf session has been saved!', [
          {
            text: 'OK',
            onPress: () => {
              setActiveSession(null);
              setTimer(0);
              setScores({});
              setPrivacy('friends');
            },
          },
        ]);
      }
    }
  };

  const updateScore = (hole: number, score: string) => {
    setScores(prev => ({
      ...prev,
      [hole]: score,
    }));

    // Auto-advance to next hole when score is entered
    if (score && parseInt(score) > 0) {
      const holes = getHolesToDisplay();
      const currentIndex = holes.indexOf(hole);
      if (currentIndex < holes.length - 1) {
        setCurrentHole(holes[currentIndex + 1]);
      }
    }
  };

  const getHolesToDisplay = () => {
    if (selectedHoles === 18) {
      return Array.from({ length: 18 }, (_, i) => i + 1);
    } else {
      return customHoles.length > 0 ? customHoles : Array.from({ length: 9 }, (_, i) => i + 1);
    }
  };

  if (!activeSession) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Record Round</ThemedText>
        </ThemedView>

        <ScrollView style={styles.content}>
          <ThemedView style={styles.setupSection}>
            <ThemedText type="subtitle">Course Selection</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Select or enter golf course"
              value={selectedCourse}
              onChangeText={setSelectedCourse}
            />
          </ThemedView>

          <ThemedView style={styles.setupSection}>
            <ThemedText type="subtitle">Round Type</ThemedText>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.optionButton, selectedHoles === 18 && styles.selectedOption]}
                onPress={() => setSelectedHoles(18)}
              >
                <Text style={styles.optionText}>18 Holes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, selectedHoles === 9 && styles.selectedOption]}
                onPress={() => setSelectedHoles(9)}
              >
                <Text style={styles.optionText}>9 Holes</Text>
              </TouchableOpacity>
            </View>
          </ThemedView>

          {selectedHoles === 9 && (
            <ThemedView style={styles.setupSection}>
              <ThemedText type="subtitle">Select Holes (optional)</ThemedText>
              <ThemedText>Leave empty for holes 1-9</ThemedText>
            </ThemedView>
          )}

          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.startButton}
              onPress={() => animateButtonPress(startSession)}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>⛳ Start Round</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </ThemedView>
    );
  }

  const getScoresByHole = () => {
    const result: { [hole: number]: number } = {};
    Object.entries(scores).forEach(([hole, score]) => {
      const parsedScore = parseInt(score);
      if (!isNaN(parsedScore)) {
        result[parseInt(hole)] = parsedScore;
      }
    });
    return result;
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">🏌️ Recording Round</ThemedText>
        <ThemedText type="subtitle">⛳ {activeSession.courseName}</ThemedText>
        <Animated.View style={{ transform: [{ scale: timerPulse }] }}>
          <ThemedText style={styles.timer}>⏱️ {formatTime(timer)}</ThemedText>
        </Animated.View>
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* Golf Course Map */}
        <Animated.View style={{ opacity: mapFadeIn }}>
          <GolfCourseMap
            holes={activeSession.holes}
            currentHole={currentHole}
            scores={getScoresByHole()}
          />
        </Animated.View>

        <ThemedView style={styles.scoreSection}>
          <ThemedText type="subtitle">⛳ Enter Scores</ThemedText>

          {getHolesToDisplay().map((hole) => (
            <View key={hole} style={styles.holeRow}>
              <Text style={styles.holeLabel}>Hole {hole}</Text>
              <TextInput
                style={styles.scoreInput}
                placeholder="Par"
                value={scores[hole] || ''}
                onChangeText={(text) => updateScore(hole, text)}
                keyboardType="numeric"
              />
            </View>
          ))}
        </ThemedView>

        <ThemedView style={styles.privacySection}>
          <ThemedText type="subtitle">Privacy</ThemedText>
          <View style={styles.privacyRow}>
            <TouchableOpacity
              style={[styles.privacyButton, privacy === 'public' && styles.selectedPrivacy]}
              onPress={() => setPrivacy('public')}
            >
              <Text style={[styles.privacyText, privacy === 'public' && styles.selectedPrivacyText]}>Public</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.privacyButton, privacy === 'friends' && styles.selectedPrivacy]}
              onPress={() => setPrivacy('friends')}
            >
              <Text style={[styles.privacyText, privacy === 'friends' && styles.selectedPrivacyText]}>Friends</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.privacyButton, privacy === 'private' && styles.selectedPrivacy]}
              onPress={() => setPrivacy('private')}
            >
              <Text style={[styles.privacyText, privacy === 'private' && styles.selectedPrivacyText]}>Private</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.endButton, isSaving && styles.disabledButton]}
            onPress={() => !isSaving && animateButtonPress(endSession)}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.endButtonText}>🏁 Finish Round</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
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
  setupSection: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: GolfColors.gray,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
    backgroundColor: GolfColors.white,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 10,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: GolfColors.gray,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: GolfColors.white,
  },
  selectedOption: {
    backgroundColor: GolfColors.primary,
    borderColor: GolfColors.primary,
  },
  optionText: {
    fontSize: 16,
    color: GolfColors.black,
  },
  startButton: {
    backgroundColor: GolfColors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: GolfColors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  startButtonText: {
    color: GolfColors.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  timer: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  scoreSection: {
    marginBottom: 20,
  },
  holeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  holeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: GolfColors.black,
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: GolfColors.gray,
    borderRadius: 6,
    padding: 8,
    width: 60,
    textAlign: 'center',
    backgroundColor: GolfColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  endButton: {
    backgroundColor: GolfColors.error,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  endButtonText: {
    color: GolfColors.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  privacySection: {
    marginBottom: 20,
  },
  privacyRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 10,
  },
  privacyButton: {
    flex: 1,
    padding: 12,
    borderWidth: 2,
    borderColor: GolfColors.gray,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: GolfColors.white,
  },
  selectedPrivacy: {
    backgroundColor: GolfColors.fairway,
    borderColor: GolfColors.fairway,
  },
  privacyText: {
    fontSize: 14,
    color: GolfColors.darkGray,
  },
  selectedPrivacyText: {
    color: GolfColors.white,
    fontWeight: 'bold',
  },
});