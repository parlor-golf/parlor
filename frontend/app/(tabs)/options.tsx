import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function Options() {
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [autoScoring, setAutoScoring] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: () => {
          Alert.alert('Logged Out', 'You have been logged out successfully');
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          Alert.alert('Account Deleted', 'Your account has been deleted');
        }},
      ]
    );
  };

  const SettingItem = ({ 
    title, 
    subtitle, 
    value, 
    onValueChange, 
    type = 'switch' 
  }: {
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    type?: 'switch' | 'button';
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
          thumbColor={value ? '#ffffff' : '#f4f3f4'}
        />
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Settings</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content}>
        {/* Golf Settings */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Golf Settings</ThemedText>
          
          <SettingItem
            title="Auto Course Detection"
            subtitle="Automatically detect golf course based on your location"
            value={locationServices}
            onValueChange={setLocationServices}
          />
          
          <SettingItem
            title="Smart Scoring"
            subtitle="Get scoring suggestions based on your play"
            value={autoScoring}
            onValueChange={setAutoScoring}
          />
        </ThemedView>

        {/* Notifications */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
          
          <SettingItem
            title="Push Notifications"
            subtitle="Receive updates about friends' rounds and league challenges"
            value={notifications}
            onValueChange={setNotifications}
          />
        </ThemedView>

        {/* Appearance */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Appearance</ThemedText>
          
          <SettingItem
            title="Dark Mode"
            subtitle="Use dark theme throughout the app"
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </ThemedView>

        {/* Privacy & Data */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Privacy & Data</ThemedText>
          
          <TouchableOpacity style={styles.buttonItem}>
            <Text style={styles.buttonText}>Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.buttonItem}>
            <Text style={styles.buttonText}>Terms of Service</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.buttonItem}>
            <Text style={styles.buttonText}>Export My Data</Text>
          </TouchableOpacity>
        </ThemedView>

        {/* Support */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Support</ThemedText>
          
          <TouchableOpacity style={styles.buttonItem}>
            <Text style={styles.buttonText}>Help Center</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.buttonItem}>
            <Text style={styles.buttonText}>Contact Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.buttonItem}>
            <Text style={styles.buttonText}>Report a Bug</Text>
          </TouchableOpacity>
        </ThemedView>

        {/* Account Actions */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Account</ThemedText>
          
          <TouchableOpacity style={styles.buttonItem} onPress={handleLogout}>
            <Text style={[styles.buttonText, styles.logoutText]}>Logout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.buttonItem} onPress={handleDeleteAccount}>
            <Text style={[styles.buttonText, styles.deleteText]}>Delete Account</Text>
          </TouchableOpacity>
        </ThemedView>

        {/* App Info */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>About</ThemedText>
          <View style={styles.infoItem}>
            <Text style={styles.infoText}>Version 1.0.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoText}>© 2024 Parlor Golf</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  settingText: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  buttonItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  logoutText: {
    color: '#FF9500',
  },
  deleteText: {
    color: '#FF3B30',
  },
  infoItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
});