import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';

import SupervisorHomeScreen from '@/screens/Supervisor/HomeScreen';
import SupervisorActivityScreen from '@/screens/Supervisor/ActivityScreen';
import SupervisorAssignScreen from '@/screens/Supervisor/AssignScreen';
import SupervisorProfileScreen from '@/screens/Supervisor/ProfileScreen';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, Spacing } from '@/constants/theme';

const Tab = createBottomTabNavigator();

export default function SupervisorTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.azureBlue,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingTop: Spacing.sm,
          paddingBottom: Platform.OS === 'web' ? Spacing.md : Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
          height: Platform.OS === 'web' ? 70 : Platform.OS === 'ios' ? 88 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={SupervisorHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={SupervisorActivityScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="activity" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Assign"
        component={SupervisorAssignScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="clipboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={SupervisorProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
