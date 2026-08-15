import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = 'dube_settings';

// Read a setting (like autoSync). If never set, returns defaultValue.
export async function getSetting(key, defaultValue = true) {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    return settings[key] !== undefined ? settings[key] : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Save a setting to the phone
export async function setSetting(key, value) {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    settings[key] = value;
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.log('Settings save error:', err.message);
  }
}