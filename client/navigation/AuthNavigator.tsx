import React, { useState } from 'react';

import SplashScreen from '@/screens/SplashScreen';
import RoleSelectionScreen from '@/screens/RoleSelectionScreen';
import LoginScreen from '@/screens/LoginScreen';
import RootStackNavigator from '@/navigation/RootStackNavigator';
import { useAuth, UserRole } from '@/context/AuthContext';

export default function AuthNavigator() {
  const { isAuthenticated, selectedRole, setSelectedRole } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleBackToRoleSelection = () => {
    setSelectedRole(null);
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!selectedRole) {
    return <RoleSelectionScreen onSelectRole={handleRoleSelect} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onBack={handleBackToRoleSelection} />;
  }

  return <RootStackNavigator />;
}
