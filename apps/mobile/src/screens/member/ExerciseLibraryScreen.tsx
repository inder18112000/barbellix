import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { queryKeys, fetchExercises } from '../../api/queries';
import { ScreenShell } from '../../components/common/ScreenShell';
import type { Exercise, MuscleGroup } from '@fitpulse/shared';
import { styles } from './ExerciseLibraryScreen.styles';

const MUSCLE_EMOJI: Record<string, string> = {
  chest: '🫁', back: '🏋️', shoulders: '🔝', biceps: '💪',
  triceps: '💪', forearms: '🤜', core: '⚡', quads: '🦵',
  hamstrings: '🦵', glutes: '🍑', calves: '🦶', cardio: '❤️',
};

const ALL_MUSCLES: MuscleGroup[] = ['chest','back','shoulders','biceps','triceps','core','quads','hamstrings','glutes','calves'];

// ─── Search Bar (SRP) ────────────────────────────────────────────────────────

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
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={() => onChange('')}>
          <Text style={styles.clearBtnText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Muscle Filter (SRP) ─────────────────────────────────────────────────────

function MuscleFilter({ active, onSelect }: { active: MuscleGroup | null; onSelect: (m: MuscleGroup | null) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
      <TouchableOpacity style={[styles.chip, active === null && styles.chipActive]} onPress={() => onSelect(null)}>
        <Text style={[styles.chipText, active === null && styles.chipTextActive]}>All</Text>
      </TouchableOpacity>
      {ALL_MUSCLES.map((m) => (
        <TouchableOpacity key={m} style={[styles.chip, active === m && styles.chipActive]} onPress={() => onSelect(m)}>
          <Text style={[styles.chipText, active === m && styles.chipTextActive]}>{m}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Exercise Row (SRP) ───────────────────────────────────────────────────────

function ExerciseRow({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  const primaryMuscle = exercise.muscleGroups[0] ?? 'core';
  return (
    <TouchableOpacity style={[styles.exerciseRow, glass.card]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconEmoji}>{MUSCLE_EMOJI[primaryMuscle] ?? '💪'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.exerciseName}>{exercise.name}</Text>
        <Text style={styles.exerciseMeta}>
          {exercise.muscleGroups.slice(0, 2).join(' · ')} · {exercise.equipment.slice(0, 1).join('')}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ExerciseLibraryScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | null>(null);

  const { data: exercises = [] } = useQuery({
    queryKey: queryKeys.exercises(),
    queryFn: () => fetchExercises(),
  });

  const filtered = useMemo(() => {
    return (exercises as Exercise[]).filter((ex) => {
      const matchQuery = query.length === 0 || ex.name.toLowerCase().includes(query.toLowerCase());
      const matchMuscle = muscle === null || ex.muscleGroups.includes(muscle);
      return matchQuery && matchMuscle;
    });
  }, [exercises, query, muscle]);

  return (
    <ScreenShell title="Exercise Library" onBack={() => navigation.goBack()}>
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
                onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id })}
              />
            )}
            contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </SafeAreaView>
    </ScreenShell>
  );
}
