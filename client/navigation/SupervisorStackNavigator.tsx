import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SupervisorTabNavigator from '@/navigation/SupervisorTabNavigator';
import InspectionDetailScreen from '@/screens/Supervisor/InspectionDetailScreen';
import ChatConversationScreen from '@/screens/shared/ChatConversationScreen';
import TruckInspectionScreen from '@/screens/Supervisor/TruckInspectionScreen';
import SupportiveActionsScreen from '@/screens/Supervisor/SupportiveActionsScreen';
import WhosOnScreen from '@/screens/Supervisor/WhosOnScreen';
import RosterScreen from '@/screens/Supervisor/RosterScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';
import type { ChatChannel } from '@/screens/shared/ChatChannelsScreen';

export type SupervisorStackParamList = {
  Main: undefined;
  InspectionDetail: { inspectionId: string | undefined; propertyId?: string; propertyName?: string };
  ChatConversation: { channel: ChatChannel };
  TruckInspection: undefined;
  SupportiveActions: undefined;
  WhosOn: undefined;
  Roster: undefined;
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
      <Stack.Screen
        name="TruckInspection"
        component={TruckInspectionScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="SupportiveActions"
        component={SupportiveActionsScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="WhosOn"
        component={WhosOnScreen}
        options={{ 
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Roster"
        component={RosterScreen}
        options={{ 
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
