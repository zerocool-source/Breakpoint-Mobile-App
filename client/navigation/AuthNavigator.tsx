import React, { useState } from 'react';

import SplashScreen from '@/screens/SplashScreen';
import RoleSelectionScreen, { Role } from '@/screens/RoleSelectionScreen';
import LoginScreen from '@/screens/LoginScreen';
import RootStackNavigator from '@/navigation/RootStackNavigator';
import ServiceTechStackNavigator from '@/navigation/ServiceTechStackNavigator';
import SupervisorStackNavigator from '@/navigation/SupervisorStackNavigator';
import { useAuth } from '@/context/AuthContext';

export default function AuthNavigator() {
  const { isAuthenticated, selectedRole, setSelectedRole } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const handleRoleSelect = (role: Role) => {
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

  // Route to the appropriate app based on role
  if (selectedRole === 'service_tech') {
    return <ServiceTechStackNavigator />;
  }

  if (selectedRole === 'supervisor') {
    return <SupervisorStackNavigator />;
  }

  // Repair Tech and other roles use the default navigator
  return <RootStackNavigator />;
}
