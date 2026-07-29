import { Schema, model, Types } from 'mongoose';
import type { UserRole, UserStatus, FitnessGoal, UserProfile } from '@barbellix/shared';

const USER_ROLES: UserRole[] = ['member', 'trainer', 'admin', 'superadmin'];
const USER_STATUSES: UserStatus[] = ['active', 'inactive', 'suspended'];
const FITNESS_GOALS: FitnessGoal[] = [
  'lose_weight',
  'build_muscle',
  'improve_endurance',
  'increase_strength',
  'general_fitness',
  'sport_performance',
];

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
  profile: UserProfile;
  createdAt: Date;
}

const userProfileSchema = new Schema<UserProfile>(
  {
    goals: { type: [String], enum: FITNESS_GOALS, default: [] },
    dob: { type: String },
    heightCm: { type: Number },
    weightKg: { type: Number },
    experienceLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    avatarUrl: { type: String },
    bio: { type: String },
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
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const UserModel = model<UserDocument>('User', userSchema);
