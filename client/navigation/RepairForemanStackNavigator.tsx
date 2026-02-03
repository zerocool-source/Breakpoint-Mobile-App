import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { HeaderButton } from '@react-navigation/elements';

import RepairForemanTabNavigator from '@/navigation/RepairForemanTabNavigator';
import AceEstimateBuilderScreen from '@/screens/RepairTech/AceEstimateBuilderScreen';
import QuoteDescriptionScreen from '@/screens/RepairTech/QuoteDescriptionScreen';
import EstimatePrintView from '@/screens/RepairForeman/EstimatePrintView';
import JobDetailsScreen from '@/screens/RepairForeman/JobDetailsScreen';
import ChatConversationScreen from '@/screens/shared/ChatConversationScreen';
import type { ChatChannel } from '@/screens/shared/ChatChannelsScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';
import { useTheme } from '@/hooks/useTheme';

interface EstimateLineItem {
  sku: string;
  name: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxable: boolean;
}

interface EstimateData {
  estimateNumber: string;
  propertyName: string;
  propertyAddress?: string;
  estimateDate: string;
  expirationDate: string;
  description: string;
  lineItems: EstimateLineItem[];
  subtotal: number;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  woNumber?: string;
  techName?: string;
}

interface AssignedJob {
  id: string;
  jobNumber: string;
  propertyName: string;
  propertyAddress: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  scheduledTime: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'dismissed';
  estimatedDuration: string;
  contactName?: string;
  contactPhone?: string;
}

export type RepairForemanStackParamList = {
  ForemanMain: undefined;
  AceEstimateBuilder: { 
    estimateId?: string;
    propertyId?: string; 
    propertyName?: string; 
    updatedDescription?: string;
    jobNumber?: string;
    jobDescription?: string;
  } | undefined;
  QuoteDescription: { 
    lineItems: any[]; 
    currentDescription: string; 
    propertyName: string;
  };
  EstimatePrintView: {
    estimate: EstimateData;
  };
  JobDetails: {
    job: AssignedJob;
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
        name="EstimatePrintView"
        component={EstimatePrintView}
        options={{
          headerShown: false,
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
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
