import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';

import HomeScreen from '@/screens/RepairTech/HomeScreen';
import QueueScreen from '@/screens/RepairTech/QueueScreen';
import EstimatesScreen from '@/screens/RepairTech/EstimatesScreen';
import JobsScreen from '@/screens/RepairTech/JobsScreen';
import ProfileScreen from '@/screens/RepairTech/ProfileScreen';
import { HeaderTitle } from '@/components/HeaderTitle';
import { useTheme } from '@/hooks/useTheme';
import { useScreenOptions } from '@/hooks/useScreenOptions';
import { BrandColors } from '@/constants/theme';

export type RepairTechTabParamList = {
  Home: undefined;
  Queue: undefined;
  Estimates: undefined;
  Jobs: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<RepairTechTabParamList>();

export default function RepairTechTabNavigator() {
  const { theme, isDark } = useTheme();
  const screenOptions = useScreenOptions();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        ...screenOptions,
        tabBarActiveTintColor: BrandColors.azureBlue,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.select({
            ios: 'transparent',
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
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
          headerTitle: () => <HeaderTitle title="Breakpoint" />,
          tabBarIcon: ({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Queue"
        component={QueueScreen}
        options={{
          headerTitle: 'Queue',
          tabBarIcon: ({ color, size }) => (
            <Feather name="layers" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Estimates"
        component={EstimatesScreen}
        options={{
          headerTitle: 'Estimates',
          tabBarIcon: ({ color, size }) => (
            <Feather name="file-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Jobs"
        component={JobsScreen}
        options={{
          headerTitle: 'Jobs',
          tabBarIcon: ({ color, size }) => (
            <Feather name="tool" size={size} color={color} />
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
