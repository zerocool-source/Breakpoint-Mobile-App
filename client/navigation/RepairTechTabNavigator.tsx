import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

import HomeScreen from '@/screens/RepairTech/HomeScreen';
import QueueScreen from '@/screens/RepairTech/QueueScreen';
import EstimatesScreen from '@/screens/RepairTech/EstimatesScreen';
import JobsScreen from '@/screens/RepairTech/JobsScreen';
import ProductsScreen from '@/screens/RepairTech/ProductsScreen';
import ProfileScreen from '@/screens/RepairTech/ProfileScreen';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, Spacing } from '@/constants/theme';

export type RepairTechTabParamList = {
  Home: undefined;
  Queue: undefined;
  Products: undefined;
  Estimates: undefined;
  Jobs: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RepairTechTabParamList>();

export default function RepairTechTabNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: BrandColors.azureBlue,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.select({
            ios: 'transparent',
            android: theme.surface,
            web: theme.surface,
          }),
          borderTopColor: theme.border,
          borderTopWidth: Platform.OS === 'ios' ? 0 : 1,
          paddingTop: Spacing.sm,
          paddingBottom: Platform.OS === 'web' ? Spacing.md : Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
          height: Platform.OS === 'web' ? 70 : Platform.OS === 'ios' ? 88 : 64,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={100}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Queue"
        component={QueueScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="tool" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="package" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Estimates"
        component={EstimatesScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="clipboard" size={size} color={color} />
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
    </Tab.Navigator>
  );
}
