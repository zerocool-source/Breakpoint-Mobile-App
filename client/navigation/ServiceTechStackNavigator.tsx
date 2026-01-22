import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { HeaderButton } from '@react-navigation/elements';

import ServiceTechTabNavigator from '@/navigation/ServiceTechTabNavigator';
import PropertyDetailScreen from '@/screens/ServiceTech/PropertyDetailScreen';
import BodyOfWaterDetailScreen from '@/screens/ServiceTech/BodyOfWaterDetailScreen';
import AssignmentDetailScreen from '@/screens/ServiceTech/AssignmentDetailScreen';
import ChatConversationScreen from '@/screens/shared/ChatConversationScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';
import { useTheme } from '@/hooks/useTheme';
import type { RouteStop, BodyOfWater, Assignment } from '@/lib/serviceTechMockData';
import type { ChatChannel } from '@/screens/shared/ChatChannelsScreen';

export type ServiceTechStackParamList = {
  Main: undefined;
  PropertyDetail: { stop: RouteStop };
  BodyOfWaterDetail: { body: BodyOfWater; propertyName: string };
  AssignmentDetail: { assignment: Assignment };
  ChatConversation: { channel: ChatChannel };
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
      <Stack.Screen
        name="BodyOfWaterDetail"
        component={BodyOfWaterDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AssignmentDetail"
        component={AssignmentDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ChatConversation"
        component={ChatConversationScreen}
        options={{ 
          headerShown: true,
          headerTitle: 'Chat',
        }}
      />
    </Stack.Navigator>
  );
}
