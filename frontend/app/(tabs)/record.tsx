import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  Image,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createSession, GolfSession as ApiGolfSession } from '@/services/api';
import { GolfColors, Shadows, Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GolfCourseMap from '@/components/GolfCourseMap';
import { showImagePickerOptions, ImagePickerResult } from '@/services/imagePicker';
import { uploadSessionPhoto } from '@/services/firebase';
import { SpringConfigs, createButtonPressAnimation } from '@/utils/animations';

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
  const [sessionPhotos, setSessionPhotos] = useState<ImagePickerResult[]>([]);

  // Animation values
  const timerPulse = useRef(new Animated.Value(1)).current;
  const mapFadeIn = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const setupHeaderAnim = useRef(new Animated.Value(0)).current;
  const setupCardAnim = useRef(new Animated.Value(0)).current;
  const setupCardScale = useRef(new Animated.Value(0.9)).current;
  const scoreSectionAnim = useRef(new Animated.Value(0)).current;
  const photoSectionAnim = useRef(new Animated.Value(0)).current;
  const privacySectionAnim = useRef(new Animated.Value(0)).current;
  const scoreInputAnimations = useRef<Animated.Value[]>([]).current;

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

  // Fade in map and sections when session starts
  useEffect(() => {
    if (activeSession) {
      // Animate sections in sequence
      Animated.stagger(150, [
        Animated.timing(mapFadeIn, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scoreSectionAnim, {
          toValue: 1,
          ...SpringConfigs.gentle,
          useNativeDriver: true,
        }),
        Animated.spring(photoSectionAnim, {
          toValue: 1,
          ...SpringConfigs.gentle,
          useNativeDriver: true,
        }),
        Animated.spring(privacySectionAnim, {
          toValue: 1,
          ...SpringConfigs.gentle,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      mapFadeIn.setValue(0);
      scoreSectionAnim.setValue(0);
      photoSectionAnim.setValue(0);
      privacySectionAnim.setValue(0);

      // Setup screen entrance animation
      Animated.sequence([
        Animated.spring(setupHeaderAnim, {
          toValue: 1,
          ...SpringConfigs.bouncy,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(setupCardAnim, {
            toValue: 1,
            ...SpringConfigs.gentle,
            useNativeDriver: true,
          }),
          Animated.spring(setupCardScale, {
            toValue: 1,
            ...SpringConfigs.bouncy,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [activeSession]);

  // Set up test authentication token for development
  useEffect(() => {
    const setupTestAuth = async () => {
      const existingToken = await AsyncStorage.getItem('idToken');
      if (!existingToken) {
        Alert.alert(
          'Authentication Required',
          'Please sign in to save your golf sessions.',
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

  const addPhoto = async () => {
    const result = await showImagePickerOptions({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result) {
      setSessionPhotos(prev => [...prev, result]);
    }
  };

  const removePhoto = (index: number) => {
    setSessionPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const startSession = () => {
    if (!selectedCourse) {
      Alert.alert('Course Required', 'Please enter a golf course name');
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
    setSessionPhotos([]);
  };

  const endSession = async () => {
    if (activeSession) {
      setIsSaving(true);

      const holeScores = Object.fromEntries(
        Object.entries(scores).map(([hole, score]) => [parseInt(hole), parseInt(score) || 0])
      );

      const totalScore = Object.values(holeScores).reduce((sum, score) => sum + score, 0);

      // Upload photos to Firebase Storage
      let uploadedPhotoUrls: string[] = [];
      try {
        const userId = await AsyncStorage.getItem('userId') || 'anonymous';
        for (let i = 0; i < sessionPhotos.length; i++) {
          const url = await uploadSessionPhoto(
            sessionPhotos[i].uri,
            userId,
            activeSession.id,
            i
          );
          uploadedPhotoUrls.push(url);
        }
      } catch (error) {
        console.error('Error uploading photos:', error);
      }

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
        images: uploadedPhotoUrls,
      };

      const result = await createSession(sessionData);
      setIsSaving(false);

      if (result.error) {
        Alert.alert('Error Saving Session', result.error, [
          {
            text: 'OK',
            onPress: () => {
              setActiveSession(null);
              setTimer(0);
              setScores({});
              setPrivacy('friends');
              setSessionPhotos([]);
            },
          },
        ]);
      } else {
        Alert.alert('Round Complete!', 'Your golf session has been saved successfully.', [
          {
            text: 'Great!',
            onPress: () => {
              setActiveSession(null);
              setTimer(0);
              setScores({});
              setPrivacy('friends');
              setSessionPhotos([]);
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

  // Setup screen
  if (!activeSession) {
    return (
      <View style={styles.container}>
        <ImageBackground
          source={require('@/assets/images/golf/golf-green.jpg')}
          style={styles.setupBackground}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(27,62,31,0.9)', 'rgba(45,125,62,0.95)']}
            style={styles.setupOverlay}
          >
            <ScrollView
              contentContainerStyle={styles.setupScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Animated.View
                style={[
                  styles.setupHeader,
                  {
                    opacity: setupHeaderAnim,
                    transform: [
                      {
                        scale: setupHeaderAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons name="golf" size={48} color={GolfColors.white} />
                <Text style={styles.setupTitle}>New Round</Text>
                <Text style={styles.setupSubtitle}>Set up your golf session</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.setupCard,
                  {
                    opacity: setupCardAnim,
                    transform: [{ scale: setupCardScale }],
                  },
                ]}
              >
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Golf Course</Text>
                  <View style={styles.inputContainer}>
                    <Ionicons name="location" size={20} color={GolfColors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter course name"
                      placeholderTextColor={GolfColors.gray}
                      value={selectedCourse}
                      onChangeText={setSelectedCourse}
                    />
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Round Type</Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.optionButton, selectedHoles === 18 && styles.selectedOption]}
                      onPress={() => setSelectedHoles(18)}
                    >
                      <Ionicons
                        name="flag"
                        size={20}
                        color={selectedHoles === 18 ? GolfColors.white : GolfColors.primary}
                      />
                      <Text style={[styles.optionText, selectedHoles === 18 && styles.selectedOptionText]}>
                        18 Holes
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.optionButton, selectedHoles === 9 && styles.selectedOption]}
                      onPress={() => setSelectedHoles(9)}
                    >
                      <Ionicons
                        name="flag-outline"
                        size={20}
                        color={selectedHoles === 9 ? GolfColors.white : GolfColors.primary}
                      />
                      <Text style={[styles.optionText, selectedHoles === 9 && styles.selectedOptionText]}>
                        9 Holes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => animateButtonPress(startSession)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[GolfColors.primary, GolfColors.primaryLight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.startButtonGradient}
                    >
                      <Ionicons name="play" size={24} color={GolfColors.white} />
                      <Text style={styles.startButtonText}>Start Round</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            </ScrollView>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  }

  // Active session screen
  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[GolfColors.primary, GolfColors.primaryDark]}
        style={styles.activeHeader}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Ionicons name="golf" size={24} color={GolfColors.white} />
            <View style={styles.headerInfo}>
              <Text style={styles.courseName}>{activeSession.courseName}</Text>
              <Text style={styles.holesText}>{activeSession.holes} holes</Text>
            </View>
          </View>
          <Animated.View style={[styles.timerContainer, { transform: [{ scale: timerPulse }] }]}>
            <Ionicons name="time" size={16} color={GolfColors.white} />
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </Animated.View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Golf Course Map */}
        <Animated.View style={[styles.mapContainer, { opacity: mapFadeIn }]}>
          <GolfCourseMap
            holes={activeSession.holes}
            currentHole={currentHole}
            scores={getScoresByHole()}
          />
        </Animated.View>

        {/* Score Entry */}
        <Animated.View
          style={[
            styles.scoreSection,
            {
              opacity: scoreSectionAnim,
              transform: [
                {
                  translateY: scoreSectionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="create" size={20} color={GolfColors.primary} />
            <Text style={styles.sectionTitle}>Enter Scores</Text>
          </View>

          <View style={styles.scoreGrid}>
            {getHolesToDisplay().map((hole) => (
              <View key={hole} style={styles.scoreItem}>
                <Text style={styles.holeNumber}>H{hole}</Text>
                <TextInput
                  style={[
                    styles.scoreInput,
                    scores[hole] && styles.scoreInputFilled,
                    currentHole === hole && styles.scoreInputActive,
                  ]}
                  placeholder="-"
                  placeholderTextColor={GolfColors.gray}
                  value={scores[hole] || ''}
                  onChangeText={(text) => updateScore(hole, text)}
                  keyboardType="numeric"
                  maxLength={2}
                  onFocus={() => setCurrentHole(hole)}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Photo Section */}
        <Animated.View
          style={[
            styles.photoSection,
            {
              opacity: photoSectionAnim,
              transform: [
                {
                  translateY: photoSectionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="camera" size={20} color={GolfColors.primary} />
            <Text style={styles.sectionTitle}>Photos</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            <TouchableOpacity style={styles.addPhotoButton} onPress={addPhoto}>
              <Ionicons name="add" size={32} color={GolfColors.primary} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>

            {sessionPhotos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Ionicons name="close-circle" size={24} color={GolfColors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Privacy Section */}
        <Animated.View
          style={[
            styles.privacySection,
            {
              opacity: privacySectionAnim,
              transform: [
                {
                  translateY: privacySectionAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Ionicons name="lock-closed" size={20} color={GolfColors.primary} />
            <Text style={styles.sectionTitle}>Privacy</Text>
          </View>

          <View style={styles.privacyRow}>
            {(['public', 'friends', 'private'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.privacyButton, privacy === option && styles.selectedPrivacy]}
                onPress={() => setPrivacy(option)}
              >
                <Ionicons
                  name={option === 'public' ? 'globe' : option === 'friends' ? 'people' : 'lock-closed'}
                  size={16}
                  color={privacy === option ? GolfColors.white : GolfColors.primary}
                />
                <Text style={[styles.privacyText, privacy === option && styles.selectedPrivacyText]}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* Finish Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            style={[styles.finishButton, isSaving && styles.disabledButton]}
            onPress={() => !isSaving && animateButtonPress(endSession)}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[GolfColors.primaryDark, GolfColors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.finishButtonGradient}
            >
              {isSaving ? (
                <ActivityIndicator color={GolfColors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color={GolfColors.white} />
                  <Text style={styles.finishButtonText}>Finish Round</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

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
  // Setup screen styles
  setupBackground: {
    flex: 1,
  },
  setupOverlay: {
    flex: 1,
  },
  setupScrollContent: {
    flexGrow: 1,
    padding: Spacing.md,
    paddingTop: 80,
  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  setupTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: GolfColors.white,
    marginTop: Spacing.sm,
  },
  setupSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
  },
  setupCard: {
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.large,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: GolfColors.darkGray,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GolfColors.cardBgAlt,
    borderRadius: BorderRadius.md,
    backgroundColor: GolfColors.cardBg,
  },
  inputIcon: {
    padding: Spacing.sm,
  },
  textInput: {
    flex: 1,
    padding: Spacing.sm,
    fontSize: 16,
    color: GolfColors.black,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: GolfColors.primary,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  selectedOption: {
    backgroundColor: GolfColors.primary,
    borderColor: GolfColors.primary,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: GolfColors.primary,
  },
  selectedOptionText: {
    color: GolfColors.white,
  },
  startButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  startButtonText: {
    color: GolfColors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  // Active session styles
  activeHeader: {
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerInfo: {
    marginLeft: Spacing.xs,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: GolfColors.white,
  },
  holesText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  timerText: {
    color: GolfColors.white,
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  mapContainer: {
    marginBottom: Spacing.md,
  },
  scoreSection: {
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GolfColors.primaryDark,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  scoreItem: {
    alignItems: 'center',
    width: '18%',
    marginBottom: Spacing.sm,
  },
  holeNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: GolfColors.gray,
    marginBottom: 4,
  },
  scoreInput: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: GolfColors.cardBgAlt,
    borderRadius: BorderRadius.sm,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: GolfColors.black,
    backgroundColor: GolfColors.cardBg,
  },
  scoreInputFilled: {
    borderColor: GolfColors.primary,
    backgroundColor: GolfColors.cardBg,
  },
  scoreInputActive: {
    borderColor: GolfColors.primaryLight,
    backgroundColor: GolfColors.white,
    ...Shadows.glow,
  },
  photoSection: {
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  photoScroll: {
    marginHorizontal: -Spacing.sm,
  },
  addPhotoButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: GolfColors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  addPhotoText: {
    fontSize: 10,
    color: GolfColors.primary,
    marginTop: 4,
  },
  photoItem: {
    marginLeft: Spacing.sm,
    position: 'relative',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: GolfColors.white,
    borderRadius: 12,
  },
  privacySection: {
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  privacyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  privacyButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderWidth: 2,
    borderColor: GolfColors.primary,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  selectedPrivacy: {
    backgroundColor: GolfColors.primary,
    borderColor: GolfColors.primary,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: '600',
    color: GolfColors.primary,
  },
  selectedPrivacyText: {
    color: GolfColors.white,
  },
  finishButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  finishButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  finishButtonText: {
    color: GolfColors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  disabledButton: {
    opacity: 0.6,
  },
  bottomSpacer: {
    height: 100,
  },
});
