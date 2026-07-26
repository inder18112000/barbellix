import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { TrainerStackParams } from './types';

import { TrainerHomeScreen } from '../screens/trainer/TrainerHomeScreen';
import { MemberListScreen } from '../screens/trainer/MemberListScreen';
import { MemberDetailScreen } from '../screens/trainer/MemberDetailScreen';
import { AssignPlanScreen } from '../screens/trainer/AssignPlanScreen';
import { MessageMemberScreen } from '../screens/trainer/MessageMemberScreen';
import { ClassRosterListScreen } from '../screens/trainer/ClassRosterListScreen';
import { ClassRosterDetailScreen } from '../screens/trainer/ClassRosterDetailScreen';

const Stack = createNativeStackNavigator<TrainerStackParams>();

export function TrainerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainerHome" component={TrainerHomeScreen} />
      <Stack.Screen name="MemberList" component={MemberListScreen} />
      <Stack.Screen name="MemberDetail" component={MemberDetailScreen} />
      <Stack.Screen name="AssignPlan" component={AssignPlanScreen} />
      <Stack.Screen name="MessageMember" component={MessageMemberScreen} />
      <Stack.Screen name="ClassRosterList" component={ClassRosterListScreen} />
      <Stack.Screen name="ClassRosterDetail" component={ClassRosterDetailScreen} />
    </Stack.Navigator>
  );
}
