import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import SplashScreen from '@/screens/SplashScreen';
import LoginScreen from '@/screens/LoginScreen';
import RootStackNavigator from '@/navigation/RootStackNavigator';
import { useAuth } from '@/context/AuthContext';

export default function AuthNavigator() {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!isLoading && !showSplash) {
      return;
    }
  }, [isLoading, showSplash]);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <RootStackNavigator />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
