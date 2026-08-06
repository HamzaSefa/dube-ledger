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

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const logoGreen = '#27E365';
  const mutedTextColor = '#A8C5B8';

  const handleLogin = async () => {
    // Basic validation
    if (!phone.trim() || !password) {
      setError('ስልክ ቁጥር እና የይለፍ ቃል ያስፈልጋል');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(phone.trim(), password);
      // If successful, AuthContext updates → App.js shows MainApp automatically
    } catch (err) {
      setError('ስልክ ቁጥር ወይም የይለፍ ቃል ተሳስተዋል');
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
          <Text style={styles.formTitle}>ይግቡ (Log In)</Text>
          
          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
          
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

          <TouchableOpacity style={styles.forgotPasswordLink}>
            <Text style={[styles.forgotPasswordText, { color: mutedTextColor }]}>
              የይለፍ ቃል ረስተዋል? (Forgot Password?)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: logoGreen }]} 
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#0E2417" />
            ) : (
              <Text style={styles.buttonText}>ይግቡ</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.signUpLink}
            onPress={() => navigation.navigate('SignUp')}
            disabled={loading}
          >
            <Text style={[styles.signUpLinkText, { color: mutedTextColor }]}>
              አካውንት የለዎትም? ይመዝገቡ (Sign Up)
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
  forgotPasswordLink: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
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
  signUpLink: {
    marginTop: 18,
    alignItems: 'center',
  },
  signUpLinkText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});