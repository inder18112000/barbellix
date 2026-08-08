import { Schema, model, Types } from 'mongoose';
import type { FitnessGoal, WorkoutGeneratedBy } from '@barbellix/shared';

const FITNESS_GOALS: FitnessGoal[] = [
  'lose_weight', 'build_muscle', 'improve_endurance',
  'increase_strength', 'general_fitness', 'sport_performance',
];
const GENERATED_BY: WorkoutGeneratedBy[] = ['ai', 'trainer', 'user'];

export interface PlannedExerciseSubdoc {
  exerciseId: Types.ObjectId;
  sets: number;
  reps: string;
  restSecs: number;
  notes?: string;
}

export interface WorkoutDaySubdoc {
  dayLabel: string;
  dayOfWeek?: number;
  exercises: PlannedExerciseSubdoc[];
}

export interface WorkoutPlanDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  trainerId?: Types.ObjectId;
  name: string;
  goal: FitnessGoal;
  generatedBy: WorkoutGeneratedBy;
  active: boolean;
  days: WorkoutDaySubdoc[];
  createdAt: Date;
  version: number;
  previousPlanId?: Types.ObjectId;
  changeSummary?: string[];
}

const plannedExerciseSchema = new Schema<PlannedExerciseSubdoc>(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    sets: { type: Number, required: true },
    reps: { type: String, required: true },
    restSecs: { type: Number, required: true },
    notes: { type: String },
  },
  { _id: false },
);

const workoutDaySchema = new Schema<WorkoutDaySubdoc>(
  {
    dayLabel: { type: String, required: true },
    dayOfWeek: { type: Number, min: 0, max: 6 },
    exercises: { type: [plannedExerciseSchema], default: [] },
  },
  { _id: false },
);

const workoutPlanSchema = new Schema<WorkoutPlanDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    trainerId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    goal: { type: String, enum: FITNESS_GOALS, required: true },
    generatedBy: { type: String, enum: GENERATED_BY, required: true },
    active: { type: Boolean, required: true, default: true },
    days: { type: [workoutDaySchema], default: [] },
    version: { type: Number, required: true, default: 1 },
    previousPlanId: { type: Schema.Types.ObjectId, ref: 'WorkoutPlan' },
    changeSummary: { type: [String] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const WorkoutPlanModel = model<WorkoutPlanDocument>('WorkoutPlan', workoutPlanSchema);
