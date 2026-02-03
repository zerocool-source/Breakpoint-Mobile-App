import React from 'react';
import { Pressable } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { HeaderButton } from '@react-navigation/elements';

import RepairTechTabNavigator from '@/navigation/RepairTechTabNavigator';
import ReportIssueModal from '@/screens/Modals/ReportIssueModal';
import ChatModal from '@/screens/Modals/ChatModal';
import CreateEstimateModal from '@/screens/Modals/CreateEstimateModal';
import AceEstimateBuilderScreen from '@/screens/RepairTech/AceEstimateBuilderScreen';
import UniversalEstimateBuilderScreen from '@/screens/RepairTech/UniversalEstimateBuilderScreen';
import QuoteDescriptionScreen from '@/screens/RepairTech/QuoteDescriptionScreen';
import RepairHistoryScreen from '@/screens/RepairTech/RepairHistoryScreen';
import AdminChatScreen from '@/screens/RepairTech/AdminChatScreen';
import ChatConversationScreen from '@/screens/shared/ChatConversationScreen';
import type { ChatChannel } from '@/screens/shared/ChatChannelsScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors } from '@/constants/theme';

export type RootStackParamList = {
  Main: undefined;
  ReportIssue: undefined;
  Chat: undefined;
  ChatConversation: { channel: ChatChannel };
  CreateEstimate: undefined;
  AceEstimateBuilder: { updatedDescription?: string; propertyId?: string; propertyName?: string; jobTitle?: string } | undefined;
  UniversalEstimateBuilder: { mode?: 'manual' | 'ace' };
  QuoteDescription: { lineItems: any[]; currentDescription: string; propertyName: string };
  EstimateDetail: { estimateId: string };
  RepairHistory: { propertyId?: string; propertyName?: string };
  AdminChat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });
  const { theme } = useTheme();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={RepairTechTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReportIssue"
        component={ReportIssueModal}
        options={({ navigation }) => ({
          presentation: 'modal',
          headerTitle: 'Report Issue',
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={22} color={theme.text} />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="Chat"
        component={ChatModal}
        options={({ navigation }) => ({
          presentation: 'modal',
          headerTitle: 'Support Chat',
          headerStyle: {
            backgroundColor: BrandColors.vividTangerine,
          },
          headerTintColor: '#FFFFFF',
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={22} color="#FFFFFF" />
            </HeaderButton>
          ),
        })}
      />
      <Stack.Screen
        name="CreateEstimate"
        component={CreateEstimateModal}
        options={({ navigation }) => ({
          presentation: 'modal',
          headerTitle: 'New Estimate',
          headerLeft: () => (
            <HeaderButton onPress={() => navigation.goBack()}>
              <Feather name="x" size={22} color={theme.text} />
            </HeaderButton>
          ),
        })}
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
        name="UniversalEstimateBuilder"
        component={UniversalEstimateBuilderScreen}
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
        name="RepairHistory"
        component={RepairHistoryScreen}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="AdminChat"
        component={AdminChatScreen}
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
