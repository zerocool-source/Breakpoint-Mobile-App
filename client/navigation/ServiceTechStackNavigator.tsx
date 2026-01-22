import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { HeaderButton } from '@react-navigation/elements';

import ServiceTechTabNavigator from '@/navigation/ServiceTechTabNavigator';
import PropertyDetailScreen from '@/screens/ServiceTech/PropertyDetailScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';
import { useTheme } from '@/hooks/useTheme';
import type { RouteStop } from '@/lib/serviceTechMockData';

export type ServiceTechStackParamList = {
  Main: undefined;
  PropertyDetail: { stop: RouteStop };
};

const Stack = createNativeStackNavigator<ServiceTechStackParamList>();

export default function ServiceTechStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={ServiceTechTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PropertyDetail"
        component={PropertyDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
