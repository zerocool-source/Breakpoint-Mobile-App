import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';

import ForemanHomeScreen from '@/screens/RepairForeman/ForemanHomeScreen';
import DraftsScreen from '@/screens/RepairForeman/DraftsScreen';
import CustomersScreen from '@/screens/RepairForeman/CustomersScreen';
import ProductsScreen from '@/screens/RepairTech/ProductsScreen';
import ProfileScreen from '@/screens/RepairTech/ProfileScreen';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, Spacing } from '@/constants/theme';

const Tab = createBottomTabNavigator();

export default function RepairForemanTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.backgroundRoot,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '600',
        },
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          paddingTop: Spacing.xs,
          paddingBottom: Platform.OS === 'ios' ? 20 : Spacing.sm,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        tabBarActiveTintColor: BrandColors.vividTangerine,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={ForemanHomeScreen}
        options={{
          headerTitle: 'Foreman Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Drafts"
        component={DraftsScreen}
        options={{
          headerTitle: 'Draft Estimates',
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Customers"
        component={CustomersScreen}
        options={{
          headerTitle: 'Customers',
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          headerTitle: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Feather name="package" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerTitle: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
