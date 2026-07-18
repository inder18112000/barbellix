import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import type {
  MemberTabParams,
  WorkoutStackParams,
  ProgressStackParams,
  ProfileStackParams,
} from './types';

import { HomeScreen } from '../screens/member/HomeScreen';
import { WorkoutHomeScreen } from '../screens/member/WorkoutHomeScreen';
import { ActiveWorkoutScreen } from '../screens/member/ActiveWorkoutScreen';
import { WorkoutHistoryScreen } from '../screens/member/WorkoutHistoryScreen';
import { WorkoutDetailScreen } from '../screens/member/WorkoutDetailScreen';
import { ExerciseLibraryScreen } from '../screens/member/ExerciseLibraryScreen';
import { ExerciseDetailScreen } from '../screens/member/ExerciseDetailScreen';
import { ExercisePickerScreen } from '../screens/member/ExercisePickerScreen';
import { WorkoutSummaryScreen } from '../screens/member/WorkoutSummaryScreen';
import { ProgressHomeScreen } from '../screens/member/ProgressHomeScreen';
import { NutritionScreen } from '../screens/member/NutritionScreen';
import { HabitTrackerScreen } from '../screens/member/HabitTrackerScreen';
import { OneRMCalculatorScreen } from '../screens/member/OneRMCalculatorScreen';
import { BodyMetricsScreen } from '../screens/member/BodyMetricsScreen';
import { PersonalRecordsScreen } from '../screens/member/PersonalRecordsScreen';
import { AICoachScreen } from '../screens/member/AICoachScreen';
import { ProfileHomeScreen } from '../screens/member/ProfileHomeScreen';
import { QRCheckInScreen } from '../screens/member/QRCheckInScreen';
import { MembershipCardScreen } from '../screens/member/MembershipCardScreen';
import { SettingsScreen } from '../screens/member/SettingsScreen';
import { EditProfileScreen } from '../screens/member/EditProfileScreen';
import { NotificationsScreen } from '../screens/member/NotificationsScreen';

const Tab = createBottomTabNavigator<MemberTabParams>();
const WorkoutStack = createNativeStackNavigator<WorkoutStackParams>();
const ProgressStack = createNativeStackNavigator<ProgressStackParams>();
const ProfileStack = createNativeStackNavigator<ProfileStackParams>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: Record<string, { active: IoniconName; inactive: IoniconName; label: string }> = {
  Home:     { active: 'home',                    inactive: 'home-outline',                    label: 'Home' },
  Workout:  { active: 'barbell',                 inactive: 'barbell-outline',                 label: 'Train' },
  Progress: { active: 'stats-chart',             inactive: 'stats-chart-outline',             label: 'Stats' },
  AICoach:  { active: 'flash',                   inactive: 'flash-outline',                   label: 'AI' },
  Profile:  { active: 'person-circle',           inactive: 'person-circle-outline',           label: 'Me' },
};

function TabIcon({ tabName, focused }: { tabName: string; focused: boolean }) {
  const cfg = TAB_CONFIG[tabName] ?? TAB_CONFIG['Home'];
  const color = focused ? colors.primary : colors.textMuted;
  return (
    <View style={tabStyles.wrapper}>
      <View style={[tabStyles.iconBox, focused && tabStyles.iconBoxActive]}>
        <Ionicons
          name={focused ? cfg.active : cfg.inactive}
          size={22}
          color={color}
        />
      </View>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
        {cfg.label}
      </Text>
    </View>
  );
}

function WorkoutNavigator() {
  return (
    <WorkoutStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkoutStack.Screen name="WorkoutHome"     component={WorkoutHomeScreen} />
      <WorkoutStack.Screen name="ActiveWorkout"   component={ActiveWorkoutScreen} />
      <WorkoutStack.Screen name="WorkoutHistory"  component={WorkoutHistoryScreen} />
      <WorkoutStack.Screen name="WorkoutDetail"   component={WorkoutDetailScreen} />
      <WorkoutStack.Screen name="ExerciseLibrary" component={ExerciseLibraryScreen} />
      <WorkoutStack.Screen name="ExerciseDetail"  component={ExerciseDetailScreen} />
      <WorkoutStack.Screen name="ExercisePicker"  component={ExercisePickerScreen} />
      <WorkoutStack.Screen name="WorkoutSummary" component={WorkoutSummaryScreen} />
    </WorkoutStack.Navigator>
  );
}

function ProgressNavigator() {
  return (
    <ProgressStack.Navigator screenOptions={{ headerShown: false }}>
      <ProgressStack.Screen name="ProgressHome"    component={ProgressHomeScreen} />
      <ProgressStack.Screen name="BodyMetrics"     component={BodyMetricsScreen} />
      <ProgressStack.Screen name="PersonalRecords" component={PersonalRecordsScreen} />
      <ProgressStack.Screen name="Nutrition"       component={NutritionScreen} />
      <ProgressStack.Screen name="HabitTracker"    component={HabitTrackerScreen} />
      <ProgressStack.Screen name="OneRMCalculator" component={OneRMCalculatorScreen} />
    </ProgressStack.Navigator>
  );
}

function ProfileNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome"    component={ProfileHomeScreen} />
      <ProfileStack.Screen name="MembershipCard" component={MembershipCardScreen} />
      <ProfileStack.Screen name="QRCheckIn"      component={QRCheckInScreen} />
      <ProfileStack.Screen name="Settings"       component={SettingsScreen} />
      <ProfileStack.Screen name="EditProfile"    component={EditProfileScreen} />
      <ProfileStack.Screen name="Notifications"  component={NotificationsScreen} />
    </ProfileStack.Navigator>
  );
}

export function MemberNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabStyles.bar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="Home"     component={HomeScreen}        options={{ tabBarIcon: ({ focused }) => <TabIcon tabName="Home"     focused={focused} /> }} />
      <Tab.Screen name="Workout"  component={WorkoutNavigator}  options={{ tabBarIcon: ({ focused }) => <TabIcon tabName="Workout"  focused={focused} /> }} />
      <Tab.Screen name="Progress" component={ProgressNavigator} options={{ tabBarIcon: ({ focused }) => <TabIcon tabName="Progress" focused={focused} /> }} />
      <Tab.Screen name="AICoach"  component={AICoachScreen}     options={{ tabBarIcon: ({ focused }) => <TabIcon tabName="AICoach"  focused={focused} /> }} />
      <Tab.Screen name="Profile"  component={ProfileNavigator}  options={{ tabBarIcon: ({ focused }) => <TabIcon tabName="Profile"  focused={focused} /> }} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: 0,
    paddingTop: 0,
  },
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 8,
  },
  iconBox: {
    width: 44,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxActive: {
    backgroundColor: colors.primary + '1A',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: colors.primary,
  },
});
