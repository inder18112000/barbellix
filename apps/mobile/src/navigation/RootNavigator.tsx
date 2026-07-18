import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import type { RootStackParams } from './types';

import { AuthNavigator } from './AuthNavigator';
import { MemberNavigator } from './MemberNavigator';
import { TrainerNavigator } from './TrainerNavigator';
import { AdminNavigator } from './AdminNavigator';

const Stack = createNativeStackNavigator<RootStackParams>();

export function RootNavigator() {
  const { user, isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : user?.role === 'admin' || user?.role === 'superadmin' ? (
          <Stack.Screen name="AdminApp" component={AdminNavigator} />
        ) : user?.role === 'trainer' ? (
          <Stack.Screen name="TrainerApp" component={TrainerNavigator} />
        ) : (
          <Stack.Screen name="MemberApp" component={MemberNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
