import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/HomeScreen';
import CustomersScreen from '../screens/CustomersScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

export default function MainApp() {
  const [currentScreen, setCurrentScreen] = useState('home');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onOpenSettings={() => setCurrentScreen('settings')} />;
      case 'customers':
        return <CustomersScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen onBack={() => setCurrentScreen('home')} />;
      default:
        return <HomeScreen onOpenSettings={() => setCurrentScreen('settings')} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>{renderScreen()}</View>

      {currentScreen !== 'settings' && (
        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('home')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentScreen === 'home' ? 'document-text' : 'document-text-outline'}
              size={22}
              color={currentScreen === 'home' ? '#27E365' : '#A8C5B8'}
            />
            <Text
              style={[
                styles.navText,
                currentScreen === 'home' && styles.activeNavText,
              ]}
            >
              መዝገብ
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('customers')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentScreen === 'customers' ? 'people' : 'people-outline'}
              size={22}
              color={currentScreen === 'customers' ? '#27E365' : '#A8C5B8'}
            />
            <Text
              style={[
                styles.navText,
                currentScreen === 'customers' && styles.activeNavText,
              ]}
            >
              ደንበኞች
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('reports')}
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentScreen === 'reports' ? 'bar-chart' : 'bar-chart-outline'}
              size={22}
              color={currentScreen === 'reports' ? '#27E365' : '#A8C5B8'}
            />
            <Text
              style={[
                styles.navText,
                currentScreen === 'reports' && styles.activeNavText,
              ]}
            >
              ሪፖርት
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E2417',
  },
  content: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    height: 62,
    backgroundColor: '#09180F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navText: {
    fontSize: 11,
    color: '#A8C5B8',
    marginTop: 3,
    fontWeight: '500',
  },
  activeNavText: {
    color: '#27E365',
    fontWeight: 'bold',
  },
});