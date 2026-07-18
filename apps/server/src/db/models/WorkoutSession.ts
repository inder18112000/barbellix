import { Schema, model, Types } from 'mongoose';

export interface WorkoutSetSubdoc {
  exerciseId: Types.ObjectId;
  setNumber: number;
  reps?: number;
  weightKg?: number;
  durationSecs?: number;
  restSecs?: number;
  completed: boolean;
}

export interface WorkoutSessionDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  planId?: Types.ObjectId;
  date: Date;
  durationMins: number;
  notes?: string;
  perceivedEffort?: number;
  sets: WorkoutSetSubdoc[];
}

const workoutSetSchema = new Schema<WorkoutSetSubdoc>(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    setNumber: { type: Number, required: true },
    reps: { type: Number },
    weightKg: { type: Number },
    durationSecs: { type: Number },
    restSecs: { type: Number },
    completed: { type: Boolean, required: true, default: false },
  },
  { _id: false },
);

const workoutSessionSchema = new Schema<WorkoutSessionDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  planId: { type: Schema.Types.ObjectId, ref: 'WorkoutPlan' },
  date: { type: Date, required: true, default: Date.now },
  durationMins: { type: Number, required: true, default: 0 },
  notes: { type: String },
  perceivedEffort: { type: Number },
  sets: { type: [workoutSetSchema], default: [] },
});

workoutSessionSchema.index({ userId: 1, date: -1 });

export const WorkoutSessionModel = model<WorkoutSessionDocument>('WorkoutSession', workoutSessionSchema);
