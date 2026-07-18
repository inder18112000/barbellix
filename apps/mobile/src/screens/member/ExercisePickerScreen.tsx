import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '../../theme';
import { glass, glow } from '../../theme/effects';
import { queryKeys, fetchExercises } from '../../api/queries';
import { ScreenShell } from '../../components/common/ScreenShell';
import type { Exercise, MuscleGroup, WorkoutDay } from '../../types';
import type { WorkoutStackParams } from '../../navigation/types';
import { styles } from './ExercisePickerScreen.styles';

type Nav = NativeStackNavigationProp<WorkoutStackParams, 'ExercisePicker'>;

const MUSCLE_EMOJI: Record<string, string> = {
  chest: '🫁', back: '🏋️', shoulders: '🔝', biceps: '💪',
  triceps: '💪', forearms: '🤜', core: '⚡', quads: '🦵',
  hamstrings: '🦵', glutes: '🍑', calves: '🦶', full_body: '🌟',
};

const ALL_MUSCLES: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'core', 'quads', 'hamstrings', 'glutes', 'calves',
];

// ─── Search Bar ───────────────────────────────────────────────────────────────

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={[styles.searchBar, glass.card]}>
      <Text style={{ fontSize: 16 }}>🔍</Text>
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChange}
        placeholder="Search exercises…"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')}>
          <Text style={styles.clearBtn}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Muscle Filter ────────────────────────────────────────────────────────────

function MuscleFilter({
  active,
  onSelect,
}: {
  active: MuscleGroup | null;
  onSelect: (m: MuscleGroup | null) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipScroll}
    >
      <TouchableOpacity
        style={[styles.chip, active === null && styles.chipActive]}
        onPress={() => onSelect(null)}
      >
        <Text style={[styles.chipText, active === null && styles.chipTextActive]}>All</Text>
      </TouchableOpacity>
      {ALL_MUSCLES.map((m) => (
        <TouchableOpacity
          key={m}
          style={[styles.chip, active === m && styles.chipActive]}
          onPress={() => onSelect(m)}
        >
          <Text style={[styles.chipText, active === m && styles.chipTextActive]}>{m}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Sets Stepper ─────────────────────────────────────────────────────────────

function SetsStepper({
  sets,
  onDecrement,
  onIncrement,
}: {
  sets: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.setsBlock}>
      <Text style={styles.setsLabel}>Sets</Text>
      <View style={styles.setsRow}>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={onDecrement}
          disabled={sets <= 1}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepBtnText, sets <= 1 && { opacity: 0.3 }]}>−</Text>
        </TouchableOpacity>
        <Text style={styles.setsCount}>{sets}</Text>
        <TouchableOpacity
          style={styles.stepBtn}
          onPress={onIncrement}
          disabled={sets >= 6}
          activeOpacity={0.7}
        >
          <Text style={[styles.stepBtnText, sets >= 6 && { opacity: 0.3 }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Exercise Row ─────────────────────────────────────────────────────────────

function ExerciseRow({
  exercise,
  selected,
  sets,
  onToggle,
  onSetChange,
}: {
  exercise: Exercise;
  selected: boolean;
  sets: number;
  onToggle: () => void;
  onSetChange: (delta: number) => void;
}) {
  const primaryMuscle = exercise.muscleGroups[0] ?? 'core';
  return (
    <TouchableOpacity
      style={[styles.exerciseRow, glass.card, selected && styles.exerciseRowSelected]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View style={[styles.iconCircle, selected && { backgroundColor: colors.primary + '30' }]}>
        <Text style={styles.iconEmoji}>{MUSCLE_EMOJI[primaryMuscle] ?? '💪'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseMeta}>
          {exercise.muscleGroups.slice(0, 2).join(' · ')} · {exercise.equipment[0] ?? ''}
        </Text>
      </View>
      {selected ? (
        <SetsStepper
          sets={sets}
          onDecrement={() => onSetChange(-1)}
          onIncrement={() => onSetChange(1)}
        />
      ) : (
        <View style={styles.checkCircle} />
      )}
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ExercisePickerScreen() {
  const navigation = useNavigation<Nav>();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [setsMap, setSetsMap] = useState<Record<string, number>>({});

  const { data: exercises = [] } = useQuery({
    queryKey: queryKeys.exercises(),
    queryFn: () => fetchExercises(),
  });

  const filtered = useMemo(
    () =>
      (exercises as Exercise[]).filter((ex) => {
        const matchQuery =
          query.length === 0 || ex.name.toLowerCase().includes(query.toLowerCase());
        const matchMuscle = muscle === null || ex.muscleGroups.includes(muscle);
        return matchQuery && matchMuscle;
      }),
    [exercises, query, muscle],
  );

  const toggleExercise = (ex: Exercise) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ex.id)) {
        next.delete(ex.id);
      } else {
        next.add(ex.id);
        setSetsMap((m) => ({ ...m, [ex.id]: m[ex.id] ?? 3 }));
      }
      return next;
    });
  };

  const changeSets = (exId: string, delta: number) => {
    setSetsMap((prev) => ({
      ...prev,
      [exId]: Math.min(6, Math.max(1, (prev[exId] ?? 3) + delta)),
    }));
  };

  const handleStart = () => {
    const selectedExercises = (exercises as Exercise[]).filter((ex) => selected.has(ex.id));
    const day: WorkoutDay = {
      dayLabel: 'Quick Workout',
      exercises: selectedExercises.map((ex) => ({
        exerciseId: ex.id,
        exercise: ex,
        sets: setsMap[ex.id] ?? 3,
        reps: '8-12',
        restSecs: 60,
      })),
    };
    navigation.navigate('ActiveWorkout', { day });
  };

  const selectedCount = selected.size;

  return (
    <ScreenShell title="Pick Exercises" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <SearchBar value={query} onChange={setQuery} />
        <MuscleFilter active={muscle} onSelect={setMuscle} />

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No exercises match your filters</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(ex) => ex.id}
            renderItem={({ item }) => (
              <ExerciseRow
                exercise={item}
                selected={selected.has(item.id)}
                sets={setsMap[item.id] ?? 3}
                onToggle={() => toggleExercise(item)}
                onSetChange={(delta) => changeSets(item.id, delta)}
              />
            )}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: selectedCount > 0 ? 100 : 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}

        {selectedCount > 0 && (
          <View style={[styles.startBar, glass.cardStrong]}>
            <Text style={styles.startBarCount}>
              {selectedCount} exercise{selectedCount !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={[styles.startButton, glow.primary]}
              onPress={handleStart}
              activeOpacity={0.85}
            >
              <Text style={styles.startButtonText}>▶  Start Workout</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </ScreenShell>
  );
}
