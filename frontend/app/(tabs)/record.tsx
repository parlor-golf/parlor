import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

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

  const endSession = () => {
    if (activeSession) {
      const updatedSession = {
        ...activeSession,
        endTime: new Date(),
        isActive: false,
        scores: Object.fromEntries(
          Object.entries(scores).map(([hole, score]) => [parseInt(hole), parseInt(score) || 0])
        ),
      };
      
      Alert.alert('Session Complete', 'Golf session has been saved!');
      setActiveSession(null);
      setTimer(0);
      setScores({});
    }
  };

  const updateScore = (hole: number, score: string) => {
    setScores(prev => ({
      ...prev,
      [hole]: score,
    }));
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

          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <Text style={styles.startButtonText}>Start Round</Text>
          </TouchableOpacity>
        </ScrollView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Recording Round</ThemedText>
        <ThemedText type="subtitle">{activeSession.courseName}</ThemedText>
        <ThemedText style={styles.timer}>{formatTime(timer)}</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        <ThemedView style={styles.scoreSection}>
          <ThemedText type="subtitle">Enter Scores</ThemedText>
          
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

        <TouchableOpacity style={styles.endButton} onPress={endSession}>
          <Text style={styles.endButtonText}>Finish Round</Text>
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
  content: {
    flex: 1,
    padding: 20,
  },
  setupSection: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 10,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
  },
  startButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8,
    width: 60,
    textAlign: 'center',
  },
  endButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  endButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});