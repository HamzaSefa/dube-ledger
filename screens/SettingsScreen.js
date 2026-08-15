import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Share,
  Linking,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getCustomers, getTransactions, forceSync } from '../api';
import { getSetting, setSetting } from '../settings';

export default function SettingsScreen({ onBack }) {
  const { user, signOut } = useAuth();
  const [autoSync, setAutoSync] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('');
  const [customerCount, setCustomerCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Real profile data from Supabase Auth (works offline too!)
  const shopName = user?.user_metadata?.shop_name || 'የእኔ ሱቅ';
  const phone = user?.user_metadata?.phone || '---';

  const logoGreen = '#27E365';
  const alertRed = '#FF4D4D';
  const pageBackgroundColor = '#0E2417';

  // Load saved settings when screen opens
  useEffect(() => {
    getSetting('autoSync', true).then(setAutoSync);
    getSetting('lastSync', '').then(setLastSync);
    getCustomers().then(c => setCustomerCount(c.length));
  }, []);

  // Toggle Auto Cloud Sync
  const handleToggleAutoSync = async (value) => {
    setAutoSync(value);
    await setSetting('autoSync', value);
    if (value) {
      handleSyncNow(); // If turned ON, sync immediately
    }
  };

  // Manual Sync Now button
  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const result = await forceSync();
      const now = new Date().toLocaleString('am-ET');
      setLastSync(now);
      await setSetting('lastSync', now);
      // Refresh customer count after sync
      const cust = await getCustomers();
      setCustomerCount(cust.length);
    } catch (err) {
      console.log('Sync error:', err.message);
    } finally {
      setSyncing(false);
    }
  };

  // Export Data as shareable text
  const handleExport = async () => {
    setExporting(true);
    try {
      const customers = await getCustomers();
      const transactions = await getTransactions();
      const now = new Date().toLocaleString('am-ET');

      let report = `📗 ዱቤ ደብተር - የሂሳብ መዝገብ መላኪያ\n`;
      report += `📅 የተላከበት ቀን: ${now}\n`;
      report += `🏪 ሱቅ: ${shopName} | 📞 ${phone}\n`;
      report += `━━━━━━━━━━━━━━━━━━━━\n\n`;

      report += `👥 ደንበኞች (${customers.length}):\n`;
      if (customers.length === 0) {
        report += `   ምንም ደንበኛ አልተገኘም\n`;
      } else {
        customers.forEach((c, i) => {
          report += `${i + 1}. ${c.name} | ${c.phone || 'ስልክ የለም'}\n`;
        });
      }

      report += `\n💰 ግብይቶች (${transactions.length}):\n`;
      if (transactions.length === 0) {
        report += `   ምንም ግብይት አልተገኘም\n`;
      } else {
        transactions.forEach((t, i) => {
          const type = t.type === 'credit' ? '🔴 ዱቤ' : '🟢 ክፍያ';
          report += `${i + 1}. ${type} | ${t.amount} ETB | ${t.item || '-'} | ${new Date(t.created_at).toLocaleString('am-ET')}\n`;
        });
      }

      report += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      report += `✅ ይህን መረጃ በ Excel ወይም በ Google Sheets ሊገባ ይችላል።\n`;
      report += `Dube Ledger - የታመነ ዲጂታል ደብተር`;

      await Share.share({
        message: report,
        title: 'Dube Ledger Export',
      });
    } catch (err) {
      console.log('Export error:', err.message);
    } finally {
      setExporting(false);
    }
  };

  // Share App
  const handleShareApp = async () => {
    try {
      await Share.share({
        message: `📗 ዱቤ ደብተር (Dube Ledger) - ለሱቅዎ የታመነ ዲጂታል ደብተር። ገንዘብ የሚበድሩ ደንበኞችን በቀላሉ ይቆጥቡ። በቅርብ ጊዜ በ Play Store እና App Store ላይ!`,
        title: 'Dube Ledger',
      });
    } catch (err) {
      console.log('Share error:', err.message);
    }
  };

  // Contact via Telegram
  const openTelegram = () => {
    Linking.openURL('https://t.me/dube_debter_bot').catch(() => {});
  };

  // Contact via Email
  const openEmail = () => {
    Linking.openURL('mailto:dubedebter@gmail.com?subject=Dube%20Ledger%20Support').catch(() => {});
  };

  // FAQ Data
  const faqs = [
    {
      id: 1,
      q: 'ዱቤ ደብተር ምንድን ነው?',
      a: 'ዱቤ ደብተር ለኢትዮጵያ ሱቆች የተሰራ ዲጂታል ደብተር ነው። ደንበኞች የሚበድሩትን ገንዘብ በቀላሉ ለመቆጠብ፣ ለመፈለግ እና ለማስታወስ ያገለግላል።',
    },
    {
      id: 2,
      q: 'ያለ ኢንተርኔት መጠቀም እችላለሁ?',
      a: 'አዎ! ዱቤ ደብተር "Offline-First" ነው። ሁሉንም ግብይቶች ያለ ኢንተርኔት መዝግበው፣ ሲኖርባችሁ ደግሞ አውቶማቲክ ወደ ደመና ይላካል።',
    },
    {
      id: 3,
      q: 'መረጃዬ ደህናነው?',
      a: 'አዎ። እያንዳንዱ ሱቅ የራሱን መረጃ ብቻ ያያል (Row-Level Security)። የይለፍ ቃሎች በማይፈለጉ መልኩ ይቆጠባሉ።',
    },
    {
      id: 4,
      q: 'ስልኬን ብቀይር ምን ይሆናል?',
      a: 'ስልክዎን ካቀየሩ በአዲስ ስልክዎ ላይ ይግቡ። መረጃዎ በደመና ላይ ስለሚቆይ ወዲያውኑ ይመጣል።',
    },
    {
      id: 5,
      q: 'የይለፍ ቃሌን ረሳሁ፣ ምን አደርጋለሁ?',
      a: 'እባክዎ ከእኛ ጋር በ Telegram @dube_debter_bot ወይም በ dubedebter@gmail.com ያግኙን። ለመርዳት ዝግጁ ነን።',
    },
    {
      id: 6,
      q: 'ገንዘብ ያልከፈለ ደንበኛን እንዴት አሳስባለሁ?',
      a: 'በደንበኛው ዝርዝር ውስጥ ወደ "አሳሳቢ ላክ" (Send Reminder) በመጫን በ WhatsApp ወይም በ SMS መልእክት መላክ ይችላሉ። (በ Phase 11 ሙሉ ተግባራዊ ይሆናል)',
    },
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleLogoutPress = () => setShowLogoutConfirm(true);

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.log('Logout error:', err.message);
    } finally {
      setLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={pageBackgroundColor} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={logoGreen} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ማስተካከያዎች (Settings)</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ========== REAL PROFILE CARD ========== */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="storefront-outline" size={30} color={logoGreen} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.storeName}>{shopName}</Text>
            <Text style={styles.storeSubtext}>📞 {phone}</Text>
            <Text style={styles.storeSubtext}>👥 {customerCount} ደንበኞች</Text>
          </View>
        </View>

        {/* ========== DATA & BACKUP ========== */}
        <Text style={styles.sectionHeader}>መረጃ እና ምዝገባ (Data & Backup)</Text>
        <View style={styles.card}>
          {/* Auto Cloud Sync */}
          <View style={styles.row}>
            <View style={styles.textGroup}>
              <Text style={styles.rowTitle}>☁️ ራስ-ሰር ወደ ደመና መላክ (Auto Sync)</Text>
              <Text style={styles.rowSubtitle}>
                {autoSync 
                  ? 'በኢንተርኔት ሲገኝ አውቶማቲክ ሲንክ ይሰራል' 
                  : 'አውቶማቲክ ሲንክ ተዘግቷል - በእጅ መላክ ያስፈልጋል'}
              </Text>
              {lastSync ? (
                <Text style={styles.lastSyncText}>✅ መጨረሻ ሲንክ: {lastSync}</Text>
              ) : null}
            </View>
            <Switch
              value={autoSync}
              onValueChange={handleToggleAutoSync}
              trackColor={{ false: '#2A4D38', true: logoGreen }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.divider} />

          {/* Sync Now Button */}
          <TouchableOpacity style={styles.actionRow} onPress={handleSyncNow} disabled={syncing}>
            <View style={styles.textGroup}>
              <Text style={styles.rowTitle}>🔄 አሁን ሲንክ አድርግ (Sync Now)</Text>
              <Text style={styles.rowSubtitle}>የቅርብ ጊዜ መረጃ ከደመና ይጎትቱ</Text>
            </View>
            {syncing ? (
              <ActivityIndicator size="small" color={logoGreen} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={20} color={logoGreen} />
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Export Data Button */}
          <TouchableOpacity style={styles.actionRow} onPress={handleExport} disabled={exporting}>
            <View style={styles.textGroup}>
              <Text style={styles.rowTitle}>📤 መረጃ ላክ (Export Data)</Text>
              <Text style={styles.rowSubtitle}>የሂሳብ መዝገብ ወደ ውጭ መላኪያ</Text>
            </View>
            {exporting ? (
              <ActivityIndicator size="small" color={logoGreen} />
            ) : (
              <Ionicons name="share-outline" size={20} color={logoGreen} />
            )}
          </TouchableOpacity>
        </View>

        {/* ========== HELP & SUPPORT ========== */}
        <Text style={styles.sectionHeader}>እገዛ እና ድጋፍ (Help & Support)</Text>
        <View style={styles.card}>
          {/* FAQ Accordion */}
          <Text style={styles.faqHeader}>❓ ብዙ ጊዜ የሚጠየቁ ጥያቄዎች (FAQ)</Text>
          {faqs.map((faq) => (
            <View key={faq.id} style={styles.faqItem}>
              <TouchableOpacity style={styles.faqQuestion} onPress={() => toggleFaq(faq.id)}>
                <Text style={styles.faqQText}>{faq.q}</Text>
                <Ionicons 
                  name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color="#A8C5B8" 
                />
              </TouchableOpacity>
              {expandedFaq === faq.id && (
                <Text style={styles.faqAnswer}>{faq.a}</Text>
              )}
            </View>
          ))}

          <View style={styles.divider} />

          {/* Contact Telegram */}
          <TouchableOpacity style={styles.contactRow} onPress={openTelegram}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#0088cc" />
            <View style={styles.textGroup}>
              <Text style={styles.rowTitle}>Telegram</Text>
              <Text style={styles.rowSubtitle}>@dube_debter_bot</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#A8C5B8" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Contact Email */}
          <TouchableOpacity style={styles.contactRow} onPress={openEmail}>
            <Ionicons name="mail-outline" size={22} color={alertRed} />
            <View style={styles.textGroup}>
              <Text style={styles.rowTitle}>Email</Text>
              <Text style={styles.rowSubtitle}>dubedebter@gmail.com</Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#A8C5B8" />
          </TouchableOpacity>
        </View>

        {/* ========== SHARE APP ========== */}
        <Text style={styles.sectionHeader}>መተግበሪያውን አጋራ (Share)</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleShareApp}>
            <View style={styles.textGroup}>
              <Text style={styles.rowTitle}>📲 ለጓደኞች አጋራ (Share App)</Text>
              <Text style={styles.rowSubtitle}>ዱቤ ደብተር ለሌሎች ያጋሩ</Text>
            </View>
            <Ionicons name="arrow-redo-outline" size={20} color={logoGreen} />
          </TouchableOpacity>
        </View>

        {/* ========== LEGAL ========== */}
        <Text style={styles.sectionHeader}>ህጋዊ (Legal)</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={() => setShowPrivacy(true)}>
            <View style={styles.textGroup}>
              <Text style={styles.rowTitle}>🔒 የግላዊነት ፖሊሲ (Privacy Policy)</Text>
              <Text style={styles.rowSubtitle}>መረጃዎ እንዴት እንደሚጠበቅ ያንብቡ</Text>
            </View>
            <Ionicons name="document-text-outline" size={20} color={logoGreen} />
          </TouchableOpacity>
        </View>

        {/* ========== ABOUT ========== */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Dube Ledger v1.0.0</Text>
          <Text style={styles.footerSubtext}>Offline-First Credit Manager</Text>
          <Text style={styles.footerSubtext}>© 2026 Dube Technologies</Text>
        </View>

        {/* ========== LOGOUT ========== */}
        {!showLogoutConfirm ? (
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogoutPress}>
            <Ionicons name="log-out-outline" size={20} color={alertRed} />
            <Text style={styles.logoutText}>ከአካውንት ውጣ (Log Out)</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.logoutConfirmBox}>
            <Text style={styles.logoutConfirmText}>እርግጠኛ ነዎት መውጣት ይፈልጋሉ?</Text>
            <View style={styles.logoutConfirmRow}>
              <TouchableOpacity 
                style={[styles.logoutConfirmBtn, styles.logoutCancelBtn]} 
                onPress={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
              >
                <Text style={styles.logoutConfirmBtnText}>አይ (Cancel)</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.logoutConfirmBtn, styles.logoutYesBtn]}
                onPress={handleConfirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.logoutConfirmBtnText, { color: '#FFFFFF' }]}>አዎ (Yes)</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========== PRIVACY POLICY MODAL ========== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPrivacy}
        onRequestClose={() => setShowPrivacy(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🔒 የግላዊነት ፖሊሲ</Text>
              <TouchableOpacity onPress={() => setShowPrivacy(false)}>
                <Ionicons name="close" size={24} color="#A8C5B8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.privacyText}>
                <Text style={styles.privacyBold}>1. የምንሰበስበው መረጃ{'\n'}</Text>
                • ሱቅዎ ስም እና ስልክ ቁጥር (ለመግቢያ){'\n'}
                • የደንበኞች ስም፣ ስልክ እና የዕዳ መጠን{'\n'}
                • የግብይት ዝርዝሮች (ዱቤ እና ክፍያ){'\n\n'}

                <Text style={styles.privacyBold}>2. መረጃውን እንዴት እንጠቀምበታለን{'\n'}</Text>
                • ሂሳብዎን ለማስተዳደር እና ለመቆጠብ{'\n'}
                • ሲንክ ለማድረግ እና በበርካታ መሳሪያዎች ለመጠቀም{'\n\n'}

                <Text style={styles.privacyBold}>3. ደህንነት{'\n'}</Text>
                • የይለፍ ቃሎች በማይፈለጉ መልኩ ይቆጠባሉ (bcrypt){'\n'}
                • እያንዳንዱ ሱቅ የራሱን መረጃ ብቻ ያያል (RLS){'\n'}
                • ሁሉም መረጃ በ HTTPS/TLS ይመላለሳል{'\n\n'}

                <Text style={styles.privacyBold}>4. እኛን ያግኙ{'\n'}</Text>
                Telegram: @dube_debter_bot{'\n'}
                Email: dubedebter@gmail.com{'\n\n'}

                <Text style={styles.privacyBold}>5. መብቶች{'\n'}</Text>
                • መረጃዎን በማንኛውም ጊዜ መሰረዝ ይችላሉ{'\n'}
                • መረጃዎን ለሶስተኛ ወገን አንሸጥም{'\n'}
              </Text>
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalCloseBtn, { backgroundColor: logoGreen }]} 
              onPress={() => setShowPrivacy(false)}
            >
              <Text style={styles.modalCloseText}>ገባኝ (OK)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderWidth: 1,
    borderColor: 'rgba(39, 227, 101, 0.2)',
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
    fontSize: 17,
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
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  textGroup: {
    flex: 1,
    paddingRight: 10,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#A8C5B8',
    marginTop: 2,
  },
  lastSyncText: {
    fontSize: 11,
    color: '#27E365',
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A4D38',
  },
  faqHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    paddingVertical: 12,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A4D38',
    paddingVertical: 10,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQText: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
    paddingRight: 8,
  },
  faqAnswer: {
    fontSize: 13,
    color: '#A8C5B8',
    marginTop: 8,
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.2)',
  },
  logoutText: {
    color: '#FF4D4D',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  logoutConfirmBox: {
    backgroundColor: '#183424',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    alignItems: 'center',
  },
  logoutConfirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  logoutConfirmRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  logoutConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutCancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  logoutYesBtn: {
    backgroundColor: '#FF4D4D',
  },
  logoutConfirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#183424',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  privacyText: {
    color: '#A8C5B8',
    fontSize: 13,
    lineHeight: 22,
  },
  privacyBold: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalCloseBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseText: {
    color: '#0E2417',
    fontWeight: 'bold',
    fontSize: 14,
  },
});