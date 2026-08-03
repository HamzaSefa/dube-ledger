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
} from 'react-native';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const logoGreen = '#27E365';
  const mutedTextColor = '#A8C5B8';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0E2417" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
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

        {/* Form Section */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>ይግቡ (Log In)</Text>
          
          <TextInput
            style={styles.input}
            placeholder="ስልክ ቁጥር (Phone Number)"
            placeholderTextColor="#5A786A"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="የይለፍ ቃል (Password)"
            placeholderTextColor="#5A786A"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Forgot Password Link (Telegram Bot Flow) */}
          <TouchableOpacity style={styles.forgotPasswordLink}>
            <Text style={[styles.forgotPasswordText, { color: mutedTextColor }]}>
              የይለፍ ቃል ረስተዋል? (Forgot Password?)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, { backgroundColor: logoGreen }]}>
            <Text style={styles.buttonText}>ይግቡ</Text>
          </TouchableOpacity>
          
          {/* Link back to Sign Up */}
          <TouchableOpacity style={styles.signUpLink}>
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