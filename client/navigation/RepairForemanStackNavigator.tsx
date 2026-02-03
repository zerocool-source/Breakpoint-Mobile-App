import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { HeaderButton } from '@react-navigation/elements';

import RepairForemanTabNavigator from '@/navigation/RepairForemanTabNavigator';
import AceEstimateBuilderScreen from '@/screens/RepairTech/AceEstimateBuilderScreen';
import QuoteDescriptionScreen from '@/screens/RepairTech/QuoteDescriptionScreen';
import ChatConversationScreen from '@/screens/shared/ChatConversationScreen';
import type { ChatChannel } from '@/screens/shared/ChatChannelsScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';
import { useTheme } from '@/hooks/useTheme';

export type RepairForemanStackParamList = {
  ForemanMain: undefined;
  AceEstimateBuilder: { 
    estimateId?: string;
    propertyId?: string; 
    propertyName?: string; 
    updatedDescription?: string;
  } | undefined;
  QuoteDescription: { 
    lineItems: any[]; 
    currentDescription: string; 
    propertyName: string;
  };
  ChatConversation: { channel: ChatChannel };
};

const Stack = createNativeStackNavigator<RepairForemanStackParamList>();

export default function RepairForemanStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="ForemanMain"
        component={RepairForemanTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AceEstimateBuilder"
        component={AceEstimateBuilderScreen}
        options={{
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
      <Stack.Screen
        name="QuoteDescription"
        component={QuoteDescriptionScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="ChatConversation"
        component={ChatConversationScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
    </Stack.Navigator>
  );
}
