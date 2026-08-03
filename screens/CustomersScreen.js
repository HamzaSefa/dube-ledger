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

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Modals
  const [isAddCustomerVisible, setIsAddCustomerVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  // Form States for Add Customer
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Quick Record inside Customer Details
  const [quickAmount, setQuickAmount] = useState('');
  const [quickItem, setQuickItem] = useState('');
  const [quickType, setQuickType] = useState('credit'); // 'credit' or 'payment'

  // Dynamic Customer List
  const [customers, setCustomers] = useState([
    {
      id: '1',
      name: 'Abebe Kebede',
      phone: '0911223344',
      balance: '1,900 ETB',
      isCleared: false,
      history: [
        { id: 't1', item: 'ስኳር (2 ኪሎ)', amount: '200 ETB', type: 'credit', date: 'ዛሬ' },
        { id: 't2', item: 'ዘይት (1 ሊትር)', amount: '650 ETB', type: 'credit', date: 'ትናንት' },
        { id: 't3', item: 'ክፍያ', amount: '500 ETB', type: 'payment', date: 'ካለፈው ሳምንት' },
      ],
    },
    {
      id: '2',
      name: 'Sara Kassa',
      phone: '0922334455',
      balance: '850 ETB',
      isCleared: false,
      history: [
        { id: 't4', item: 'ዱቄት (5 ኪሎ)', amount: '850 ETB', type: 'credit', date: 'ትናንት' },
      ],
    },
    {
      id: '3',
      name: 'Biruk Desta',
      phone: '0933445566',
      balance: '0 ETB',
      isCleared: true,
      history: [
        { id: 't5', item: 'ክፍያ ሙሉ በሙሉ', amount: '1,200 ETB', type: 'payment', date: 'ከ3 ቀን በፊት' },
      ],
    },
  ]);

  const logoGreen = '#27E365';
  const alertRed = '#FF4D4D';
  const pageBackgroundColor = '#0E2417';

  // Add Customer Logic
  const handleAddNewCustomer = () => {
    if (!newCustomerName.trim()) return;

    const newContact = {
      id: Date.now().toString(),
      name: newCustomerName,
      phone: newCustomerPhone || '0900000000',
      balance: '0 ETB',
      isCleared: true,
      history: [],
    };

    setCustomers([newContact, ...customers]);
    setNewCustomerName('');
    setNewCustomerPhone('');
    setIsAddCustomerVisible(false);
  };

  // Save Transaction directly for Selected Customer
  const handleSaveQuickTransaction = () => {
    if (!quickAmount || !selectedCustomer) return;

    const newTx = {
      id: Date.now().toString(),
      item: quickItem || (quickType === 'credit' ? 'ዱቤ' : 'ክፍያ'),
      amount: `${quickAmount} ETB`,
      type: quickType,
      date: 'አሁን',
    };

    const updatedCustomers = customers.map((c) => {
      if (c.id === selectedCustomer.id) {
        return {
          ...c,
          history: [newTx, ...c.history],
        };
      }
      return c;
    });

    setCustomers(updatedCustomers);
    
    // Update active modal view state
    setSelectedCustomer({
      ...selectedCustomer,
      history: [newTx, ...selectedCustomer.history],
    });

    setQuickAmount('');
    setQuickItem('');
  };

  // Filter customers by search term
  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

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
          <Text style={styles.headerTitle}>የደንበኞች ዝርዝር</Text>
        </View>

        <TouchableOpacity
          style={[styles.addContactBtn, { backgroundColor: logoGreen }]}
          onPress={() => setIsAddCustomerVisible(true)}
        >
          <Text style={styles.addContactIcon}>+ አዲስ ደንበኛ</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 ደንበኛ በስም ወይም በስልክ ይፈልጉ..."
          placeholderTextColor="#5A786A"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Customer Directory */}
      <FlatList
        data={filteredCustomers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.customerCard}
            onPress={() => setSelectedCustomer(item)}
            activeOpacity={0.7}
          >
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>

            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{item.name}</Text>
              <Text style={styles.customerPhone}>{item.phone}</Text>
            </View>

            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.balanceText, { color: item.isCleared ? logoGreen : alertRed }]}>
                {item.balance}
              </Text>
              <Text style={styles.viewDetailsHint}>ዝርዝር ይመልከቱ ›</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* CUSTOMER DETAIL MODAL (Stacked Inputs, No Voice) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedCustomer}
        onRequestClose={() => setSelectedCustomer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedCustomer && (
              <>
                {/* Header Info */}
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }}>
                    {selectedCustomer.name}
                  </Text>
                  <Text style={{ color: '#A8C5B8', fontSize: 12 }}>{selectedCustomer.phone}</Text>

                  <View style={styles.balanceBadge}>
                    <Text style={{ color: '#A8C5B8', fontSize: 11 }}>የተጠራቀመ ዱቤ (Balance)</Text>
                    <Text style={{ color: selectedCustomer.isCleared ? logoGreen : alertRed, fontSize: 20, fontWeight: 'bold' }}>
                      {selectedCustomer.balance}
                    </Text>
                  </View>
                </View>

                {/* Quick Transaction Entry Box */}
                <View style={styles.quickRecordBox}>
                  <Text style={{ color: logoGreen, fontSize: 12, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>
                    አዲስ ግብይት መዝግብ (New Entry)
                  </Text>

                  {/* Mode Toggle */}
                  <View style={{ flexDirection: 'row', backgroundColor: '#183424', borderRadius: 6, padding: 2, marginBottom: 12 }}>
                    <TouchableOpacity
                      style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 4 }, quickType === 'credit' ? { backgroundColor: alertRed } : null]}
                      onPress={() => setQuickType('credit')}
                    >
                      <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>🔴 ዱቤ</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 4 }, quickType === 'payment' ? { backgroundColor: logoGreen } : null]}
                      onPress={() => setQuickType('payment')}
                    >
                      <Text style={{ color: quickType === 'payment' ? '#0E2417' : '#A8C5B8', fontSize: 12, fontWeight: 'bold' }}>🟢 ክፍያ</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Row 1: Amount Input */}
                  <Text style={styles.inputLabel}>የገንዘብ መጠን (በ ETB)</Text>
                  <TextInput
                    style={[styles.modalInput, { marginBottom: 10 }]}
                    placeholder="ምሳሌ፡ 200"
                    placeholderTextColor="#5A786A"
                    keyboardType="numeric"
                    value={quickAmount}
                    onChangeText={setQuickAmount}
                  />

                  {/* Row 2: Item / Description Input */}
                  <Text style={styles.inputLabel}>የዕቃው ዓይነት / ማስታወሻ</Text>
                  <TextInput
                    style={[styles.modalInput, { marginBottom: 12 }]}
                    placeholder="ምሳሌ፡ ስኳር ወይም ዘይት"
                    placeholderTextColor="#5A786A"
                    value={quickItem}
                    onChangeText={setQuickItem}
                  />

                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: logoGreen, paddingVertical: 10 }]}
                    onPress={handleSaveQuickTransaction}
                  >
                    <Text style={styles.saveBtnText}>መዝግብ (Save Entry)</Text>
                  </TouchableOpacity>
                </View>

                {/* History Trigger Button */}
                <TouchableOpacity
                  style={styles.historyTriggerBtn}
                  onPress={() => setIsHistoryModalVisible(true)}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 }}>
                    📜 ታሪክ ይመልከቱ (Transaction History)
                  </Text>
                </TouchableOpacity>

                {/* Close Modal Action */}
                <View style={styles.modalActionRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedCustomer(null)}>
                    <Text style={styles.cancelBtnText}>ዝጋ (Close)</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* EDITABLE TRANSACTION HISTORY MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isHistoryModalVisible}
        onRequestClose={() => setIsHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>የግብይት ታሪክ (Transaction History)</Text>

            {selectedCustomer && (
              <FlatList
                data={selectedCustomer.history}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 280 }}
                renderItem={({ item }) => (
                  <View style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>{item.item}</Text>
                      <Text style={{ color: '#A8C5B8', fontSize: 10 }}>{item.date}</Text>
                    </View>

                    <Text style={{ color: item.type === 'credit' ? alertRed : logoGreen, fontWeight: 'bold', fontSize: 13, marginRight: 10 }}>
                      {item.type === 'credit' ? '+' : '-'}{item.amount}
                    </Text>

                    <TouchableOpacity
                      style={styles.editChipBtn}
                      onPress={() => setEditingTransaction(item)}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 10 }}>✏️ አርም</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}

            <View style={[styles.modalActionRow, { marginTop: 12 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsHistoryModalVisible(false)}>
                <Text style={styles.cancelBtnText}>ተመለስ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EDIT SINGLE TRANSACTION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={!!editingTransaction}
        onRequestClose={() => setEditingTransaction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ግብይት ያርሙ (Edit Entry)</Text>

            {editingTransaction && (
              <>
                <Text style={styles.inputLabel}>የዕቃው ዓይነት / ማስታወሻ</Text>
                <TextInput
                  style={styles.modalInput}
                  defaultValue={editingTransaction.item}
                />

                <Text style={styles.inputLabel}>መጠን (በ ETB)</Text>
                <TextInput
                  style={styles.modalInput}
                  defaultValue={editingTransaction.amount}
                  keyboardType="numeric"
                />

                <View style={styles.modalActionRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingTransaction(null)}>
                    <Text style={styles.cancelBtnText}>ሰርዝ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: logoGreen }]}
                    onPress={() => setEditingTransaction(null)}
                  >
                    <Text style={styles.saveBtnText}>አስቀምጥ</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ADD NEW CUSTOMER MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddCustomerVisible}
        onRequestClose={() => setIsAddCustomerVisible(false)}
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
                onPress={() => setIsAddCustomerVisible(false)}
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
  addContactBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  addContactIcon: {
    color: '#0E2417',
    fontWeight: 'bold',
    fontSize: 12,
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  searchInput: {
    backgroundColor: '#183424',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 6,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#254A35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  customerPhone: {
    color: '#5A786A',
    fontSize: 11,
    marginTop: 2,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewDetailsHint: {
    color: '#A8C5B8',
    fontSize: 10,
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
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  balanceBadge: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#0E2417',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  quickRecordBox: {
    backgroundColor: '#0E2417',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  historyTriggerBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0E2417',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  editChipBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  inputLabel: {
    color: '#A8C5B8',
    fontSize: 11,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#183424',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  modalActionRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 6,
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