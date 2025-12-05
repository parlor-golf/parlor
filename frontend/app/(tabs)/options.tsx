import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  Image,
  ActivityIndicator,
  Linking,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { GolfColors, Shadows, Spacing, BorderRadius } from '@/constants/theme';
import { signUp, signIn } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showImagePickerOptions } from '@/services/imagePicker';
import { uploadProfilePhoto } from '@/services/firebase';
import { SpringConfigs, createButtonPressAnimation } from '@/utils/animations';
import { router } from 'expo-router';

export default function Options() {
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [userName, setUserName] = useState<string>('Golfer');

  // Animation values
  const headerAnim = useRef(new Animated.Value(0)).current;
  const profileCardAnim = useRef(new Animated.Value(0)).current;
  const profileCardScale = useRef(new Animated.Value(0.9)).current;
  const sectionAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const profilePhotoScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkAuth();
    loadProfileData();

    // Entrance animations
    Animated.sequence([
      Animated.spring(headerAnim, {
        toValue: 1,
        ...SpringConfigs.gentle,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.spring(profileCardAnim, {
          toValue: 1,
          ...SpringConfigs.gentle,
          useNativeDriver: true,
        }),
        Animated.spring(profileCardScale, {
          toValue: 1,
          ...SpringConfigs.bouncy,
          useNativeDriver: true,
        }),
      ]),
      Animated.stagger(100, sectionAnimations.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          ...SpringConfigs.gentle,
          useNativeDriver: true,
        })
      )),
    ]).start();
  }, []);

  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('idToken');
    setIsAuthenticated(!!token);
  };

  const loadProfileData = async () => {
    const photo = await AsyncStorage.getItem('profilePhoto');
    const name = await AsyncStorage.getItem('userName');
    if (photo) setProfilePhoto(photo);
    if (name) setUserName(name);
  };

  const handleChangeProfilePhoto = async () => {
    const result = await showImagePickerOptions({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result) {
      setIsUploadingPhoto(true);
      try {
        const userId = await AsyncStorage.getItem('userId') || 'anonymous';
        const photoUrl = await uploadProfilePhoto(result.uri, userId);
        await AsyncStorage.setItem('profilePhoto', photoUrl);
        setProfilePhoto(photoUrl);
        Alert.alert('Success', 'Profile photo updated!');
      } catch (error) {
        Alert.alert('Error', 'Failed to upload photo. Please try again.');
        console.error('Error uploading profile photo:', error);
      }
      setIsUploadingPhoto(false);
    }
  };

  const createTestAccount = async () => {
    const testEmail = `testuser${Date.now()}@parlor.com`;
    const testPassword = 'testpassword123';
    const testName = 'Test Golfer';

    Alert.alert('Creating Test Account', 'Please wait...');

    const signUpResult = await signUp(testEmail, testPassword, testName);

    if (signUpResult.error) {
      const signInResult = await signIn(testEmail, testPassword);
      if (signInResult.error) {
        const newEmail = `testuser${Date.now()}@parlor.com`;
        const finalResult = await signUp(newEmail, testPassword, testName);
        if (finalResult.error) {
          Alert.alert('Error', finalResult.error);
          return;
        }
      }
    }

    await AsyncStorage.setItem('userName', testName);
    setUserName(testName);
    await checkAuth();
    Alert.alert('Success!', 'Test account created and signed in!');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['idToken', 'userId', 'userName', 'profilePhoto']);
            router.replace('/auth/sign-in');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove(['idToken', 'userId', 'userName', 'profilePhoto']);
            router.replace('/auth/sign-in');
          },
        },
      ]
    );
  };

  const handleHelpCenter = () => {
    Alert.alert(
      'Help Center',
      'How can we help you?',
      [
        { text: 'FAQs', onPress: () => Alert.alert('FAQs', 'Frequently asked questions coming soon.') },
        { text: 'Getting Started', onPress: () => Alert.alert('Getting Started', 'Tutorial coming soon.') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how to reach us:',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@parlorgolf.com?subject=Parlor Support Request'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleReportBug = () => {
    Alert.alert(
      'Report a Bug',
      'Please describe the issue you encountered.',
      [
        {
          text: 'Send Report',
          onPress: () => {
            Linking.openURL('mailto:bugs@parlorgolf.com?subject=Bug Report - Parlor App');
            Alert.alert('Thank you!', 'We appreciate your feedback.');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const SettingItem = ({
    icon,
    title,
    subtitle,
    value,
    onValueChange,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={GolfColors.primary} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: GolfColors.lightGray, true: GolfColors.primaryLight }}
        thumbColor={value ? GolfColors.white : '#f4f3f4'}
        ios_backgroundColor={GolfColors.lightGray}
      />
    </View>
  );

  const ButtonItem = ({
    icon,
    title,
    onPress,
    color = GolfColors.primary,
    showArrow = true,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    onPress: () => void;
    color?: string;
    showArrow?: boolean;
  }) => (
    <TouchableOpacity style={styles.buttonItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.buttonText, { color }]}>{title}</Text>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={GolfColors.gray} />
      )}
    </TouchableOpacity>
  );

  const handleProfilePhotoPress = () => {
    createButtonPressAnimation(profilePhotoScale, handleChangeProfilePhoto);
  };

  const handleProfilePress = () => {
    router.push('/social/profile');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[GolfColors.primary, GolfColors.primaryDark]}
        style={styles.header}
      >
        <Animated.Text
          style={[
            styles.headerTitle,
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
          Settings
        </Animated.Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Animated.View
          style={[
            styles.profileCard,
            {
              opacity: profileCardAnim,
              transform: [{ scale: profileCardScale }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ scale: profilePhotoScale }] }}>
            <TouchableOpacity
              style={styles.profilePhotoContainer}
              onPress={handleProfilePhotoPress}
              disabled={isUploadingPhoto}
            >
            {isUploadingPhoto ? (
              <ActivityIndicator size="large" color={GolfColors.primary} />
            ) : profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
            ) : (
              <LinearGradient
                colors={[GolfColors.primary, GolfColors.primaryLight]}
                style={styles.profilePhotoPlaceholder}
              >
                <Text style={styles.profileInitial}>
                  {userName.charAt(0).toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color={GolfColors.white} />
            </View>
            </TouchableOpacity>
          </Animated.View>
          <TouchableOpacity style={styles.profileInfo} onPress={handleProfilePress}>
            <Text style={styles.profileName}>{userName}</Text>
            <Text style={styles.profileStatus}>
              {isAuthenticated ? 'Signed In' : 'Not Signed In'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Golf Settings */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: sectionAnimations[0],
              transform: [
                {
                  translateY: sectionAnimations[0].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Golf Settings</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="location"
              title="Auto Course Detection"
              subtitle="Detect course based on location"
              value={locationServices}
              onValueChange={setLocationServices}
            />
          </View>
        </Animated.View>

        {/* Notifications */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: sectionAnimations[1],
              transform: [
                {
                  translateY: sectionAnimations[1].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="notifications"
              title="Push Notifications"
              subtitle="Friends' rounds and challenges"
              value={notifications}
              onValueChange={setNotifications}
            />
          </View>
        </Animated.View>

        {/* Appearance */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: sectionAnimations[2],
              transform: [
                {
                  translateY: sectionAnimations[2].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon="moon"
              title="Dark Mode"
              subtitle="Use dark theme"
              value={darkMode}
              onValueChange={setDarkMode}
            />
          </View>
        </Animated.View>

        {/* Support */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: sectionAnimations[3],
              transform: [
                {
                  translateY: sectionAnimations[3].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionCard}>
            <ButtonItem
              icon="help-circle"
              title="Help Center"
              onPress={handleHelpCenter}
            />
            <View style={styles.divider} />
            <ButtonItem
              icon="chatbubble"
              title="Contact Support"
              onPress={handleContactSupport}
            />
            <View style={styles.divider} />
            <ButtonItem
              icon="bug"
              title="Report a Bug"
              onPress={handleReportBug}
            />
          </View>
        </Animated.View>

        {/* Account */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: sectionAnimations[4],
              transform: [
                {
                  translateY: sectionAnimations[4].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            {!isAuthenticated && (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={createTestAccount}
                >
                  <LinearGradient
                    colors={[GolfColors.primary, GolfColors.primaryLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryButtonGradient}
                  >
                    <Ionicons name="person-add" size={20} color={GolfColors.white} />
                    <Text style={styles.primaryButtonText}>Create Test Account</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <View style={styles.divider} />
              </>
            )}
            <ButtonItem
              icon="log-out"
              title="Logout"
              onPress={handleLogout}
              color={GolfColors.warning}
              showArrow={false}
            />
            <View style={styles.divider} />
            <ButtonItem
              icon="trash"
              title="Delete Account"
              onPress={handleDeleteAccount}
              color={GolfColors.error}
              showArrow={false}
            />
          </View>
        </Animated.View>

        {/* About */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: sectionAnimations[5],
              transform: [
                {
                  translateY: sectionAnimations[5].interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <LinearGradient
              colors={[GolfColors.cardBg, GolfColors.cardBgAlt]}
              style={styles.aboutGradient}
            >
              <Ionicons name="golf" size={32} color={GolfColors.primary} />
              <Text style={styles.appName}>Parlor</Text>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
              <Text style={styles.appCopyright}>© 2024 Parlor Golf</Text>
            </LinearGradient>
          </View>
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
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: GolfColors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  profilePhotoContainer: {
    position: 'relative',
  },
  profilePhoto: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profilePhotoPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 28,
    fontWeight: '700',
    color: GolfColors.white,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: GolfColors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GolfColors.white,
  },
  profileInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: GolfColors.black,
  },
  profileStatus: {
    fontSize: 14,
    color: GolfColors.gray,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: GolfColors.gray,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: GolfColors.white,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GolfColors.cardBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  settingText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: GolfColors.black,
  },
  settingSubtitle: {
    fontSize: 12,
    color: GolfColors.gray,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: GolfColors.lightGray,
    marginLeft: 60,
  },
  buttonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  buttonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  primaryButton: {
    margin: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  primaryButtonText: {
    color: GolfColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  aboutCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  aboutGradient: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: GolfColors.primaryDark,
    marginTop: Spacing.sm,
  },
  appVersion: {
    fontSize: 14,
    color: GolfColors.gray,
    marginTop: Spacing.xs,
  },
  appCopyright: {
    fontSize: 12,
    color: GolfColors.gray,
    marginTop: Spacing.sm,
  },
  bottomSpacer: {
    height: 100,
  },
});
