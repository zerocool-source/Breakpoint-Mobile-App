import React, { useState } from 'react';

import SplashScreen from '@/screens/SplashScreen';
import RoleSelectionScreen from '@/screens/RoleSelectionScreen';
import RootStackNavigator from '@/navigation/RootStackNavigator';
import { useAuth } from '@/context/AuthContext';

type Role = 'service_tech' | 'supervisor' | 'repair_tech' | 'repair_foreman';

export default function AuthNavigator() {
  const { isAuthenticated, login } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleRoleSelect = async (role: Role) => {
    setSelectedRole(role);
    await login('demo@breakpoint.com', 'demo123');
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!isAuthenticated) {
    return <RoleSelectionScreen onSelectRole={handleRoleSelect} />;
  }

  return <RootStackNavigator />;
}
