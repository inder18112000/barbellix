import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { WorkoutDay } from '../types';

export type AuthStackParams = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  GoalSelection: undefined;
  BodyStats: { goals: string[] };
  ForgotPassword: undefined;
};

export type MemberTabParams = {
  Home: undefined;
  Workout: undefined;
  Progress: undefined;
  AICoach: undefined;
  Profile: undefined;
};

export type WorkoutStackParams = {
  WorkoutHome: undefined;
  ActiveWorkout: { planId?: string; dayIndex?: number; day?: WorkoutDay };
  WorkoutSummary: {
    durationMins: number;
    totalSets: number;
    totalVolume: number;
    exerciseCount: number;
    exerciseNames: string[];
  };
  WorkoutHistory: undefined;
  WorkoutDetail: { sessionId: string };
  ExerciseLibrary: undefined;
  ExerciseDetail: { exerciseId: string };
  ExercisePicker: undefined;
};

export type ProgressStackParams = {
  ProgressHome: undefined;
  BodyMetrics: undefined;
  PersonalRecords: undefined;
  Nutrition: undefined;
  HabitTracker: undefined;
  OneRMCalculator: undefined;
};

export type ProfileStackParams = {
  ProfileHome: undefined;
  EditProfile: undefined;
  MembershipCard: undefined;
  QRCheckIn: undefined;
  Notifications: undefined;
  Settings: undefined;
};

export type TrainerStackParams = {
  TrainerHome: undefined;
  MemberList: undefined;
  MemberDetail: { memberId: string };
  AssignPlan: { memberId: string };
  MessageMember: { memberId: string };
};

export type AdminStackParams = {
  AdminHome: undefined;
  AttendanceFeed: undefined;
  Analytics: undefined;
  MemberManagement: undefined;
  BranchSettings: undefined;
};

export type RootStackParams = {
  Auth: undefined;
  MemberApp: undefined;
  TrainerApp: undefined;
  AdminApp: undefined;
};

// Convenience screen-props helpers
export type AuthScreenProps<T extends keyof AuthStackParams> =
  NativeStackScreenProps<AuthStackParams, T>;

export type MemberTabProps<T extends keyof MemberTabParams> =
  BottomTabScreenProps<MemberTabParams, T>;

export type WorkoutScreenProps<T extends keyof WorkoutStackParams> =
  NativeStackScreenProps<WorkoutStackParams, T>;

export type ProgressScreenProps<T extends keyof ProgressStackParams> =
  NativeStackScreenProps<ProgressStackParams, T>;

export type ProfileScreenProps<T extends keyof ProfileStackParams> =
  NativeStackScreenProps<ProfileStackParams, T>;

export type TrainerScreenProps<T extends keyof TrainerStackParams> =
  NativeStackScreenProps<TrainerStackParams, T>;

export type AdminScreenProps<T extends keyof AdminStackParams> =
  NativeStackScreenProps<AdminStackParams, T>;
