import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { signIn, signUp } from '@/services/api';
import { GolfColors, Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { SpringConfigs, createButtonPressAnimation } from '@/utils/animations';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

export default function SignInScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Animation values
  const logoScale = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(50)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const switchScale = useRef(new Animated.Value(1)).current;
  const logoBreathe = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Check if already authenticated
    checkExistingAuth();

    // Entrance animations
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        ...SpringConfigs.bouncy,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(formOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(formTranslateY, {
          toValue: 0,
          ...SpringConfigs.gentle,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Breathing animation for logo
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(logoBreathe, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(logoBreathe, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();

    return () => breathe.stop();
  }, []);

  const checkExistingAuth = async () => {
    const token = await AsyncStorage.getItem('idToken');
    if (token) {
      router.replace('/(tabs)');
    }
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    if (!email || !password) {
      const message = 'Please enter email and password';
      setErrorMessage(message);
      Alert.alert('Error', message);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      const message = 'Please enter a valid email address.';
      setErrorMessage(message);
      Alert.alert('Error', message);
      return;
    }

    if (isSignUp && password.length < 6) {
      const message = 'Password should be at least 6 characters.';
      setErrorMessage(message);
      Alert.alert('Error', message);
      return;
    }

    if (isSignUp && !name) {
      const message = 'Please enter your name';
      setErrorMessage(message);
      Alert.alert('Error', message);
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const result = await signUp(email, password, name);
        if (result.error) {
          setErrorMessage(result.error);
          Alert.alert('Sign Up Failed', result.error);
        } else {
          // Auto sign in after signup
          const signInResult = await signIn(email, password);
          if (signInResult.error) {
            const message = 'Account created but sign in failed. Please sign in manually.';
            setErrorMessage(message);
            Alert.alert('Error', message);
          } else {
            setErrorMessage(null);
            // Auth state will auto-redirect via _layout.tsx
            setTimeout(() => router.replace('/(tabs)'), 100);
          }
        }
      } else {
        const result = await signIn(email, password);
        if (result.error) {
          setErrorMessage(result.error);
          Alert.alert('Sign In Failed', result.error);
        } else {
          setErrorMessage(null);
          // Auth state will auto-redirect via _layout.tsx
          setTimeout(() => router.replace('/(tabs)'), 100);
        }
      }
    } catch (error) {
      const message = 'An unexpected error occurred';
      setErrorMessage(message);
      Alert.alert('Error', message);
    }

    setIsLoading(false);
  };

  const handleButtonPress = () => {
    createButtonPressAnimation(buttonScale, handleSubmit);
  };

  const handleSwitchMode = () => {
    createButtonPressAnimation(switchScale, () => {
      setIsSignUp(!isSignUp);
      setErrorMessage(null);
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('@/assets/images/golf/golf-course-hero.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(27,62,31,0.85)', 'rgba(45,125,62,0.95)']}
          style={styles.overlay}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Logo Section */}
              <View style={styles.logoSection}>
                <Animated.View
                  style={[
                    styles.logoContainer,
                    {
                      transform: [
                        { scale: Animated.multiply(logoScale, logoBreathe) },
                      ],
                    },
                  ]}
                >
                  <Ionicons name="golf" size={64} color={GolfColors.white} />
                </Animated.View>
                <Animated.Text
                  style={[
                    styles.appName,
                    {
                      opacity: logoScale,
                      transform: [{ scale: logoScale }],
                    },
                  ]}
                >
                  Parlor
                </Animated.Text>
                <Animated.Text
                  style={[
                    styles.tagline,
                    { opacity: logoScale },
                  ]}
                >
                  Your Golf Companion
                </Animated.Text>
              </View>

              {/* Form Section */}
              <Animated.View
                style={[
                  styles.formContainer,
                  {
                    opacity: formOpacity,
                    transform: [{ translateY: formTranslateY }],
                  },
                ]}
              >
                <Text style={styles.formTitle}>
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </Text>
                <Text style={styles.formSubtitle}>
                  {isSignUp
                    ? 'Join the Parlor community'
                    : 'Sign in to continue'}
                </Text>

                {errorMessage && (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={20} color={GolfColors.white} />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {/* Name Input (Sign Up only) */}
                {isSignUp && (
                  <View style={styles.inputContainer}>
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={GolfColors.primary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor={GolfColors.gray}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={GolfColors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={GolfColors.gray}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={GolfColors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={GolfColors.gray}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={GolfColors.gray}
                    />
                  </TouchableOpacity>
                </View>

                {/* Submit Button */}
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleButtonPress}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[GolfColors.primary, GolfColors.primaryLight]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.submitButtonGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator color={GolfColors.white} />
                      ) : (
                        <>
                          <Ionicons
                            name={isSignUp ? 'person-add' : 'log-in'}
                            size={24}
                            color={GolfColors.white}
                          />
                          <Text style={styles.submitButtonText}>
                            {isSignUp ? 'Create Account' : 'Sign In'}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>

                {/* Switch Mode */}
                <Animated.View
                  style={[
                    styles.switchContainer,
                    { transform: [{ scale: switchScale }] },
                  ]}
                >
                  <Text style={styles.switchText}>
                    {isSignUp
                      ? 'Already have an account?'
                      : "Don't have an account?"}
                  </Text>
                  <TouchableOpacity onPress={handleSwitchMode}>
                    <Text style={styles.switchButton}>
                      {isSignUp ? 'Sign In' : 'Sign Up'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Forgot Password (Sign In only) */}
                {!isSignUp && (
                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() =>
                      Alert.alert(
                        'Reset Password',
                        'Password reset feature coming soon!'
                      )
                    }
                  >
                    <Text style={styles.forgotPasswordText}>
                      Forgot Password?
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>

              {/* Terms */}
              <Text style={styles.termsText}>
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: 48,
    fontWeight: '700',
    color: GolfColors.white,
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
  },
  formContainer: {
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.large,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: GolfColors.primaryDark,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 14,
    color: GolfColors.gray,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GolfColors.cardBgAlt,
    borderRadius: BorderRadius.md,
    backgroundColor: GolfColors.cardBg,
    marginBottom: Spacing.md,
  },
  inputIcon: {
    padding: Spacing.sm,
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    padding: Spacing.sm,
    fontSize: 16,
    color: GolfColors.black,
  },
  eyeButton: {
    padding: Spacing.sm,
    paddingRight: Spacing.md,
  },
  submitButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
    ...Shadows.medium,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  submitButtonText: {
    color: GolfColors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  switchText: {
    color: GolfColors.gray,
    fontSize: 14,
  },
  switchButton: {
    color: GolfColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#c0392b',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: GolfColors.white,
    flex: 1,
    fontSize: 14,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  forgotPasswordText: {
    color: GolfColors.primary,
    fontSize: 14,
  },
  termsText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
});
