import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';

import ServiceTechHomeScreen from '@/screens/ServiceTech/HomeScreen';
import ServiceTechChatChannelsWrapper from '@/screens/ServiceTech/ChatChannelsWrapper';
import ProfileScreen from '@/screens/ServiceTech/ProfileScreen';
import TruckScreen from '@/screens/ServiceTech/TruckScreen';
import EmergencyScreen from '@/screens/ServiceTech/EmergencyScreen';
import RoadToSuccessScreen from '@/screens/ServiceTech/RoadToSuccessScreen';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, Spacing, BorderRadius } from '@/constants/theme';

const Tab = createBottomTabNavigator();

export default function ServiceTechTabNavigator() {
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
        name="Home"
        component={ServiceTechHomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Emergency"
        component={EmergencyScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="alert-triangle" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ServiceTechChatChannelsWrapper}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="message-square" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Training"
        component={RoadToSuccessScreen}
        options={{
          tabBarLabel: 'Training',
          tabBarIcon: ({ color, size }) => (
            <Feather name="award" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Truck"
        component={TruckScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="truck" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
