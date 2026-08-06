import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SignUpScreen({ navigation }) {
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const logoGreen = '#27E365';
  const mutedTextColor = '#A8C5B8';

  const handleSignUp = async () => {
    // Validation
    if (!name.trim() || !phone.trim() || !password) {
      setError('ሁሉንም ቦታዎች ይሙሉ');
      return;
    }

    if (password !== confirmPassword) {
      setError('የይለፍ ቃሎች አይዛመዱም');
      return;
    }

    if (password.length < 6) {
      setError('የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signUp(name.trim(), phone.trim(), password);
      // On success, user is automatically logged in
      // AuthContext updates → App.js shows MainApp
    } catch (err) {
      setError(err.message || 'መመዝገብ አልተሳካም። እባክዎ እንደገና ይሞክሩ።');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0E2417" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Image 
              source={require('../assets/dube_logo_circle.jpg')} 
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
          
          <Text style={[styles.subtitle, { color: mutedTextColor }]}>
            ለሱቅዎ የታመነ ዲጂታል ደብተር
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.formTitle}>ይመዝገቡ (Sign Up)</Text>
          
          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
          <TextInput
            style={styles.input}
            placeholder="ሙሉ ስም (Full Name)"
            placeholderTextColor="#5A786A"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError('');
            }}
            autoCapitalize="words"
            editable={!loading}
          />
          
          <TextInput
            style={styles.input}
            placeholder="ስልክ ቁጥር (Phone Number)"
            placeholderTextColor="#5A786A"
            value={phone}
            onChangeText={(text) => {
              setPhone(text);
              setError('');
            }}
            keyboardType="phone-pad"
            editable={!loading}
          />
          
          <TextInput
            style={styles.input}
            placeholder="የይለፍ ቃል (Password)"
            placeholderTextColor="#5A786A"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            placeholder="የይለፍ ቃል ያረጋግጡ (Confirm Password)"
            placeholderTextColor="#5A786A"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              setError('');
            }}
            editable={!loading}
          />
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: logoGreen }]} 
            onPress={handleSignUp}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0E2417" />
            ) : (
              <Text style={styles.buttonText}>ተመዝገብ</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={[styles.loginLinkText, { color: mutedTextColor }]}>
              አካውንት አለዎት? ይግቡ
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E2417',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  formTitle: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 18,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
  },
  errorText: {
    color: '#FF4D4D',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#0E2417',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 14,
    fontWeight: '500',
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: '#0E2417',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});