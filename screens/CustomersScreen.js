import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import {
  getCustomers,
  createCustomer,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  deleteCustomer,
  updateCustomer,
} from '../api';

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Modals
  const [isAddCustomerVisible, setIsAddCustomerVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [isEditCustomerVisible, setIsEditCustomerVisible] = useState(false);
  const [isDeleteTxConfirmVisible, setIsDeleteTxConfirmVisible] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);

  // Form States for Add Customer
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  // Form States for Edit Customer
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');

  // Quick Record inside Customer Details
  const [quickAmount, setQuickAmount] = useState('');
  const [quickItem, setQuickItem] = useState('');
  const [quickType, setQuickType] = useState('credit');

  // Edit Transaction Form
  const [editItem, setEditItem] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState('credit');

  // Sorting
  const [sortMode, setSortMode] = useState('lastTransaction');
  const [showSortOptions, setShowSortOptions] = useState(false);

  // Safe Delete + Undo
  const [pendingDelete, setPendingDelete] = useState(null);
  const undoTimerRef = useRef(null);

  // Data
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const logoGreen = '#27E365';
  const alertRed = '#FF4D4D';
  const pageBackgroundColor = '#0E2417';

  // ============================================
  // LOAD DATA
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
      return { customers: custData, transactions: txData };
    } catch (err) {
      setError('መረጃ መጫን አልተሳካም');
      console.log('Fetch error:', err.message);
      throw err;
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
  // HELPERS
  // ============================================
  const getCustomerTransactions = (customerId, txList = transactions) => {
    return txList
      .filter((t) => t.customer_id === customerId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const calculateBalance = (customerId, txList = transactions) => {
    return txList
      .filter((t) => t.customer_id === customerId)
      .reduce((sum, t) => {
        if (t.type === 'credit') return sum + Number(t.amount);
        if (t.type === 'payment') return sum - Number(t.amount);
        return sum;
      }, 0);
  };

  const formatBalance = (amount) => {
    return amount.toLocaleString() + ' ETB';
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('am-ET', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const validatePhone = (phone) => {
    const clean = phone.replace(/\s/g, '');
    return /^(09|07)\d{8}$/.test(clean);
  };

  // ============================================
  // SORTING
  // ============================================
  const getSortedAndFiltered = () => {
    let list = customers.filter((c) => {
      if (pendingDelete && pendingDelete.customer.id === c.id) return false;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
      );
    });

    const mapped = list.map((c) => {
      const balance = calculateBalance(c.id);
      const tx = getCustomerTransactions(c.id);
      const lastTx = tx[0];
      return {
        ...c,
        balance,
        balanceText: formatBalance(balance),
       isCleared: balance <= 0,
        lastTxDate: lastTx ? new Date(lastTx.created_at) : new Date(0),
        createdDate: new Date(c.created_at),
      };
    });

    switch (sortMode) {
      case 'name':
        return mapped.sort((a, b) => a.name.localeCompare(b.name));
      case 'debtAmount':
        return mapped.sort((a, b) => b.balance - a.balance);
      case 'newestCustomer':
        return mapped.sort((a, b) => b.createdDate - a.createdDate);
      case 'lastTransaction':
      default:
        return mapped.sort((a, b) => b.lastTxDate - a.lastTxDate);
    }
  };

  const displayList = getSortedAndFiltered();

  const sortLabels = {
    lastTransaction: 'የቅርብ ግብይት',
    name: 'ስም (A-Z)',
    debtAmount: 'የዱቤ መጠን',
    newestCustomer: 'አዲስ ደንበኛ',
  };

  // ============================================
  // ADD CUSTOMER
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
      setIsAddCustomerVisible(false);
      setError('');
    } catch (err) {
      setError(err.message || 'ደንበኛ መመዝገብ አልተሳካም');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // EDIT CUSTOMER PROFILE
  // ============================================
  const openEditCustomer = () => {
    if (!selectedCustomer) return;
    setEditCustomerName(selectedCustomer.name);
    setEditCustomerPhone(selectedCustomer.phone || '');
    setIsEditCustomerVisible(true);
  };

  const handleEditCustomerSave = async () => {
    if (!editCustomerName.trim()) {
      setError('ስም ያስፈልጋል');
      return;
    }
    if (editCustomerPhone && !validatePhone(editCustomerPhone)) {
      setError('ስልክ ቁጥር 10 አሃዝ መሆን አለበት (09... ወይም 07...)');
      return;
    }

    setSaving(true);
    try {
      await updateCustomer(selectedCustomer.id, {
        name: editCustomerName.trim(),
        phone: editCustomerPhone.trim(),
      });
      const fresh = await fetchData();

      const updated = fresh.customers.find(c => c.id === selectedCustomer.id);
      if (updated) {
        const tx = getCustomerTransactions(updated.id, fresh.transactions);
        const bal = calculateBalance(updated.id, fresh.transactions);
        setSelectedCustomer({
          ...updated,
          history: tx,
          balance: bal,
          balanceText: formatBalance(bal),
          isCleared: bal === 0,
        });
      }

      setIsEditCustomerVisible(false);
      setError('');
    } catch (err) {
      setError(err.message || 'ማዘመን አልተሳካም');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // SAVE QUICK TRANSACTION
  // ============================================
  const handleSaveQuickTransaction = async () => {
    if (!quickAmount || isNaN(quickAmount) || Number(quickAmount) <= 0) {
      setError('የሚሰራ መጠን ያስገቡ');
      return;
    }
    if (!selectedCustomer) return;

    setSaving(true);
    try {
      await addTransaction(
        selectedCustomer.id,
        quickType,
        quickAmount,
        quickItem || (quickType === 'credit' ? 'ዱቤ' : 'ክፍያ')
      );
      const fresh = await fetchData();

      const updatedTx = getCustomerTransactions(selectedCustomer.id, fresh.transactions);
      const updatedBalance = calculateBalance(selectedCustomer.id, fresh.transactions);

      // FIX 1: Auto-close the detail modal after save
      setSelectedCustomer(null);

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
  // EDIT TRANSACTION
  // ============================================
  const openEditTransaction = (item) => {
    setEditingTransaction(item);
    setEditItem(item.item || '');
    setEditAmount(String(item.amount));
    setEditType(item.type);
  };

  const handleEditTransaction = async () => {
    if (!editingTransaction) return;
    if (!editAmount || isNaN(editAmount) || Number(editAmount) <= 0) {
      setError('የሚሰራ መጠን ያስገቡ');
      return;
    }

    setSaving(true);
    try {
      await updateTransaction(editingTransaction.id, {
        item: editItem || (editType === 'credit' ? 'ዱቤ' : 'ክፍያ'),
        amount: Number(editAmount),
        type: editType,
      });

      const fresh = await fetchData();

      if (selectedCustomer) {
        const updatedTx = getCustomerTransactions(selectedCustomer.id, fresh.transactions);
        const updatedBalance = calculateBalance(selectedCustomer.id, fresh.transactions);
        setSelectedCustomer({
          ...selectedCustomer,
          history: updatedTx,
          balance: updatedBalance,
          balanceText: formatBalance(updatedBalance),
          isCleared: updatedBalance === 0,
        });
      }

      setEditingTransaction(null);
      setEditItem('');
      setEditAmount('');
      setEditType('credit');
      setError('');
    } catch (err) {
      setError(err.message || 'ማዘመን አልተሳካም');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // DELETE TRANSACTION
  // ============================================
  const openDeleteTransaction = (item) => {
    setTransactionToDelete(item);
    setIsDeleteTxConfirmVisible(true);
  };

  const confirmDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    setSaving(true);
    try {
      await deleteTransaction(transactionToDelete.id);
      const fresh = await fetchData();

      if (selectedCustomer) {
        const updatedTx = getCustomerTransactions(selectedCustomer.id, fresh.transactions);
        const updatedBalance = calculateBalance(selectedCustomer.id, fresh.transactions);
        setSelectedCustomer({
          ...selectedCustomer,
          history: updatedTx,
          balance: updatedBalance,
          balanceText: formatBalance(updatedBalance),
          isCleared: updatedBalance === 0,
        });
      }

      setIsDeleteTxConfirmVisible(false);
      setTransactionToDelete(null);
      setEditingTransaction(null);
      setError('');
    } catch (err) {
      setError(err.message || 'መሰረዝ አልተሳካም');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // SAFE DELETE + UNDO
  // ============================================
  const handleDeletePress = () => {
    setIsDeleteConfirmVisible(true);
  };

  const confirmDelete = () => {
    if (!selectedCustomer) return;
    setIsDeleteConfirmVisible(false);
    setSelectedCustomer(null);

    const timerId = setTimeout(async () => {
      setPendingDelete(null);
      try {
        await deleteCustomer(selectedCustomer.id);
        await fetchData();
      } catch (err) {
        setError('መሰረዝ አልተሳካም');
      }
    }, 5000);

    setPendingDelete({ customer: selectedCustomer, timerId });
    undoTimerRef.current = timerId;
  };

  const cancelDelete = () => {
    setIsDeleteConfirmVisible(false);
  };

  const undoDelete = () => {
    if (pendingDelete && pendingDelete.timerId) {
      clearTimeout(pendingDelete.timerId);
    }
    setPendingDelete(null);
  };

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  // ============================================
  // RENDER
  // ============================================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={pageBackgroundColor} />

      {/* Undo Banner */}
      {pendingDelete && (
        <View style={styles.undoBanner}>
          <Text style={styles.undoText}>
            "{pendingDelete.customer.name}" ተሰርዟል • 
          </Text>
          <TouchableOpacity onPress={undoDelete}>
            <Text style={styles.undoBtn}>🔄 መልስ (Undo)</Text>
          </TouchableOpacity>
        </View>
      )}

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

      {/* Error Banner (main screen) */}
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => setError('')}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

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

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <TouchableOpacity 
          style={styles.sortPill} 
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Text style={styles.sortPillText}>📊 {sortLabels[sortMode]}</Text>
          <Text style={{ color: '#27E365', fontSize: 11 }}>{showSortOptions ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {showSortOptions && (
        <View style={styles.sortDropdown}>
          {Object.entries(sortLabels).map(([key, label]) => (
            <TouchableOpacity
              key={key}
              style={[styles.sortOption, sortMode === key && styles.sortOptionActive]}
              onPress={() => {
                setSortMode(key);
                setShowSortOptions(false);
              }}
            >
              <Text style={[styles.sortOptionText, sortMode === key && styles.sortOptionTextActive]}>
                {sortMode === key ? '✓ ' : ''}{label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Customer Directory */}
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
              style={styles.customerCard}
              onPress={() => {
                const tx = getCustomerTransactions(item.id);
                setSelectedCustomer({
                  ...item,
                  history: tx,
                });
              }}
              activeOpacity={0.7}
            >
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
              </View>

              <View style={styles.customerInfo}>
                <Text style={styles.customerName}>{item.name}</Text>
                <Text style={styles.customerPhone}>{item.phone || 'ስልክ አልተመዘገበም'}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.balanceText, { color: item.isCleared ? logoGreen : alertRed }]}>
                  {item.balanceText}
                </Text>
                <Text style={styles.viewDetailsHint}>ዝርዝር ይመልከቱ ›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* ===== CUSTOMER DETAIL MODAL (PROFESSIONAL UI) ===== */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={!!selectedCustomer}
        onRequestClose={() => setSelectedCustomer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedCustomer && (
              <>
                {/* Profile Header */}
                <View style={styles.detailHeader}>
                  <View style={styles.detailAvatar}>
                    <Text style={styles.detailAvatarText}>{selectedCustomer.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.detailName}>{selectedCustomer.name}</Text>
                    <Text style={styles.detailPhone}>{selectedCustomer.phone || 'ስልክ አልተመዘገበም'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedCustomer(null)} style={{ padding: 4 }}>
                    <Ionicons name="close" size={22} color="#A8C5B8" />
                  </TouchableOpacity>
                </View>

                {/* Big Balance Card */}
                <View style={styles.balanceCard}>
                  <Text style={styles.balanceCardLabel}>የተጠራቀመ ዱቤ</Text>
                  <Text style={[styles.balanceCardValue, { color: selectedCustomer.isCleared ? logoGreen : alertRed }]}>
                    {selectedCustomer.balanceText}
                  </Text>
                  <Text style={styles.balanceCardSub}>
                    {selectedCustomer.isCleared ? '✅ ሁሉንም ከፍሏል' : '❌ ዕዳ አለ'}
                  </Text>
                </View>

                {/* Horizontal Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => setIsHistoryModalVisible(true)}>
                    <Ionicons name="time-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>ታሪክ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn} onPress={openEditCustomer}>
                    <Ionicons name="create-outline" size={20} color="#27E365" />
                    <Text style={[styles.actionBtnText, { color: '#27E365' }]}>ፕሮፋይል</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: 'rgba(255,77,77,0.3)' }]} onPress={handleDeletePress}>
                    <Ionicons name="trash-outline" size={20} color="#FF4D4D" />
                    <Text style={[styles.actionBtnText, { color: '#FF4D4D' }]}>ሰርዝ</Text>
                  </TouchableOpacity>
                </View>

                {/* Quick Entry Section */}
                <View style={styles.quickEntryCard}>
                  <Text style={styles.quickEntryTitle}>አዲስ ግብይት</Text>

                  <View style={styles.quickToggleRow}>
                    <TouchableOpacity
                      style={[styles.quickToggle, quickType === 'credit' && styles.quickToggleActiveRed]}
                      onPress={() => setQuickType('credit')}
                    >
                      <Text style={[styles.quickToggleText, quickType === 'credit' && styles.quickToggleTextActive]}>
                        🔴 ዱቤ
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.quickToggle, quickType === 'payment' && styles.quickToggleActiveGreen]}
                      onPress={() => setQuickType('payment')}
                    >
                      <Text style={[styles.quickToggleText, quickType === 'payment' && styles.quickToggleTextActive]}>
                        🟢 ክፍያ
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.quickInput}
                    placeholder="መጠን (ETB)"
                    placeholderTextColor="#5A786A"
                    keyboardType="numeric"
                    value={quickAmount}
                    onChangeText={setQuickAmount}
                  />
                  <TextInput
                    style={styles.quickInput}
                    placeholder="የዕቃው ዓይነት / ማስታወሻ"
                    placeholderTextColor="#5A786A"
                    value={quickItem}
                    onChangeText={setQuickItem}
                  />

                  <TouchableOpacity
                    style={[styles.quickSaveBtn, { backgroundColor: logoGreen }]}
                    onPress={handleSaveQuickTransaction}
                    disabled={saving}
                  >
                    <Text style={styles.quickSaveBtnText}>
                      {saving ? '...' : 'መዝገብ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* EDIT CUSTOMER PROFILE MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditCustomerVisible}
        onRequestClose={() => setIsEditCustomerVisible(false)}
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

            <Text style={styles.modalTitle}>ፕሮፋይል ያርሙ</Text>

            <Text style={styles.inputLabel}>ሙሉ ስም</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ምሳሌ፡ ካሳሁን ተስፋዬ"
              placeholderTextColor="#5A786A"
              value={editCustomerName}
              onChangeText={setEditCustomerName}
            />

            <Text style={styles.inputLabel}>ስልክ ቁጥር</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="ምሳሌ፡ 0911223344"
              placeholderTextColor="#5A786A"
              keyboardType="phone-pad"
              value={editCustomerPhone}
              onChangeText={setEditCustomerPhone}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsEditCustomerVisible(false)}
              >
                {/* FIX 3: Cancel = ተመለስ */}
                <Text style={styles.cancelBtnText}>ተመለስ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: logoGreen }]}
                onPress={handleEditCustomerSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? '...' : 'አስቀምጥ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteConfirmVisible}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>መሰረዝ ያረጋግጡ</Text>
            <Text style={{ color: '#A8C5B8', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
              እርግጠኛ ነዎት "{selectedCustomer?.name}"ን መሰረዝ ይፈልጋሉ?
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelDelete}>
                <Text style={styles.cancelBtnText}>አይ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: alertRed }]}
                onPress={confirmDelete}
              >
                <Text style={[styles.saveBtnText, { color: '#FFFFFF' }]}>አዎ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* TRANSACTION HISTORY MODAL */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isHistoryModalVisible}
        onRequestClose={() => setIsHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>የግብይት ታሪክ</Text>

            {selectedCustomer && (
              <FlatList
                data={selectedCustomer.history}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 300 }}
                ListEmptyComponent={
                  <View style={{ padding: 16, alignItems: 'center' }}>
                    <Text style={{ color: '#5A786A', fontSize: 13 }}>እስካሁን ግብይት የለም</Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                        {item.item || (item.type === 'credit' ? 'ዱቤ' : 'ክፍያ')}
                      </Text>
                      {/* Original two-line date UI (user preferred this) */}
                      <Text style={{ color: '#A8C5B8', fontSize: 10 }}>
                        📅 ተመዝገበ: {formatDate(item.created_at)}
                      </Text>
                      {item.updated_at && item.updated_at !== item.created_at && (
                        <Text style={{ color: '#27E365', fontSize: 10 }}>
                          ✏️ ተስተካክሏል: {formatDate(item.updated_at)}
                        </Text>
                      )}
                    </View>

                    <Text style={{ color: item.type === 'credit' ? alertRed : logoGreen, fontWeight: 'bold', fontSize: 13, marginRight: 10 }}>
                      {item.type === 'credit' ? '+' : '-'}{Number(item.amount).toLocaleString()} ETB
                    </Text>

                    <TouchableOpacity
                      style={styles.editChipBtn}
                      onPress={() => openEditTransaction(item)}
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
            {/* Error banner INSIDE the modal */}
            {error ? (
              <View style={styles.modalErrorBanner}>
                <Text style={styles.modalErrorText}>{error}</Text>
                <TouchableOpacity onPress={() => setError('')}>
                  <Text style={styles.modalErrorClose}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <Text style={styles.modalTitle}>ግብይት ያርሙ</Text>

            {/* TYPE TOGGLE */}
            <View style={styles.typeToggleRow}>
              <TouchableOpacity
                style={[styles.typeToggleBtn, editType === 'credit' && styles.typeToggleRed]}
                onPress={() => setEditType('credit')}
              >
                <Text style={{ color: editType === 'credit' ? '#FFFFFF' : '#A8C5B8', fontWeight: 'bold', fontSize: 12 }}>
                  🔴 ዱቤ
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeToggleBtn, editType === 'payment' && styles.typeToggleGreen]}
                onPress={() => setEditType('payment')}
              >
                <Text style={{ color: editType === 'payment' ? '#0E2417' : '#A8C5B8', fontWeight: 'bold', fontSize: 12 }}>
                  🟢 ክፍያ
                </Text>
              </TouchableOpacity>
            </View>

            {editingTransaction && (
              <>
                <Text style={styles.inputLabel}>የዕቃው ዓይነት / ማስታወሻ</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editItem}
                  onChangeText={setEditItem}
                  placeholder="ምሳሌ፡ ስኳር"
                  placeholderTextColor="#5A786A"
                />

                <Text style={styles.inputLabel}>መጠን (በ ETB)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editAmount}
                  onChangeText={setEditAmount}
                  keyboardType="numeric"
                  placeholder="ምሳሌ፡ 200"
                  placeholderTextColor="#5A786A"
                />

                {/* Delete transaction button */}
                <TouchableOpacity
                  style={styles.deleteTxBtn}
                  onPress={() => openDeleteTransaction(editingTransaction)}
                  disabled={saving}
                >
                  <Ionicons name="trash-outline" size={16} color="#FF4D4D" />
                  <Text style={styles.deleteTxBtnText}>🗑️ ግብይትን ሰርዝ</Text>
                </TouchableOpacity>

                <View style={styles.modalActionRow}>
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => {
                      setEditingTransaction(null);
                      setEditItem('');
                      setEditAmount('');
                      setEditType('credit');
                    }}
                  >
                    {/* FIX 3: Cancel = ተመለስ */}
                    <Text style={styles.cancelBtnText}>ተመለስ</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveBtn, { backgroundColor: logoGreen }]}
                    onPress={handleEditTransaction}
                    disabled={saving}
                  >
                    <Text style={styles.saveBtnText}>
                      {saving ? '...' : 'አስቀምጥ'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* DELETE TRANSACTION CONFIRMATION MODAL */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isDeleteTxConfirmVisible}
        onRequestClose={() => setIsDeleteTxConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ግብይትን መሰረዝ ያረጋግጡ</Text>
            <Text style={{ color: '#A8C5B8', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
              እርግጠኛ ነዎት ይህን ግብይት መሰረዝ ይፈልጋሉ? ይህ ሊመለስ አይችልም።
            </Text>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsDeleteTxConfirmVisible(false)}>
                <Text style={styles.cancelBtnText}>አይ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: alertRed }]}
                onPress={confirmDeleteTransaction}
                disabled={saving}
              >
                <Text style={[styles.saveBtnText, { color: '#FFFFFF' }]}>
                  {saving ? '...' : 'አዎ'}
                </Text>
              </TouchableOpacity>
            </View>
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
              placeholder="ምሳሌ፡ 0911223344"
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
                {/* FIX 3: Cancel = ተመለስ */}
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
  undoBanner: {
    backgroundColor: '#183424',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(39, 227, 101, 0.2)',
  },
  undoText: {
    color: '#A8C5B8',
    fontSize: 13,
  },
  undoBtn: {
    color: '#27E365',
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 6,
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
  sortBar: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#183424',
    borderRadius: 14,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(39, 227, 101, 0.2)',
  },
  sortPillText: {
    color: '#A8C5B8',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 6,
  },
  sortDropdown: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#183424',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  sortOption: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#0E2417',
  },
  sortOptionActive: {
    backgroundColor: 'rgba(39, 227, 101, 0.1)',
  },
  sortOptionText: {
    color: '#A8C5B8',
    fontSize: 13,
  },
  sortOptionTextActive: {
    color: '#27E365',
    fontWeight: 'bold',
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
    paddingTop: 6,
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

  // ===== SHARED MODAL STYLES =====
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
    marginBottom: 12,
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

  // ===== ERROR BANNER INSIDE MODALS =====
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

  // ===== DELETE TRANSACTION BUTTON =====
  deleteTxBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.2)',
  },
  deleteTxBtnText: {
    color: '#FF4D4D',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },

  // ===== PROFESSIONAL DETAIL MODAL STYLES =====
  detailModalContent: {
    backgroundColor: '#0E2417',
    borderRadius: 16,
    margin: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#254A35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailAvatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 20,
  },
  detailName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  detailPhone: {
    color: '#A8C5B8',
    fontSize: 12,
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: '#183424',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  balanceCardLabel: {
    color: '#A8C5B8',
    fontSize: 12,
    marginBottom: 4,
  },
  balanceCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  balanceCardSub: {
    color: '#5A786A',
    fontSize: 11,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  quickEntryCard: {
    backgroundColor: '#183424',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  quickEntryTitle: {
    color: '#27E365',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  quickToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0E2417',
    borderRadius: 8,
    padding: 3,
    marginBottom: 12,
  },
  quickToggle: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  quickToggleActiveRed: {
    backgroundColor: '#FF4D4D',
  },
  quickToggleActiveGreen: {
    backgroundColor: '#27E365',
  },
  quickToggleText: {
    color: '#A8C5B8',
    fontSize: 12,
    fontWeight: '600',
  },
  quickToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  quickInput: {
    backgroundColor: '#0E2417',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 10,
  },
  quickSaveBtn: {
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 2,
  },
  quickSaveBtnText: {
    color: '#0E2417',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // ===== EDIT TRANSACTION TOGGLE STYLES =====
  typeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0E2417',
    borderRadius: 8,
    padding: 3,
    marginBottom: 16,
  },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeToggleRed: {
    backgroundColor: '#FF4D4D',
  },
  typeToggleGreen: {
    backgroundColor: '#27E365',
  },
});