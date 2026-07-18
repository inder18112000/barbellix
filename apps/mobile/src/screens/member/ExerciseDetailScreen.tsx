import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { colors } from '../../theme';
import { glass, glow } from '../../theme/effects';
import { queryKeys, fetchExercises, fetchPersonalRecords } from '../../api/queries';
import { ScreenShell } from '../../components/common/ScreenShell';
import type { Exercise } from '../../types';
import type { WorkoutStackParams } from '../../navigation/types';
import { styles } from './ExerciseDetailScreen.styles';

type Route = RouteProp<WorkoutStackParams, 'ExerciseDetail'>;

const MUSCLE_EMOJI: Record<string, string> = {
  chest: '🫁', back: '🏋️', shoulders: '🔝', biceps: '💪',
  triceps: '💪', forearms: '🤜', core: '⚡', quads: '🦵',
  hamstrings: '🦵', glutes: '🍑', calves: '🦶', cardio: '❤️',
};

const MUSCLE_COLOR: Record<string, string> = {
  chest: '#FF6B6B', back: '#4F6EF7', shoulders: '#FFB347',
  biceps: '#00D4AA', triceps: '#7B4FD8', core: '#F7C948',
  quads: '#FF8C00', hamstrings: '#20B2AA', glutes: '#DA70D6',
  calves: '#32CD32',
};

export function ExerciseDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { exerciseId } = route.params;

  const { data: exercises = [] } = useQuery({ queryKey: queryKeys.exercises(), queryFn: () => fetchExercises() });
  const { data: prs = [] } = useQuery({ queryKey: queryKeys.progress.prs, queryFn: fetchPersonalRecords });

  const exercise = (exercises as Exercise[]).find((e) => e.id === exerciseId);
  const pr = prs.find((p) => p.exerciseId === exerciseId);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  if (!exercise) return (
    <ScreenShell title="Exercise" onBack={() => navigation.goBack()}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textMuted }}>Exercise not found</Text>
      </View>
    </ScreenShell>
  );

  const primaryMuscle = exercise.muscleGroups[0] ?? 'core';

  return (
    <ScreenShell title={exercise.name} onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim }}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Hero */}
          <Animated.View style={[styles.hero, { transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.heroEmoji}>{MUSCLE_EMOJI[primaryMuscle] ?? '💪'}</Text>
            <Text style={styles.heroName}>{exercise.name}</Text>
            <Text style={styles.heroMeta}>{exercise.equipment.join(' · ')}</Text>
            <View style={styles.tagsRow}>
              {exercise.muscleGroups.map((m) => (
                <View key={m} style={[styles.tag, { backgroundColor: (MUSCLE_COLOR[m] ?? colors.primary) + '25', borderWidth: 1, borderColor: (MUSCLE_COLOR[m] ?? colors.primary) + '60' }]}>
                  <Text style={[styles.tagText, { color: MUSCLE_COLOR[m] ?? colors.primary }]}>{m}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Personal Record */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Personal Record</Text>
            <View style={[styles.prCard, glass.card, pr && glow.primary]}>
              {pr ? (
                <>
                  <Text style={styles.prEmoji}>🥇</Text>
                  <View>
                    <Text style={styles.prValue}>{pr.value} {pr.unit}</Text>
                    <Text style={styles.prLabel}>Best set · {new Date(pr.achievedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.prEmoji}>🎯</Text>
                  <Text style={styles.prNone}>No record yet — go set one!</Text>
                </>
              )}
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to Perform</Text>
            <View style={[styles.instructionsCard, glass.card]}>
              <Text style={styles.instructionsText}>{exercise.instructions}</Text>
            </View>
          </View>
        </Animated.ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}
