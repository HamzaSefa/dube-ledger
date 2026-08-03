import React, { useState } from 'react';
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
} from 'react-native';

export default function HomeScreen({ onOpenSettings }) {
  const [voiceMode, setVoiceMode] = useState('credit'); // 'credit' or 'payment'
  const [isListening, setIsListening] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Dynamic Contact / Transaction List State
  const [contacts, setContacts] = useState([
    { id: '1', name: 'Abebe Kebede', phone: '0911223344', status: '0 ETB', subtext: 'ከ5 ደቂቃ በፊት', isCleared: true },
    { id: '2', name: 'Kebede Alemu', phone: '0922334455', status: '850 ETB', subtext: 'ከ3 ደቂቃ በፊት', isCleared: false },
    { id: '3', name: 'Biruk Desta', phone: '0933445566', status: '1,900 ETB', subtext: 'ከ5 ደቂቃ በፊት', isCleared: false },
    { id: '4', name: 'Dawit Germa', phone: '0944556677', status: '2,300 ETB', subtext: 'ከ3 ደቂቃ በፊት', isCleared: false },
  ]);

  // Selected Customer for Quick Record / Ledger Detail Modal
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
  const [quickAmount, setQuickAmount] = useState('');
  const [quickItem, setQuickItem] = useState('');
  const [quickType, setQuickType] = useState('credit');

  // Parsed Voice State
  const [parsedVoiceData, setParsedVoiceData] = useState({
    customer: 'Abebe Kebede',
    amount: '200',
    item: 'ስኳር',
    type: 'credit',
  });

  // Manual / Edit Entry Modal State
  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('Abebe Kebede');

  // Add Customer Modal State
  const [isAddCustomerModalVisible, setIsAddCustomerModalVisible] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const logoGreen = '#27E365';
  const alertRed = '#FF4D4D';
  const pageBackgroundColor = '#0E2417';

  const handleMicPress = () => {
    setIsListening(true);
    // 6 Seconds Auto-Listening Timeout
    setTimeout(() => {
      setIsListening(false);
      setParsedVoiceData({
        customer: voiceMode === 'credit' ? 'Abebe Kebede' : 'Kebede Alemu',
        amount: voiceMode === 'credit' ? '200' : '500',
        item: voiceMode === 'credit' ? 'ስኳር' : 'የቡና',
        type: voiceMode,
      });
      setShowConfirmation(true);
    }, 6000);
  };

  const handleEditVoiceData = () => {
    setSelectedCustomer(parsedVoiceData.customer);
    setManualAmount(parsedVoiceData.amount);
    setManualNote(parsedVoiceData.item);
    setVoiceMode(parsedVoiceData.type);
    
    setShowConfirmation(false);
    setIsManualModalVisible(true);
  };

  const handleSaveEntry = () => {
    setIsManualModalVisible(false);
    setShowConfirmation(false);
    setManualAmount('');
    setManualNote('');
  };

  const handleQuickCustomerSave = () => {
    setSelectedCustomerDetail(null);
    setQuickAmount('');
    setQuickItem('');
  };

  const handleAddNewCustomer = () => {
    if (!newCustomerName.trim()) return;

    const newContact = {
      id: Date.now().toString(),
      name: newCustomerName,
      phone: newCustomerPhone || '0900000000',
      status: '0 ETB',
      subtext: 'አዲስ የተመዘገበ',
      isCleared: true,
    };

    setContacts([newContact, ...contacts]);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setIsAddCustomerModalVisible(false);
  };

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
            <Text style={styles.headerTitle}>ዱቤ መዝገብ</Text>
            <View style={styles.syncBadge}>
              <View style={[styles.syncDot, { backgroundColor: isOnline ? logoGreen : '#FF9F43' }]} />
              <Text style={styles.syncText}>{isOnline ? 'የተገናኘ' : 'በስልክ የተቀመጠ'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.settingsButton} onPress={onOpenSettings}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 ደንበኛ ወይም ስልክ ይፈልጉ..."
          placeholderTextColor="#5A786A"
        />
      </View>

      {/* Voice Banner */}
      <View style={styles.voiceGuideBanner}>
        {!showConfirmation ? (
          <>
            <Text style={styles.voiceGuideTitle}>በድምፅ ለመመዝገብ የሚፈለገውን ይምረጡ</Text>
            
            {/* Toggle Mode: Credit vs Payment */}
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

            {/* Microphone Button */}
            <TouchableOpacity 
              style={[styles.topMicButton, isListening ? styles.micListeningPulse : null]} 
              onPress={handleMicPress}
              activeOpacity={0.8}
            >
              <Text style={styles.micEmoji}>🎙️</Text>
              <Text style={styles.micText}>
                {isListening ? 'እየሰማ ነው...' : (voiceMode === 'credit' ? 'ዱቤ ይመዝግቡ' : 'ክፍያ ይመዝግቡ')}
              </Text>
            </TouchableOpacity>

            {/* Dynamic Examples */}
            <Text style={styles.voiceGuideText}>
              ምሳሌ፡{' '}
              <Text style={{ color: logoGreen, fontWeight: 'bold' }}>
                {voiceMode === 'credit' ? '"አበበ 200 ብር [ስኳር]"' : '"ከበደ 500 ብር [የቡና]"'}
              </Text>
            </Text>

            {/* Manual Entry Secondary Option */}
            <TouchableOpacity 
              style={styles.manualEntryBtn}
              onPress={() => {
                setManualAmount('');
                setManualNote('');
                setIsManualModalVisible(true);
              }}
            >
              <Text style={styles.manualEntryText}>⌨️ በጽሑፍ ለመመዝገብ</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Confirmation Flow Card */
          <View style={styles.confirmCard}>
            <Text style={styles.confirmHeader}>ለማረጋገጥ ይገምግሙ</Text>
            
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

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={handleEditVoiceData}
              >
                <Text style={styles.cancelBtnText}>✏️ አርም</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: logoGreen }]} 
                onPress={handleSaveEntry}
              >
                <Text style={styles.saveBtnText}>✅ አጽድቅ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Recent Transactions Header */}
      <View style={styles.directoryHeader}>
        <Text style={styles.directoryTitle}>Recent Transactions</Text>
        <TouchableOpacity 
          style={[styles.addContactBtn, { backgroundColor: logoGreen }]}
          onPress={() => setIsAddCustomerModalVisible(true)}
        >
          <Text style={styles.addContactIcon}>+ አዲስ ደንበኛ</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions List */}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
              <Text style={styles.contactSubtext}>{item.subtext}</Text>
            </View>

            <Text style={[styles.statusText, { color: item.isCleared ? logoGreen : alertRed }]}>
              {item.status}
            </Text>
          </TouchableOpacity>
        )}
      />

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
                {/* Header Info */}
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' }}>
                    {selectedCustomerDetail.name}
                  </Text>
                  <Text style={{ color: '#A8C5B8', fontSize: 11 }}>{selectedCustomerDetail.phone}</Text>
                  
                  <View style={{ marginTop: 8, padding: 8, backgroundColor: '#0E2417', borderRadius: 8, width: '100%', alignItems: 'center' }}>
                    <Text style={{ color: '#A8C5B8', fontSize: 10 }}>የቀረ የዱቤ መጠን (Total Balance)</Text>
                    <Text style={{ color: selectedCustomerDetail.isCleared ? logoGreen : alertRed, fontSize: 18, fontWeight: 'bold' }}>
                      {selectedCustomerDetail.status}
                    </Text>
                  </View>
                </View>

                {/* Quick Transaction Entry Box */}
                <View style={{ backgroundColor: '#0E2417', padding: 10, borderRadius: 8, marginBottom: 10 }}>
                  <Text style={{ color: '#27E365', fontSize: 11, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                    አዲስ ግብይት መዝግብ (Quick Record)
                  </Text>

                  {/* Toggle Type */}
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

                  {/* Inputs for Money and Item */}
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

                {/* Last Transaction Summary */}
                <Text style={{ color: '#A8C5B8', fontSize: 11, marginBottom: 4, fontWeight: '600' }}>
                  የመጨረሻ ግብይት (Last Transaction):
                </Text>
                <View style={{ backgroundColor: '#0E2417', borderRadius: 6, padding: 8, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#FFFFFF', fontSize: 11 }}>• ስኳር (2 ኪሎ)</Text>
                    <Text style={{ color: alertRed, fontWeight: 'bold', fontSize: 11 }}>+200 ETB</Text>
                  </View>
                </View>

                {/* Modal Buttons */}
                <View style={styles.modalActionRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedCustomerDetail(null)}>
                    <Text style={styles.cancelBtnText}>ዝጋ</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: logoGreen }]} onPress={handleQuickCustomerSave}>
                    <Text style={styles.saveBtnText}>መዝግብ</Text>
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
            <Text style={styles.modalTitle}>መረጃውን ያርሙ / ይመዝግቡ</Text>

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

            <Text style={styles.inputLabel}>ደንበኛ ይምረጡ</Text>
            <View style={styles.modalInput}>
              <Text style={{ color: '#FFFFFF' }}>{selectedCustomer}</Text>
            </View>

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
                onPress={() => setIsManualModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>ሰርዝ</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: logoGreen }]}
                onPress={handleSaveEntry}
              >
                <Text style={styles.saveBtnText}>መዝግብ</Text>
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
            <Text style={styles.modalTitle}>አዲስ ደንበኛ መዝግብ</Text>

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
                <Text style={styles.cancelBtnText}>ሰርዝ</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: logoGreen }]}
                onPress={handleAddNewCustomer}
              >
                <Text style={styles.saveBtnText}>አስገባ</Text>
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
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
});