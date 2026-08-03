import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen({ onBack }) {
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoBackup, setAutoBackup] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0E2417" />
      
      {/* Top Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#27E365" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ማስተካከያዎች (Settings)</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile / Store Info Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="storefront-outline" size={30} color="#27E365" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.storeName}>የእኔ ሱቅ (My Shop)</Text>
            <Text style={styles.storeSubtext}>Dube Ledger User</Text>
          </View>
        </View>

        {/* General Preferences Group */}
        <Text style={styles.sectionHeader}>አጠቃላይ (General)</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>የድምፅ መመዝገቢያ (Voice Mode)</Text>
              <Text style={styles.settingSubtitle}>በድምፅ ሂሳብ መመዝገብ እንዲሰራ አድርግ</Text>
            </View>
            <Switch
              value={voiceEnabled}
              onValueChange={setVoiceEnabled}
              trackColor={{ false: '#2A4D38', true: '#27E365' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>ማሳወቂያዎች (Notifications)</Text>
              <Text style={styles.settingSubtitle}>የዕዳ መክፈያ ቀናት ማሳወቂያ</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#2A4D38', true: '#27E365' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Data & Backup Group */}
        <Text style={styles.sectionHeader}>መረጃ እና ምዝገባ (Data & Backup)</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>ራስ-ሰር ምዝገባ (Auto Backup)</Text>
              <Text style={styles.settingSubtitle}>የመረጃ ደህንነት ጥበቃ</Text>
            </View>
            <Switch
              value={autoBackup}
              onValueChange={setAutoBackup}
              trackColor={{ false: '#2A4D38', true: '#27E365' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRowAction}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingTitle}>መረጃ ላክ (Export Data)</Text>
              <Text style={styles.settingSubtitle}>የሂሳብ መዝገብ ኤክስፖርት አድርግ</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A8C5B8" />
          </TouchableOpacity>
        </View>

        {/* App Info Footer */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Dube Ledger v1.0.0</Text>
          <Text style={styles.footerSubtext}>Offline-First Credit Manager</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E2417',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#183424',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#183424',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#0E2417',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  storeSubtext: {
    fontSize: 12,
    color: '#A8C5B8',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A8C5B8',
    marginBottom: 8,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#183424',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingRowAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#A8C5B8',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A4D38',
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 13,
    color: '#5A786A',
    fontWeight: 'bold',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#5A786A',
    marginTop: 2,
  },
});