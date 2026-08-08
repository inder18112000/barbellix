import { Schema, model, Types } from 'mongoose';
import type { UserRole, UserStatus, FitnessGoal, MuscleGroup, InjurySeverity, InjuryCondition, DietPreference, GymAccess } from '@barbellix/shared';
import { FITNESS_GOALS, MUSCLE_GROUPS, INJURY_SEVERITIES, INJURY_CONDITIONS, DIET_PREFERENCES, GYM_ACCESS_OPTIONS } from '@barbellix/shared';

const USER_ROLES: UserRole[] = ['member', 'trainer', 'admin', 'superadmin'];
const USER_STATUSES: UserStatus[] = ['active', 'inactive', 'suspended'];

export interface InjuryEntrySubdoc {
  _id: Types.ObjectId;
  bodyPart: MuscleGroup;
  condition?: InjuryCondition;
  note?: string;
  severity: InjurySeverity;
  loggedAt: Date;
}

export interface UserProfileSubdoc {
  goals: FitnessGoal[];
  dob: string;
  heightCm: number;
  weightKg: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  avatarUrl?: string;
  bio?: string;
  targetWeightKg?: number;
  dietPreference?: DietPreference;
  gymAccess?: GymAccess;
  injuries: InjuryEntrySubdoc[];
}

export interface TrainerPermissionsSubdoc {
  canManageExerciseLibrary: boolean;
  canManageMealLibrary: boolean;
}

export interface UserDocument {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  branchId?: Types.ObjectId;
  role: UserRole;
  status: UserStatus;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  profile: UserProfileSubdoc;
  createdAt: Date;
  assignedTrainerId?: Types.ObjectId;
  trainerPermissions: TrainerPermissionsSubdoc;
  reportsToRole: 'admin' | 'superadmin';
}

const injuryEntrySchema = new Schema<InjuryEntrySubdoc>(
  {
    bodyPart: { type: String, enum: MUSCLE_GROUPS, required: true },
    condition: { type: String, enum: INJURY_CONDITIONS },
    note: { type: String },
    severity: { type: String, enum: INJURY_SEVERITIES, required: true },
    loggedAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const userProfileSchema = new Schema<UserProfileSubdoc>(
  {
    goals: { type: [String], enum: FITNESS_GOALS, default: [] },
    dob: { type: String },
    heightCm: { type: Number },
    weightKg: { type: Number },
    experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    avatarUrl: { type: String },
    bio: { type: String },
    targetWeightKg: { type: Number },
    dietPreference: { type: String, enum: DIET_PREFERENCES },
    gymAccess: { type: String, enum: GYM_ACCESS_OPTIONS },
    injuries: { type: [injuryEntrySchema], default: [] },
  },
  { _id: false },
);

const trainerPermissionsSchema = new Schema<TrainerPermissionsSubdoc>(
  {
    canManageExerciseLibrary: { type: Boolean, required: true, default: true },
    canManageMealLibrary: { type: Boolean, required: true, default: true },
  },
  { _id: false },
);

const userSchema = new Schema<UserDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    branchId: { type: Schema.Types.ObjectId, ref: 'Branch' },
    role: { type: String, enum: USER_ROLES, required: true, default: 'member' },
    status: { type: String, enum: USER_STATUSES, required: true, default: 'active' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    passwordHash: { type: String, required: true, select: false },
    profile: { type: userProfileSchema, required: true, default: () => ({}) },
    assignedTrainerId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    // Only meaningful for role: 'trainer', but harmless (and simpler) to default on every user
    // rather than making the field conditionally required.
    trainerPermissions: { type: trainerPermissionsSchema, required: true, default: () => ({}) },
    reportsToRole: { type: String, enum: ['admin', 'superadmin'], required: true, default: 'admin' },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const UserModel = model<UserDocument>('User', userSchema);
