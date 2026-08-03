import React, { useState } from 'react';
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
} from 'react-native';

export default function ReportsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // 'today', 'week', 'month'

  const logoGreen = '#27E365';
  const alertRed = '#FF4D4D';
  const pageBackgroundColor = '#0E2417';

  // Sample Aggregated Data
  const reportStats = {
    today: {
      totalOutstanding: '5,050 ETB',
      issuedCredit: '850 ETB',
      collectedCash: '500 ETB',
      activeDebtorsCount: 3,
    },
    week: {
      totalOutstanding: '5,050 ETB',
      issuedCredit: '3,400 ETB',
      collectedCash: '2,100 ETB',
      activeDebtorsCount: 5,
    },
    month: {
      totalOutstanding: '5,050 ETB',
      issuedCredit: '12,800 ETB',
      collectedCash: '9,500 ETB',
      activeDebtorsCount: 8,
    },
  };

  const topDebtors = [
    { id: '1', name: 'Dawit Germa', amount: '2,300 ETB', phone: '0944556677' },
    { id: '2', name: 'Biruk Desta', amount: '1,900 ETB', phone: '0933445566' },
    { id: '3', name: 'Sara Kassa', amount: '850 ETB', phone: '0922334455' },
  ];

  const recentActivity = [
    { id: 'a1', customer: 'Abebe Kebede', item: 'ስኳር (2 ኪሎ)', amount: '200 ETB', type: 'credit', time: 'ከ 10 ደቂቃ በፊት' },
    { id: 'a2', customer: 'Dawit Germa', item: 'ክፍያ', amount: '500 ETB', type: 'payment', time: 'ከ 1 ሰዓት በፊት' },
    { id: 'a3', customer: 'Sara Kassa', item: 'ዘይት (1 ሊትር)', amount: '650 ETB', type: 'credit', time: 'ከ 3 ሰዓት በፊት' },
  ];

  const currentStats = reportStats[selectedPeriod];

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

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
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

        {/* Main Stats Summary Section */}
        <View style={styles.statsContainer}>
          {/* Main Total Unpaid Card */}
          <View style={styles.mainStatCard}>
            <Text style={styles.mainStatLabel}>ጠቅላላ ያልተከፈለ ዱቤ (Total Credit)</Text>
            <Text style={styles.mainStatValue}>{currentStats.totalOutstanding}</Text>
            <Text style={styles.mainStatSubtext}>ከ {currentStats.activeDebtorsCount} ደንበኞች የሚጠበቅ</Text>
          </View>

          {/* Breakdown Grid */}
          <View style={styles.statGrid}>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>የተሰጠ ዱቤ</Text>
              <Text style={[styles.gridValue, { color: alertRed }]}>+{currentStats.issuedCredit}</Text>
            </View>

            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>የተሰበሰበ ክፍያ</Text>
              <Text style={[styles.gridValue, { color: logoGreen }]}>-{currentStats.collectedCash}</Text>
            </View>
          </View>
        </View>

        {/* Top Debtors Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>ከፍተኛ የዱቤ ባለዕዳዎች (Top Debtors)</Text>
          {topDebtors.map((debtor, index) => (
            <View key={debtor.id} style={styles.debtorRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.debtorName}>{debtor.name}</Text>
                <Text style={styles.debtorPhone}>{debtor.phone}</Text>
              </View>

              <Text style={styles.debtorAmount}>{debtor.amount}</Text>
            </View>
          ))}
        </View>

        {/* Audit Log / Recent Transactions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>የቅርብ ጊዜ እንቅስቃሴዎች (Recent Audit Log)</Text>
          {recentActivity.map((act) => (
            <View key={act.id} style={styles.activityRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.actCustomer}>{act.customer}</Text>
                <Text style={styles.actItem}>{act.item} • {act.time}</Text>
              </View>

              <Text style={{ color: act.type === 'credit' ? alertRed : logoGreen, fontWeight: 'bold', fontSize: 13 }}>
                {act.type === 'credit' ? '+' : '-'}{act.amount}
              </Text>
            </View>
          ))}
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