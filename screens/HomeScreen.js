import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {
  getCustomers,
  createCustomer,
  addTransaction,
  getTransactions,
} from '../api';

export default function HomeScreen({ onOpenSettings }) {
  const [voiceMode, setVoiceMode] = useState('credit');
  const [isListening, setIsListening] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // REAL DATA STATES
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Customer for Quick Record / Ledger Detail Modal
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickItem, setQuickItem] = useState('');
  const [quickType, setQuickType] = useState('credit');

  // Parsed Voice State
  const [parsedVoiceData, setParsedVoiceData] = useState({
    customer: '',
    customerId: null,
    amount: '',
    item: '',
    type: 'credit',
  });

  // Manual / Edit Entry Modal State
  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');

  // Add Customer Modal State
  const [isAddCustomerModalVisible, setIsAddCustomerModalVisible] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const logoGreen = '#27E365';
  const alertRed = '#FF4D4D';
  const pageBackgroundColor = '#0E2417';

  // ============================================
  // NETWORK DETECTOR (Online / Offline)
  // ============================================
  useEffect(() => {
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
    });
    return () => unsubscribe();
  }, []);

  // ============================================
  // LOAD REAL DATA
  // ============================================
  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [custData, txData] = await Promise.all([
        getCustomers(),
        getTransactions(),
      ]);
      setCustomers(custData);
      setTransactions(txData);
    } catch (err) {
      setError('መረጃ መጫን አልተሳካም። እባክዎ እንደገና ይሞክሩ።');
      console.log('Fetch error:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // ============================================
  // BALANCE CALCULATOR
  // ============================================
  const calculateBalance = useCallback((customerId) => {
    return transactions
      .filter((t) => t.customer_id === customerId)
      .reduce((sum, t) => {
        if (t.type === 'credit') return sum + Number(t.amount);
        if (t.type === 'payment') return sum - Number(t.amount);
        return sum;
      }, 0);
  }, [transactions]);

  const formatBalance = (amount) => {
    return amount.toLocaleString() + ' ETB';
  };

  // ============================================
  // PHONE VALIDATOR
  // ============================================
  const validatePhone = (phone) => {
    const clean = phone.replace(/\s/g, '');
    return /^(09|07)\d{8}$/.test(clean);
  };

  // ============================================
  // FILTERED & SORTED LIST FOR DISPLAY
  // ============================================
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  const displayList = filteredCustomers
    .map((c) => {
      const balance = calculateBalance(c.id);
      const customerTx = transactions
        .filter((t) => t.customer_id === c.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const lastTx = customerTx[0];

      return {
        ...c,
        balance,
        balanceText: formatBalance(balance),
        isCleared: balance === 0,
        sortDate: lastTx ? new Date(lastTx.created_at) : new Date(c.created_at),
      };
    })
    .sort((a, b) => b.sortDate - a.sortDate);

  // ============================================
  // CUSTOMER PICKER FILTER
  // ============================================
  const pickerFilteredCustomers = customers.filter((c) => {
    const q = pickerSearchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q))
    );
  });

  // ============================================
  // VOICE MOCK (Phase 10 will make this real)
  // ============================================
  const handleMicPress = () => {
    if (customers.length === 0) {
      setError('እባክዎ መጀመሪያ ደንበኛ ያስገቡ');
      return;
    }
    setError('');
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      const target = customers[0];
      setParsedVoiceData({
        customer: target.name,
        customerId: target.id,
        amount: voiceMode === 'credit' ? '200' : '500',
        item: voiceMode === 'credit' ? 'ስኳር' : 'የቡና',
        type: voiceMode,
      });
      setShowConfirmation(true);
    }, 6000);
  };

  const handleEditVoiceData = () => {
    const cust = customers.find((c) => c.id === parsedVoiceData.customerId);
    setSelectedCustomer(cust || null);
    setShowCustomerPicker(false);
    setPickerSearchQuery('');
    setManualAmount(parsedVoiceData.amount);
    setManualNote(parsedVoiceData.item);
    setVoiceMode(parsedVoiceData.type);
    setShowConfirmation(false);
    setIsManualModalVisible(true);
  };

  // ============================================
  // SAVE TRANSACTION (Real Database)
  // ============================================
  const handleSaveEntry = async () => {
    const cust = selectedCustomer;
    if (!cust) {
      setError('እባክዎ ደንበኛ ይምረጡ');
      return;
    }
    if (!manualAmount || isNaN(manualAmount) || Number(manualAmount) <= 0) {
      setError('የሚሰራ መጠን ያስገቡ');
      return;
    }

    setSaving(true);
    try {
      await addTransaction(
        cust.id,
        voiceMode,
        manualAmount,
        manualNote || (voiceMode === 'credit' ? 'ዱቤ' : 'ክፍያ')
      );
      await fetchData();
      setIsManualModalVisible(false);
      setShowConfirmation(false);
      setManualAmount('');
      setManualNote('');
      setSelectedCustomer(null);
      setShowCustomerPicker(false);
      setPickerSearchQuery('');
      setError('');
    } catch (err) {
      setError(err.message || 'መዝገብ አልተሳካም');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCustomerSave = async () => {
    if (!quickAmount || isNaN(quickAmount) || Number(quickAmount) <= 0) {
      setError('የሚሰራ መጠን ያስገቡ');
      return;
    }
    if (!selectedCustomerDetail) return;

    setSaving(true);
    try {
      await addTransaction(
        selectedCustomerDetail.id,
        quickType,
        quickAmount,
        quickItem || (quickType === 'credit' ? 'ዱቤ' : 'ክፍያ')
      );
      await fetchData();
      setSelectedCustomerDetail(null);
      setQuickAmount('');
      setQuickItem('');
      setError('');
    } catch (err) {
      setError(err.message || 'መዝገብ አልተሳካም');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // ADD CUSTOMER (Real Database + Phone Validation)
  // ============================================
  const handleAddNewCustomer = async () => {
    if (!newCustomerName.trim()) {
      setError('ስም ያስፈልጋል');
      return;
    }
    if (newCustomerPhone && !validatePhone(newCustomerPhone)) {
      setError('ስልክ ቁጥር 10 አሃዝ መሆን አለበት (09... ወይም 07...)');
      return;
    }

    setSaving(true);
    try {
      await createCustomer(newCustomerName.trim(), newCustomerPhone.trim());
      await fetchData();
      setNewCustomerName('');
      setNewCustomerPhone('');
      setIsAddCustomerModalVisible(false);
      setError('');
    } catch (err) {
      setError(err.message || 'ደንበኛ መመዝገብ አልተሳካም');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={pageBackgroundColor} />

      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.brandGroup}>
          <View style={styles.logoCircle}>
            <Image
              source={require('../assets/dube_logo_circle.jpg')}
              style={styles.logoImage}
              resizeMode="cover"
            />
          </View>
          <View>
            <Text style={styles.headerTitle}>ዱቤ ደብተር</Text>
            <View style={styles.syncBadge}>
              <View style={[styles.syncDot, { backgroundColor: isOnline ? logoGreen : '#FF9F43' }]} />
              <Text style={styles.syncText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Error Banner */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => setError('')}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 ደንበኛ ወይም ስልክ ይፈልጉ..."
          placeholderTextColor="#5A786A"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Voice Banner */}
      <View style={styles.voiceGuideBanner}>
        {!showConfirmation ? (
          <>
            <Text style={styles.voiceGuideTitle}>በድምፅ ለመመዝገብ የሚፈለገውን ይምረጡ</Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, voiceMode === 'credit' ? { backgroundColor: alertRed } : null]}
                onPress={() => setVoiceMode('credit')}
              >
                <Text style={[styles.toggleText, voiceMode === 'credit' ? styles.activeToggleText : null]}>
                  🔴 ዱቤ መስጠት
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, voiceMode === 'payment' ? { backgroundColor: logoGreen } : null]}
                onPress={() => setVoiceMode('payment')}
              >
                <Text style={[styles.toggleText, voiceMode === 'payment' ? { color: '#0E2417', fontWeight: 'bold' } : null]}>
                  🟢 ክፍያ መቀበል
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.topMicButton, isListening ? styles.micListeningPulse : null]} 
              onPress={handleMicPress}
              activeOpacity={0.8}
            >
              <Text style={styles.micEmoji}>🎙️</Text>
              <Text style={styles.micText}>
                {isListening ? 'እየሰማ ነው...' : (voiceMode === 'credit' ? 'ዱቤ ይመዝገቡ' : 'ክፍያ ይመዝገቡ')}
              </Text>
            </TouchableOpacity>

            <Text style={styles.voiceGuideText}>
              ምሳሌ፡{' '}
              <Text style={{ color: logoGreen, fontWeight: 'bold' }}>
                {voiceMode === 'credit' ? '"አበበ 200 ብር [ስኳር]"' : '"ከበደ 500 ብር [የቡና]"'}
              </Text>
            </Text>

            <TouchableOpacity 
              style={styles.manualEntryBtn}
              onPress={() => {
                setManualAmount('');
                setManualNote('');
                setSelectedCustomer(null);
                setShowCustomerPicker(false);
                setPickerSearchQuery('');
                setIsManualModalVisible(true);
              }}
            >
              <Text style={styles.manualEntryText}>⌨️ በጽሑፍ ለመመዝገብ</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.confirmCard}>
            <Text style={styles.confirmHeader}>ለማረጋገጥ ይገምግሩ</Text>

            <View style={styles.parsedDataGrid}>
              <View style={styles.parsedChip}>
                <Text style={styles.parsedLabel}>ደንበኛ:</Text>
                <Text style={styles.parsedValue}>{parsedVoiceData.customer}</Text>
              </View>

              <View style={styles.parsedChip}>
                <Text style={styles.parsedLabel}>ዓይነት:</Text>
                <Text style={[styles.parsedValue, { color: parsedVoiceData.type === 'credit' ? alertRed : logoGreen }]}>
                  {parsedVoiceData.type === 'credit' ? '🔴 ዱቤ' : '🟢 ክፍያ'}
                </Text>
              </View>

              <View style={styles.parsedChip}>
                <Text style={styles.parsedLabel}>መጠን:</Text>
                <Text style={[styles.parsedValue, { color: parsedVoiceData.type === 'credit' ? alertRed : logoGreen }]}>
                  {parsedVoiceData.amount} ETB
                </Text>
              </View>

              <View style={styles.parsedChip}>
                <Text style={styles.parsedLabel}>ዕቃ/ማስታወሻ:</Text>
                <Text style={styles.parsedValue}>{parsedVoiceData.item || '-'}</Text>
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={handleEditVoiceData}
              >
                <Text style={styles.cancelBtnText}>✏️ አርም</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: logoGreen }]} 
                onPress={() => {
                  setSelectedCustomer(customers.find(c => c.id === parsedVoiceData.customerId) || customers[0]);
                  setManualAmount(parsedVoiceData.amount);
                  setManualNote(parsedVoiceData.item);
                  setVoiceMode(parsedVoiceData.type);
                  handleSaveEntry();
                }}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? '...' : '✅ አጽድቅ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Recent Transactions Header */}
      <View style={styles.directoryHeader}>
        <Text style={styles.directoryTitle}>የቅርብ ጊዜ ደንበኞች</Text>
        <TouchableOpacity 
          style={[styles.addContactBtn, { backgroundColor: logoGreen }]}
          onPress={() => setIsAddCustomerModalVisible(true)}
        >
          <Text style={styles.addContactIcon}>+ አዲስ ደንበኛ</Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={logoGreen} />
          <Text style={styles.loadingText}>መረጃ በመጫን ላይ...</Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={logoGreen} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyTitle}>ምንም ደንበኛ አልተገኘም</Text>
              <Text style={styles.emptySub}>+ በመጫን አዲስ ደንበኛ ያስገቡ</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.contactCard}
              onPress={() => setSelectedCustomerDetail(item)}
              activeOpacity={0.7}
            >
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>

              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{item.name}</Text>
                <Text style={styles.contactSubtext}>{item.phone || 'ስልክ አልተመዘገበም'}</Text>
              </View>

              <Text style={[styles.statusText, { color: item.isCleared ? logoGreen : alertRed }]}>
                {item.balanceText}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* CUSTOMER QUICK ENTRY & HISTORY MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedCustomerDetail}
        onRequestClose={() => setSelectedCustomerDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCustomerDetail && (
              <>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' }}>
                    {selectedCustomerDetail.name}
                  </Text>
                  <Text style={{ color: '#A8C5B8', fontSize: 11 }}>{selectedCustomerDetail.phone || '---'}</Text>

                  <View style={{ marginTop: 8, padding: 8, backgroundColor: '#0E2417', borderRadius: 8, width: '100%', alignItems: 'center' }}>
                    <Text style={{ color: '#A8C5B8', fontSize: 10 }}>የቀረ የዱቤ መጠን (Total Balance)</Text>
                    <Text style={{ color: selectedCustomerDetail.isCleared ? logoGreen : alertRed, fontSize: 18, fontWeight: 'bold' }}>
                      {selectedCustomerDetail.balanceText}
                    </Text>
                  </View>
                </View>

                <View style={{ backgroundColor: '#0E2417', padding: 10, borderRadius: 8, marginBottom: 10 }}>
                  <Text style={{ color: '#27E365', fontSize: 11, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                    አዲስ ግብይት መዝገብ (Quick Record)
                  </Text>

                  <View style={{ flexDirection: 'row', backgroundColor: '#183424', borderRadius: 6, padding: 2, marginBottom: 8 }}>
                    <TouchableOpacity 
                      style={[{ flex: 1, paddingVertical: 4, alignItems: 'center', borderRadius: 4 }, quickType === 'credit' ? { backgroundColor: alertRed } : null]}
                      onPress={() => setQuickType('credit')}
                    >
                      <Text style={{ color: '#FFF', fontSize: 11, fontWeight: 'bold' }}>🔴 ዱቤ</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[{ flex: 1, paddingVertical: 4, alignItems: 'center', borderRadius: 4 }, quickType === 'payment' ? { backgroundColor: logoGreen } : null]}
                      onPress={() => setQuickType('payment')}
                    >
                      <Text style={{ color: quickType === 'payment' ? '#0E2417' : '#A8C5B8', fontSize: 11, fontWeight: 'bold' }}>🟢 ክፍያ</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={[styles.modalInput, { marginBottom: 6, paddingVertical: 6, fontSize: 12 }]}
                    placeholder="የገንዘብ መጠን (ETB)"
                    placeholderTextColor="#5A786A"
                    keyboardType="numeric"
                    value={quickAmount}
                    onChangeText={setQuickAmount}
                  />
                  <TextInput
                    style={[styles.modalInput, { marginBottom: 0, paddingVertical: 6, fontSize: 12 }]}
                    placeholder="የዕቃው ዓይነት / ማስታወሻ"
                    placeholderTextColor="#5A786A"
                    value={quickItem}
                    onChangeText={setQuickItem}
                  />
                </View>

                <Text style={{ color: '#A8C5B8', fontSize: 11, marginBottom: 4, fontWeight: '600' }}>
                  የመጨረሻ ግብይት (Last Transaction):
                </Text>
                <View style={{ backgroundColor: '#0E2417', borderRadius: 6, padding: 8, marginBottom: 12 }}>
                  {(() => {
                    const lastTx = transactions
                      .filter((t) => t.customer_id === selectedCustomerDetail.id)
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                    if (lastTx) {
                      return (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: '#FFFFFF', fontSize: 11 }}>• {lastTx.item || (lastTx.type === 'credit' ? 'ዱቤ' : 'ክፍያ')}</Text>
                          <Text style={{ color: lastTx.type === 'credit' ? alertRed : logoGreen, fontWeight: 'bold', fontSize: 11 }}>
                            {lastTx.type === 'credit' ? '+' : '-'}{lastTx.amount} ETB
                          </Text>
                        </View>
                      );
                    }
                    return <Text style={{ color: '#5A786A', fontSize: 11 }}>እስካሁን ግብይት የለም</Text>;
                  })()}
                </View>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedCustomerDetail(null)}>
                    <Text style={styles.cancelBtnText}>ተመለስ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.saveBtn, { backgroundColor: logoGreen }]} 
                    onPress={handleQuickCustomerSave}
                    disabled={saving}
                  >
                    <Text style={styles.saveBtnText}>
                      {saving ? '...' : 'መዝገብ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Manual Transaction Modal Overlay */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isManualModalVisible}
        onRequestClose={() => setIsManualModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>መረጃውን ያርሙ / ይመዝገቡ</Text>

            <View style={styles.modalToggleContainer}>
              <TouchableOpacity
                style={[styles.modalToggleBtn, voiceMode === 'credit' ? { backgroundColor: alertRed } : null]}
                onPress={() => setVoiceMode('credit')}
              >
                <Text style={[styles.modalToggleText, voiceMode === 'credit' ? styles.activeToggleText : null]}>
                  🔴 ዱቤ
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalToggleBtn, voiceMode === 'payment' ? { backgroundColor: logoGreen } : null]}
                onPress={() => setVoiceMode('payment')}
              >
                <Text style={[styles.modalToggleText, voiceMode === 'payment' ? { color: '#0E2417', fontWeight: 'bold' } : null]}>
                  🟢 ክፍያ
                </Text>
              </TouchableOpacity>
            </View>

            {/* CUSTOMER PICKER WITH SEARCH */}
            <Text style={styles.inputLabel}>ደንበኛ ይምረጡ</Text>
            <TouchableOpacity 
              style={[styles.modalInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]} 
              onPress={() => setShowCustomerPicker(!showCustomerPicker)}
            >
              <Text style={{ color: '#FFFFFF' }}>
                {selectedCustomer ? selectedCustomer.name : 'እዚህ ጠቅ ያድርጉ ለመምረጥ...'}
              </Text>
              <Text style={{ color: '#27E365', fontSize: 12 }}>
                {showCustomerPicker ? '▲ ዝጋ' : '▼ ተጨማሪ'}
              </Text>
            </TouchableOpacity>

            {showCustomerPicker && (
              <View style={{ maxHeight: 220, backgroundColor: '#0E2417', borderRadius: 8, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(39, 227, 101, 0.3)' }}>
                <View style={{ padding: 8, borderBottomWidth: 1, borderBottomColor: '#183424' }}>
                  <TextInput
                    style={{ backgroundColor: '#183424', color: '#FFFFFF', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10, fontSize: 12 }}
                    placeholder="🔍 ደንበኛ ይፈልጉ..."
                    placeholderTextColor="#5A786A"
                    value={pickerSearchQuery}
                    onChangeText={setPickerSearchQuery}
                    autoFocus={true}
                  />
                </View>

                <FlatList
                  data={pickerFilteredCustomers}
                  keyExtractor={(item) => item.id}
                  keyboardShouldPersistTaps="handled"
                  ListEmptyComponent={
                    <View style={{ padding: 12, alignItems: 'center' }}>
                      <Text style={{ color: '#5A786A', fontSize: 12 }}>ምንም ደንበኛ አልተገኘም</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ 
                        padding: 10, 
                        borderBottomWidth: 1, 
                        borderBottomColor: '#183424',
                        backgroundColor: selectedCustomer?.id === item.id ? 'rgba(39, 227, 101, 0.15)' : 'transparent'
                      }}
                      onPress={() => {
                        setSelectedCustomer(item);
                        setShowCustomerPicker(false);
                        setPickerSearchQuery('');
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: selectedCustomer?.id === item.id ? 'bold' : 'normal' }}>
                        {selectedCustomer?.id === item.id ? '✓ ' : ''}{item.name}
                      </Text>
                      <Text style={{ color: '#5A786A', fontSize: 11 }}>{item.phone || ''}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}

            <Text style={styles.inputLabel}>መጠን (በ ETB)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ምሳሌ፡ 200"
              placeholderTextColor="#5A786A"
              keyboardType="numeric"
              value={manualAmount}
              onChangeText={setManualAmount}
            />

            <Text style={styles.inputLabel}>የዕቃው ዓይነት / ማስታወሻ (አማራጭ)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ምሳሌ፡ ስኳር"
              placeholderTextColor="#5A786A"
              value={manualNote}
              onChangeText={setManualNote}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => {
                  setIsManualModalVisible(false);
                  setShowCustomerPicker(false);
                  setPickerSearchQuery('');
                }}
              >
                <Text style={styles.cancelBtnText}>ተመለስ</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: logoGreen }]}
                onPress={handleSaveEntry}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? '...' : 'መዝገብ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add New Customer Modal Overlay */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddCustomerModalVisible}
        onRequestClose={() => setIsAddCustomerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Error banner INSIDE the modal */}
            {error ? (
              <View style={styles.modalErrorBanner}>
                <Text style={styles.modalErrorText}>{error}</Text>
                <TouchableOpacity onPress={() => setError('')}>
                  <Text style={styles.modalErrorClose}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={styles.modalTitle}>አዲስ ደንበኛ መዝገብ</Text>

            <Text style={styles.inputLabel}>ሙሉ ስም</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ምሳሌ፡ ካሳሁን ተስፋዬ"
              placeholderTextColor="#5A786A"
              value={newCustomerName}
              onChangeText={setNewCustomerName}
            />

            <Text style={styles.inputLabel}>ስልክ ቁጥር</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ምሳሌ፡ 0911..."
              placeholderTextColor="#5A786A"
              keyboardType="phone-pad"
              value={newCustomerPhone}
              onChangeText={setNewCustomerPhone}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={styles.cancelBtn}
                onPress={() => setIsAddCustomerModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>ተመለስ</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: logoGreen }]}
                onPress={handleAddNewCustomer}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? '...' : 'አስገባ'}
                </Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    marginRight: 10,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headerTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  syncText: {
    color: '#A8C5B8',
    fontSize: 10,
  },
  settingsButton: {
    padding: 6,
  },
  settingsIcon: {
    fontSize: 20,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  errorBannerText: {
    color: '#FF4D4D',
    fontSize: 12,
    flex: 1,
  },
  errorClose: {
    color: '#FF4D4D',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  searchInput: {
    backgroundColor: '#183424',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  voiceGuideBanner: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(39, 227, 101, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27E365',
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceGuideTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    padding: 3,
    marginTop: 8,
  },
  toggleBtn: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  toggleText: {
    fontSize: 12,
    color: '#A8C5B8',
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  topMicButton: {
    backgroundColor: '#27E365',
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 8,
  },
  micListeningPulse: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  micEmoji: {
    fontSize: 22,
  },
  micText: {
    color: '#0E2417',
    fontWeight: 'bold',
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },
  voiceGuideText: {
    color: '#A8C5B8',
    fontSize: 11,
  },
  manualEntryBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
  },
  manualEntryText: {
    color: '#A8C5B8',
    fontSize: 11,
    fontWeight: '600',
  },
  confirmCard: {
    width: '100%',
    alignItems: 'center',
  },
  confirmHeader: {
    color: '#27E365',
    fontWeight: 'bold',
    fontSize: 12,
    marginBottom: 8,
  },
  parsedDataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 4,
  },
  parsedChip: {
    backgroundColor: '#183424',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    width: '48%',
    marginBottom: 6,
  },
  parsedLabel: {
    color: '#A8C5B8',
    fontSize: 10,
  },
  parsedValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  directoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
    marginBottom: 6,
  },
  directoryTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addContactBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  addContactIcon: {
    color: '#0E2417',
    fontWeight: 'bold',
    fontSize: 11,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A8C5B8',
    marginTop: 10,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#A8C5B8',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySub: {
    color: '#5A786A',
    fontSize: 12,
    marginTop: 4,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#254A35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  contactSubtext: {
    color: '#5A786A',
    fontSize: 11,
  },
  statusText: {
    fontSize: 13,
    fontWeight: 'bold',
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
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#0E2417',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  modalToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  modalToggleText: {
    fontSize: 13,
    color: '#A8C5B8',
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  inputLabel: {
    color: '#A8C5B8',
    fontSize: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#0E2417',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 14,
  },
  modalActionRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    marginLeft: 6,
    borderRadius: 8,
  },
  saveBtnText: {
    color: '#0E2417',
    fontWeight: 'bold',
  },
  modalErrorBanner: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  modalErrorText: {
    color: '#FF4D4D',
    fontSize: 12,
    flex: 1,
  },
  modalErrorClose: {
    color: '#FF4D4D',
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 6,
  },
});