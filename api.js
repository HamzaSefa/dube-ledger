import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { getSetting } from './settings';

// ============================================
// DUBE OFFLINE-FIRST DATABASE SERVICE LAYER
// ============================================

const KEYS = {
  CUSTOMERS: 'dube_customers',
  TRANSACTIONS: 'dube_transactions',
  PENDING_SYNC: 'dube_pending_sync',
};

// ============================================
// LOCAL STORAGE HELPERS
// ============================================
async function getLocal(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function setLocal(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.log('AsyncStorage error:', err.message);
  }
}

async function getPendingSync() {
  const data = await getLocal(KEYS.PENDING_SYNC);
  return data || [];
}

async function setPendingSync(queue) {
  await setLocal(KEYS.PENDING_SYNC, queue);
}

// ============================================
// CONNECTION CHECK
// ============================================
async function checkOnline() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

// ============================================
// GLOBAL SYNC LOCK
// Only ONE sync runs at a time. Everyone else waits.
// ============================================
let syncPromise = null;

async function performFullSync(force = false) {
  // If sync is already running, wait for it
  if (syncPromise) {
    return await syncPromise;
  }

  // Start a new sync
  syncPromise = (async () => {
    try {
      // If autoSync is OFF and this is not a forced sync, skip
      if (!force) {
        const autoSync = await getSetting('autoSync', true);
        if (!autoSync) return { synced: 0, skipped: true };
      }

      const online = await checkOnline();
      if (!online) return { synced: 0 };

      // Step 1: Send all pending items to Supabase
      const syncResult = await runSyncQueue();

      // Step 2: Fetch fresh data from Supabase and update local
      await refreshFromSupabase();

      return syncResult;
    } finally {
      syncPromise = null;
    }
  })();

  return await syncPromise;
}

// ============================================
// STEP 1: SEND PENDING ITEMS TO SUPABASE
// ============================================
async function runSyncQueue() {
  let queue = await getPendingSync();
  if (queue.length === 0) return { synced: 0 };

  let syncedCount = 0;
  const failedQueue = [];

  // Track localId → realId for customers (so transactions can update)
  const customerIdMap = {};

  for (const item of queue) {
    try {
      // Update customerId in transaction data if customer was already synced in this batch
      if (item.table === 'transactions' && customerIdMap[item.data.customerId]) {
        item.data.customerId = customerIdMap[item.data.customerId];
      }

      if (item.table === 'customers') {
        const remote = await createCustomerRemote(item.data.name, item.data.phone);
        // Remember: local_123 → real-uuid-456
        customerIdMap[item.localId] = remote.id;
        // Replace local temp item with real one
        await replaceLocalItem(KEYS.CUSTOMERS, item.localId, remote);
        syncedCount++;
      }
      else if (item.table === 'transactions') {
        // Skip if customer still has local_ id (not synced yet)
        if (String(item.data.customerId).startsWith('local_')) {
          failedQueue.push(item);
          continue;
        }
        const remote = await addTransactionRemote(
          item.data.customerId,
          item.data.type,
          item.data.amount,
          item.data.item,
          item.data.note
        );
        await replaceLocalItem(KEYS.TRANSACTIONS, item.localId, remote);
        syncedCount++;
      }
    } catch (err) {
      console.log('Sync failed for', item.localId, err.message);
      failedQueue.push(item);
    }
  }

  // Save failed items back to queue
  await setPendingSync(failedQueue);

  return { synced: syncedCount, remaining: failedQueue.length };
}

// Replace a local temp item with the real remote item
async function replaceLocalItem(key, localId, remoteItem) {
  const localData = (await getLocal(key)) || [];
  const updated = localData.map((item) =>
    item.id === localId ? { ...remoteItem, _pending: false } : item
  );
  await setLocal(key, updated);
}

// ============================================
// STEP 2: FETCH FRESH DATA FROM SUPABASE
// ============================================
async function refreshFromSupabase() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch remote data
    const [{ data: remoteCustomers }, { data: remoteTransactions }] = await Promise.all([
      supabase.from('customers').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);

    // Get items that are STILL pending (failed syncs or newly created offline)
    const queue = await getPendingSync();
    const pendingLocalIds = new Set(queue.map((q) => q.localId));

    // Get current local data
    const localCustomers = (await getLocal(KEYS.CUSTOMERS)) || [];
    const localTransactions = (await getLocal(KEYS.TRANSACTIONS)) || [];

    // Keep only items that are still pending (have local_ id and are in queue)
    const stillPendingCustomers = localCustomers.filter(
      (c) => String(c.id).startsWith('local_') && pendingLocalIds.has(c.id)
    );
    const stillPendingTransactions = localTransactions.filter(
      (t) => String(t.id).startsWith('local_') && pendingLocalIds.has(t.id)
    );

    // Merge: remote data + still-pending local data
    // Also deduplicate by ID just in case
    const customerMap = new Map();
    (remoteCustomers || []).forEach((c) => customerMap.set(c.id, c));
    stillPendingCustomers.forEach((c) => customerMap.set(c.id, c));

    const transactionMap = new Map();
    (remoteTransactions || []).forEach((t) => transactionMap.set(t.id, t));
    stillPendingTransactions.forEach((t) => transactionMap.set(t.id, t));

    await setLocal(KEYS.CUSTOMERS, Array.from(customerMap.values()));
    await setLocal(KEYS.TRANSACTIONS, Array.from(transactionMap.values()));
  } catch (err) {
    console.log('Refresh error:', err.message);
  }
}

// ============================================
// CUSTOMERS
// ============================================

async function createCustomerRemote(name, phone) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('customers')
    .insert([{ user_id: user.id, name, phone }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createCustomer(name, phone) {
  const localId = 'local_' + Date.now();
  const newCustomer = {
    id: localId,
    user_id: 'local',
    name,
    phone,
    created_at: new Date().toISOString(),
    _pending: true,
  };

  // Save locally FIRST (instant)
  const localCustomers = (await getLocal(KEYS.CUSTOMERS)) || [];
  localCustomers.unshift(newCustomer);
  await setLocal(KEYS.CUSTOMERS, localCustomers);

  // Queue for sync
  const queue = await getPendingSync();
  queue.push({ localId, table: 'customers', data: { name, phone } });
  await setPendingSync(queue);

  // Try background sync
  performFullSync().catch(() => {});

  return newCustomer;
}

export async function getCustomers() {
  // Always return local data immediately (works offline)
  let localData = (await getLocal(KEYS.CUSTOMERS)) || [];

  // Background sync (locked — only one runs at a time)
  try {
    const online = await checkOnline();
    if (online) {
      await performFullSync();
      localData = (await getLocal(KEYS.CUSTOMERS)) || [];
    }
  } catch (err) {
    console.log('Sync failed, using local:', err.message);
  }

  return localData;
}

export async function updateCustomer(id, updates) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  const localData = (await getLocal(KEYS.CUSTOMERS)) || [];
  const updated = localData.map((c) => (c.id === id ? { ...c, ...updates } : c));
  await setLocal(KEYS.CUSTOMERS, updated);

  return data;
}

export async function deleteCustomer(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;

  const localData = (await getLocal(KEYS.CUSTOMERS)) || [];
  await setLocal(KEYS.CUSTOMERS, localData.filter((c) => c.id !== id));

  // Remove from pending queue too
  const queue = await getPendingSync();
  await setPendingSync(queue.filter((q) => !(q.table === 'customers' && q.localId === id)));

  return true;
}

// ============================================
// TRANSACTIONS
// ============================================

async function addTransactionRemote(customerId, type, amount, item, note = '') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error('Amount must be a positive number');
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      user_id: user.id,
      customer_id: customerId,
      type,
      amount: numericAmount,
      item,
      note,
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addTransaction(customerId, type, amount, item, note = '') {
  const localId = 'local_' + Date.now();
  const newTx = {
    id: localId,
    user_id: 'local',
    customer_id: customerId,
    type,
    amount: parseFloat(amount),
    item: item || (type === 'credit' ? 'ዱቤ' : 'ክፍያ'),
    note,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    _pending: true,
  };

  // Save locally FIRST (instant)
  const localTx = (await getLocal(KEYS.TRANSACTIONS)) || [];
  localTx.unshift(newTx);
  await setLocal(KEYS.TRANSACTIONS, localTx);

  // Queue for sync
  const queue = await getPendingSync();
  queue.push({
    localId,
    table: 'transactions',
    data: { customerId, type, amount, item, note },
  });
  await setPendingSync(queue);

  // Try background sync
  performFullSync().catch(() => {});

  return newTx;
}

export async function getTransactions(customerId) {
  let localData = (await getLocal(KEYS.TRANSACTIONS)) || [];

  // Background sync (locked — only one runs at a time)
  try {
    const online = await checkOnline();
    if (online) {
      await performFullSync();
      localData = (await getLocal(KEYS.TRANSACTIONS)) || [];
    }
  } catch (err) {
    console.log('Sync failed, using local:', err.message);
  }

  if (customerId) {
    localData = localData.filter((t) => t.customer_id === customerId);
  }

  return localData;
}

export async function updateTransaction(id, updates) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const payload = { ...updates, updated_at: new Date().toISOString() };

  const { data, error } = await supabase
    .from('transactions')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  const localData = (await getLocal(KEYS.TRANSACTIONS)) || [];
  const updated = localData.map((t) => (t.id === id ? { ...t, ...payload } : t));
  await setLocal(KEYS.TRANSACTIONS, updated);

  return data;
}

export async function deleteTransaction(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;

  const localData = (await getLocal(KEYS.TRANSACTIONS)) || [];
  await setLocal(KEYS.TRANSACTIONS, localData.filter((t) => t.id !== id));

  const queue = await getPendingSync();
  await setPendingSync(queue.filter((q) => !(q.table === 'transactions' && q.localId === id)));

  return true;
}

// ============================================
// BALANCE & REPORTS (works offline)
// ============================================

export async function getCustomerBalance(customerId) {
  const transactions = await getTransactions();
  return transactions
    .filter((t) => t.customer_id === customerId)
    .reduce((sum, t) => {
      if (t.type === 'credit') return sum + Number(t.amount);
      if (t.type === 'payment') return sum - Number(t.amount);
      return sum;
    }, 0);
}

export async function getReportStats(period = 'today') {
  const transactions = await getTransactions();
  const customers = await getCustomers();
  const now = new Date();
  let startDate;

  if (period === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const startISO = startDate.toISOString();
  let issuedCredit = 0;
  let collectedCash = 0;
  const periodCreditCustomers = new Set();
  const periodPaymentCustomers = new Set();

  // Period-specific numbers
  transactions.forEach((tx) => {
    if (tx.created_at >= startISO) {
      if (tx.type === 'credit') {
        issuedCredit += Number(tx.amount);
        periodCreditCustomers.add(tx.customer_id);
      } else if (tx.type === 'payment') {
        collectedCash += Number(tx.amount);
        periodPaymentCustomers.add(tx.customer_id);
      }
    }
  });

  // ALL-TIME total outstanding (never changes with period)
  let totalOutstanding = 0;
  transactions.forEach((tx) => {
    if (tx.type === 'credit') totalOutstanding += Number(tx.amount);
    else if (tx.type === 'payment') totalOutstanding -= Number(tx.amount);
  });

  // ALL-TIME count of customers with positive balance (real debtors)
  const balances = {};
  transactions.forEach((tx) => {
    if (!balances[tx.customer_id]) balances[tx.customer_id] = 0;
    if (tx.type === 'credit') balances[tx.customer_id] += Number(tx.amount);
    else if (tx.type === 'payment') balances[tx.customer_id] -= Number(tx.amount);
  });
  
  const totalActiveDebtors = customers.filter(c => (balances[c.id] || 0) > 0).length;

  return { 
    totalOutstanding, 
    totalActiveDebtors,
    issuedCredit, 
    issuedCreditCustomers: periodCreditCustomers.size,
    collectedCash, 
    collectedCashCustomers: periodPaymentCustomers.size,
  };
}

export async function getTopDebtors(limit = 5) {
  const customers = await getCustomers();
  const transactions = await getTransactions();

  const balances = {};
  transactions.forEach((tx) => {
    if (!balances[tx.customer_id]) balances[tx.customer_id] = 0;
    if (tx.type === 'credit') balances[tx.customer_id] += Number(tx.amount);
    else if (tx.type === 'payment') balances[tx.customer_id] -= Number(tx.amount);
  });

  return customers
    .map((c) => ({ id: c.id, name: c.name, phone: c.phone, balance: balances[c.id] || 0 }))
    .filter((c) => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);
}

// ============================================
// PROFILE
// ============================================

export async function getProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateProfile(updates) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// FORCE SYNC (manual override for "Sync Now" button)
// ============================================
export async function forceSync() {
  return await performFullSync(true);
}