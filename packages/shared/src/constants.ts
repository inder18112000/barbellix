import type { HabitId } from './types';

export const DEFAULT_NUTRITION_GOALS = {
  calories: 2200,
  proteinG: 160,
  carbsG: 250,
  fatG: 70,
};

export const HABIT_LABELS: Record<HabitId, string> = {
  water: 'Drink 8 glasses of water',
  sleep: 'Sleep 7+ hours',
  steps: '10,000 steps',
  stretch: 'Stretch / mobility',
  no_junk: 'No junk food',
  meditation: 'Meditate 10 min',
};
