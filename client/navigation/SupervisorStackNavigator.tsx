import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SupervisorTabNavigator from '@/navigation/SupervisorTabNavigator';
import InspectionDetailScreen from '@/screens/Supervisor/InspectionDetailScreen';
import ChatConversationScreen from '@/screens/shared/ChatConversationScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';
import type { ChatChannel } from '@/screens/shared/ChatChannelsScreen';

export type SupervisorStackParamList = {
  Main: undefined;
  InspectionDetail: { inspectionId: string | undefined; propertyId?: string; propertyName?: string };
  ChatConversation: { channel: ChatChannel };
};

const Stack = createNativeStackNavigator<SupervisorStackParamList>();

export default function SupervisorStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={SupervisorTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="InspectionDetail"
        component={InspectionDetailScreen}
        options={{ 
          headerShown: true,
          headerTitle: 'Inspection Checklist',
        }}
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
