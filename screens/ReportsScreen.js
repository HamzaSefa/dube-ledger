import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { getReportStats, getTopDebtors, getTransactions } from '../api';

export default function ReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Real data states
  const [stats, setStats] = useState({
    totalOutstanding: 0,
    issuedCredit: 0,
    collectedCash: 0,
    activeDebtorsCount: 0,
  });
  const [topDebtors, setTopDebtors] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const logoGreen = '#27E365';
  const alertRed = '#FF4D4D';
  const pageBackgroundColor = '#0E2417';

  // ============================================
  // LOAD REAL DATA
  // ============================================
  const fetchData = useCallback(async () => {
    try {
      setError('');
      const [statsData, debtorsData, allTransactions] = await Promise.all([
        getReportStats(selectedPeriod),
        getTopDebtors(5),
        getTransactions(),
      ]);

      setStats(statsData);
      setTopDebtors(debtorsData);

      // Get last 10 transactions for activity feed
      const last10 = allTransactions.slice(0, 10).map((tx) => ({
        id: tx.id,
        customerId: tx.customer_id,
        customerName: tx.customer_name || 'ደንበኛ',
        item: tx.item || (tx.type === 'credit' ? 'ዱቤ' : 'ክፍያ'),
        amount: Number(tx.amount),
        type: tx.type,
        created_at: tx.created_at,
      }));
      setRecentActivity(last10);
    } catch (err) {
      setError('መረጃ መጫን አልተሳካም');
      console.log('Reports fetch error:', err.message);
    }
  }, [selectedPeriod]);

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
  const formatAmount = (amount) => {
    return amount.toLocaleString() + ' ETB';
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'አሁን';
    if (diffMins < 60) return `ከ ${diffMins} ደቂቃ በፊት`;
    if (diffHours < 24) return `ከ ${diffHours} ሰዓት በፊት`;
    if (diffDays < 7) return `ከ ${diffDays} ቀን በፊት`;
    return date.toLocaleDateString('am-ET', { month: 'short', day: 'numeric' });
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
          <Text style={styles.headerTitle}>የሂሳብ ሪፖርት</Text>
        </View>
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

      <ScrollView
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={logoGreen} />
        }
      >
        {/* Period Selector Tabs */}
        <View style={styles.periodContainer}>
          <TouchableOpacity
            style={[styles.periodTab, selectedPeriod === 'today' ? styles.activePeriodTab : null]}
            onPress={() => setSelectedPeriod('today')}
          >
            <Text style={[styles.periodTabText, selectedPeriod === 'today' ? styles.activePeriodText : null]}>
              ዛሬ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.periodTab, selectedPeriod === 'week' ? styles.activePeriodTab : null]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[styles.periodTabText, selectedPeriod === 'week' ? styles.activePeriodText : null]}>
              በዚህ ሳምንት
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.periodTab, selectedPeriod === 'month' ? styles.activePeriodTab : null]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[styles.periodTabText, selectedPeriod === 'month' ? styles.activePeriodText : null]}>
              በዚህ ወር
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={logoGreen} />
            <Text style={styles.loadingText}>መረጃ በመጫን ላይ...</Text>
          </View>
        ) : (
          <>
            {/* Main Stats Summary Section */}
            <View style={styles.statsContainer}>
              {/* Main Total Unpaid Card */}
              <View style={styles.mainStatCard}>
                <Text style={styles.mainStatLabel}>ጠቅላላ ያልተከፈለ ዱቤ (Total Credit)</Text>
                <Text style={styles.mainStatValue}>{formatAmount(stats.totalOutstanding)}</Text>
                <Text style={styles.mainStatSubtext}>ከ {stats.activeDebtorsCount} ደንበኞች የሚጠበቅ</Text>
              </View>

              {/* Breakdown Grid */}
              <View style={styles.statGrid}>
                <View style={styles.gridCard}>
                  <Text style={styles.gridLabel}>የተሰጠ ዱቤ</Text>
                  <Text style={[styles.gridValue, { color: alertRed }]}>+{formatAmount(stats.issuedCredit)}</Text>
                </View>

                <View style={styles.gridCard}>
                  <Text style={styles.gridLabel}>የተሰበሰበ ክፍያ</Text>
                  <Text style={[styles.gridValue, { color: logoGreen }]}>-{formatAmount(stats.collectedCash)}</Text>
                </View>
              </View>
            </View>

            {/* Top Debtors Section */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>ከፍተኛ የዱቤ ባለዕዳዎች (Top Debtors)</Text>
              {topDebtors.length === 0 ? (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>ምንም ዕዳ አልተገኘም</Text>
                </View>
              ) : (
                topDebtors.map((debtor, index) => (
                  <View key={debtor.id} style={styles.debtorRow}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.debtorName}>{debtor.name}</Text>
                      <Text style={styles.debtorPhone}>{debtor.phone || '---'}</Text>
                    </View>

                    <Text style={styles.debtorAmount}>{formatAmount(debtor.balance)}</Text>
                  </View>
                ))
              )}
            </View>

            {/* Audit Log / Recent Transactions */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>የቅርብ ጊዜ እንቅስቃሴዎች (Recent Activity)</Text>
              {recentActivity.length === 0 ? (
                <View style={styles.emptySection}>
                  <Text style={styles.emptySectionText}>ምንም እንቅስቃሴ አልተገኘም</Text>
                </View>
              ) : (
                recentActivity.map((act) => (
                  <View key={act.id} style={styles.activityRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.actCustomer}>{act.customerName}</Text>
                      <Text style={styles.actItem}>{act.item} • {formatDate(act.created_at)}</Text>
                    </View>

                    <Text style={{ color: act.type === 'credit' ? alertRed : logoGreen, fontWeight: 'bold', fontSize: 13 }}>
                      {act.type === 'credit' ? '+' : '-'}{formatAmount(act.amount)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
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
  centerBox: {
    paddingVertical: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#A8C5B8',
    marginTop: 10,
    fontSize: 13,
  },
  periodContainer: {
    flexDirection: 'row',
    backgroundColor: '#183424',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 3,
    marginVertical: 10,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activePeriodTab: {
    backgroundColor: '#27E365',
  },
  periodTabText: {
    color: '#A8C5B8',
    fontSize: 12,
    fontWeight: '600',
  },
  activePeriodText: {
    color: '#0E2417',
    fontWeight: 'bold',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  mainStatCard: {
    backgroundColor: '#183424',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  mainStatLabel: {
    color: '#A8C5B8',
    fontSize: 12,
    marginBottom: 4,
  },
  mainStatValue: {
    color: '#FF4D4D',
    fontSize: 28,
    fontWeight: 'bold',
  },
  mainStatSubtext: {
    color: '#5A786A',
    fontSize: 11,
    marginTop: 4,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#183424',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  gridLabel: {
    color: '#A8C5B8',
    fontSize: 11,
    marginBottom: 4,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySection: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  emptySectionText: {
    color: '#5A786A',
    fontSize: 13,
  },
  debtorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 6,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#254A35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  rankText: {
    color: '#27E365',
    fontWeight: 'bold',
    fontSize: 11,
  },
  debtorName: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  debtorPhone: {
    color: '#5A786A',
    fontSize: 10,
  },
  debtorAmount: {
    color: '#FF4D4D',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#183424',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
  },
  actCustomer: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  actItem: {
    color: '#A8C5B8',
    fontSize: 10,
  },
});