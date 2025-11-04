import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { GolfColors } from '@/constants/theme';

interface GolfCourseMapProps {
  holes: number;
  currentHole?: number;
  scores?: { [hole: number]: number };
}

export default function GolfCourseMap({ holes, currentHole, scores = {} }: GolfCourseMapProps) {
  const holeAnimations = useRef<{ [key: number]: Animated.Value }>({});
  const currentHolePulse = useRef(new Animated.Value(1)).current;

  // Initialize animations for all holes
  useEffect(() => {
    for (let i = 1; i <= holes; i++) {
      if (!holeAnimations.current[i]) {
        holeAnimations.current[i] = new Animated.Value(1);
      }
    }
  }, [holes]);

  // Pulse animation for current hole
  useEffect(() => {
    if (currentHole) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(currentHolePulse, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(currentHolePulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [currentHole]);

  // Animate hole completion
  useEffect(() => {
    Object.keys(scores).forEach((holeStr) => {
      const hole = parseInt(holeStr);
      if (holeAnimations.current[hole]) {
        Animated.sequence([
          Animated.spring(holeAnimations.current[hole], {
            toValue: 1.3,
            useNativeDriver: true,
            friction: 3,
          }),
          Animated.spring(holeAnimations.current[hole], {
            toValue: 1,
            useNativeDriver: true,
            friction: 3,
          }),
        ]).start();
      }
    });
  }, [scores]);

  const renderHole = (holeNumber: number) => {
    const isCompleted = scores[holeNumber] !== undefined;
    const isCurrent = holeNumber === currentHole;
    const score = scores[holeNumber];

    const scale = isCurrent ? currentHolePulse : (holeAnimations.current[holeNumber] || new Animated.Value(1));

    return (
      <View key={holeNumber} style={styles.holeContainer}>
        <Animated.View style={[
          styles.hole,
          isCompleted && styles.holeCompleted,
          isCurrent && styles.holeCurrent,
          { transform: [{ scale }] }
        ]}>
          <Text style={styles.holeFlag}>⛳</Text>
          <Text style={[
            styles.holeNumber,
            (isCompleted || isCurrent) && styles.holeNumberActive,
          ]}>
            {holeNumber}
          </Text>
          {isCompleted && score && (
            <Text style={styles.holeScore}>{score}</Text>
          )}
        </Animated.View>
        {holeNumber < holes && (
          <View style={[
            styles.fairway,
            isCompleted && styles.fairwayCompleted,
          ]} />
        )}
      </View>
    );
  };

  const renderCourse = () => {
    const holesArray = Array.from({ length: holes }, (_, i) => i + 1);
    const rows = [];

    // Create rows of 3 holes each
    for (let i = 0; i < holesArray.length; i += 3) {
      const rowHoles = holesArray.slice(i, i + 3);
      rows.push(
        <View key={`row-${i}`} style={styles.courseRow}>
          {rowHoles.map(renderHole)}
        </View>
      );
    }

    return rows;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🏌️</Text>
        <Text style={styles.headerText}>Course Map</Text>
        <Text style={styles.headerEmoji}>🏌️</Text>
      </View>

      <View style={styles.mapContainer}>
        <View style={styles.clubhouse}>
          <Text style={styles.clubhouseText}>🏠 Clubhouse</Text>
        </View>

        {renderCourse()}

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: GolfColors.lightGray }]} />
            <Text style={styles.legendText}>Not Played</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: GolfColors.fairway }]} />
            <Text style={styles.legendText}>Playing Now</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: GolfColors.primary }]} />
            <Text style={styles.legendText}>Completed</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: GolfColors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: GolfColors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerEmoji: {
    fontSize: 24,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GolfColors.primaryDark,
    marginHorizontal: 12,
  },
  mapContainer: {
    backgroundColor: GolfColors.lightGray,
    borderRadius: 8,
    padding: 12,
  },
  clubhouse: {
    backgroundColor: GolfColors.sand,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GolfColors.primaryDark,
  },
  clubhouseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GolfColors.primaryDark,
  },
  courseRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  holeContainer: {
    alignItems: 'center',
    flex: 1,
  },
  hole: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: GolfColors.lightGray,
    borderWidth: 3,
    borderColor: GolfColors.gray,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  holeCompleted: {
    backgroundColor: GolfColors.primary,
    borderColor: GolfColors.primaryDark,
  },
  holeCurrent: {
    backgroundColor: GolfColors.fairway,
    borderColor: GolfColors.primary,
    borderWidth: 4,
  },
  holeFlag: {
    fontSize: 20,
    position: 'absolute',
    top: -5,
    right: -5,
  },
  holeNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GolfColors.darkGray,
  },
  holeNumberActive: {
    color: GolfColors.white,
  },
  holeScore: {
    fontSize: 12,
    color: GolfColors.white,
    fontWeight: '600',
    marginTop: 2,
  },
  fairway: {
    height: 4,
    width: '100%',
    backgroundColor: GolfColors.gray,
    marginTop: 8,
  },
  fairwayCompleted: {
    backgroundColor: GolfColors.primary,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: GolfColors.gray,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: GolfColors.darkGray,
  },
});
