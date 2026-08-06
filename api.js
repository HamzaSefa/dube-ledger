import { supabase } from './supabase';

// ============================================
// DUBE DATABASE SERVICE LAYER
// Every screen uses these functions ONLY.
// No screen talks directly to Supabase.
// ============================================

// ============================================
// CUSTOMERS
// ============================================

export async function createCustomer(name, phone) {
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

export async function getCustomers() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function updateCustomer(id, updates) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // SECURITY: only update YOUR customers
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCustomer(id) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id); // SECURITY: only delete YOUR customers

  if (error) throw error;
  return true;
}

// ============================================
// TRANSACTIONS
// ============================================

export async function addTransaction(customerId, type, amount, item, note = '') {
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

export async function getTransactions(customerId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function updateTransaction(id, updates) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id) // SECURITY: only update YOUR transactions
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// BALANCE CALCULATION
// ============================================

export async function getCustomerBalance(customerId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data, error } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', user.id)
    .eq('customer_id', customerId);

  if (error) throw error;

  let balance = 0;
  (data || []).forEach((tx) => {
    if (tx.type === 'credit') {
      balance += tx.amount;
    } else if (tx.type === 'payment') {
      balance -= tx.amount;
    }
  });

  return balance;
}

// ============================================
// REPORTS / STATS
// ============================================

export async function getReportStats(period = 'today') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

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

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('type, amount, customer_id')
    .eq('user_id', user.id)
    .gte('created_at', startISO);

  if (error) throw error;

  let issuedCredit = 0;
  let collectedCash = 0;
  const debtorIds = new Set();

  (transactions || []).forEach((tx) => {
    if (tx.type === 'credit') {
      issuedCredit += tx.amount;
      debtorIds.add(tx.customer_id);
    } else if (tx.type === 'payment') {
      collectedCash += tx.amount;
    }
  });

  const { data: allTx, error: allError } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', user.id);

  if (allError) throw allError;

  let totalOutstanding = 0;
  (allTx || []).forEach((tx) => {
    if (tx.type === 'credit') totalOutstanding += tx.amount;
    else if (tx.type === 'payment') totalOutstanding -= tx.amount;
  });

  return {
    totalOutstanding,
    issuedCredit,
    collectedCash,
    activeDebtorsCount: debtorIds.size,
  };
}

export async function getTopDebtors(limit = 5) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not logged in');

  const { data: customers, error: custError } = await supabase
    .from('customers')
    .select('id, name, phone')
    .eq('user_id', user.id);

  if (custError) throw custError;

  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('customer_id, type, amount')
    .eq('user_id', user.id);

  if (txError) throw txError;

  const balances = {};
  (transactions || []).forEach((tx) => {
    if (!balances[tx.customer_id]) balances[tx.customer_id] = 0;
    if (tx.type === 'credit') balances[tx.customer_id] += tx.amount;
    else if (tx.type === 'payment') balances[tx.customer_id] -= tx.amount;
  });

  const debtors = (customers || [])
    .map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      balance: balances[c.id] || 0,
    }))
    .filter((c) => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, limit);

  return debtors;
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