import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AdminStackParams } from './types';

import { AdminHomeScreen } from '../screens/admin/AdminHomeScreen';
import { AttendanceFeedScreen } from '../screens/admin/AttendanceFeedScreen';
import { AnalyticsScreen } from '../screens/admin/AnalyticsScreen';
import { MemberManagementScreen } from '../screens/admin/MemberManagementScreen';
import { BranchSettingsScreen } from '../screens/admin/BranchSettingsScreen';

const Stack = createNativeStackNavigator<AdminStackParams>();

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminHome" component={AdminHomeScreen} />
      <Stack.Screen name="AttendanceFeed" component={AttendanceFeedScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="MemberManagement" component={MemberManagementScreen} />
      <Stack.Screen name="BranchSettings" component={BranchSettingsScreen} />
    </Stack.Navigator>
  );
}
