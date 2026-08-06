import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthStack, AppStack } from './navigation/AppNavigator';

// This component decides: Show Login screens OR Show the main app?
function RootNavigator() {
  const { user, loading } = useAuth();
  
  // While checking if user is logged in, show nothing (or we could add a splash screen later)
  if (loading) {
    return null;
  }
  
  // If user exists → show the app. If not → show Login/SignUp.
  return user ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}