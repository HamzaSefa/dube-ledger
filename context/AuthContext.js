import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import * as SecureStore from 'expo-secure-store';

// This creates a "brain" that remembers if the user is logged in.
// Any screen can ask: "Is someone logged in?" and get the answer instantly.
const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // When app opens: check if we already have a login session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for login/logout events anywhere in the app
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // SIGN UP: Create a new account
  const signUp = async (name, phone, password) => {
    // We turn the phone number into a fake email because Supabase Auth
    // requires an email. The user never sees this.
    const email = `${phone}@dube.app`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          shop_name: name,
          phone: phone,
        },
      },
    });
    
    if (error) throw error;
    return data;
  };

  // SIGN IN: Log in with existing account
  const signIn = async (phone, password) => {
    const email = `${phone}@dube.app`;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  };

  // SIGN OUT: Log out and clear session
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// This is a shortcut so any screen can just write: const { user, signIn } = useAuth();
export const useAuth = () => useContext(AuthContext);