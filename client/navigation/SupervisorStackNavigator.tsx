import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SupervisorTabNavigator from '@/navigation/SupervisorTabNavigator';
import InspectionDetailScreen from '@/screens/Supervisor/InspectionDetailScreen';
import { useScreenOptions } from '@/hooks/useScreenOptions';

export type SupervisorStackParamList = {
  Main: undefined;
  InspectionDetail: { inspectionId: string | undefined };
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
    </Stack.Navigator>
  );
}
