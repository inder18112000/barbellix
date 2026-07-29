import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { glass } from '../../theme/effects';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { styles } from './GoalSelectionScreen.styles';
import type { FitnessGoal } from '@barbellix/shared';

interface GoalOption {
  id: FitnessGoal;
  emoji: string;
  title: string;
  description: string;
  accentColor: string;
}

const GOALS: GoalOption[] = [
  { id: 'lose_weight',        emoji: '⚡', title: 'Lose Weight',       description: 'Burn fat with smart cardio + strength combos',     accentColor: '#FF6B6B' },
  { id: 'build_muscle',       emoji: '💪', title: 'Build Muscle',      description: 'Progressive overload plans for hypertrophy',        accentColor: '#4F6EF7' },
  { id: 'increase_strength',  emoji: '🏋️', title: 'Increase Strength', description: 'Powerlifting-style periodisation and PRs',          accentColor: '#FFB347' },
  { id: 'improve_endurance',  emoji: '🏃', title: 'Improve Endurance', description: 'Zone 2 and interval training for your engine',       accentColor: '#00D4AA' },
  { id: 'general_fitness',    emoji: '✨', title: 'General Fitness',   description: 'Balanced mix of strength, cardio, and mobility',    accentColor: '#7B4FD8' },
  { id: 'sport_performance',  emoji: '🏅', title: 'Sport Performance', description: 'Functional strength and athleticism for your sport', accentColor: '#F7C948' },
];

// ─── Goal Card (SRP) ──────────────────────────────────────────────────────────

function GoalCard({ goal, selected, onPress }: { goal: GoalOption; selected: boolean; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, styles.cardWrapper]}>
      <TouchableOpacity
        style={[
          styles.card,
          glass.card,
          selected && { borderColor: goal.accentColor, borderWidth: 2 },
          selected && { shadowColor: goal.accentColor, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <View style={[styles.emojiCircle, { backgroundColor: goal.accentColor + '25' }]}>
          <Text style={styles.emoji}>{goal.emoji}</Text>
        </View>
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, selected && { color: goal.accentColor }]}>{goal.title}</Text>
          <Text style={styles.cardDesc}>{goal.description}</Text>
        </View>
        <View style={[styles.checkCircle, selected && { backgroundColor: goal.accentColor }]}>
          {selected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function GoalSelectionScreen() {
  const navigation = useNavigation<any>();
  const [selected, setSelected] = useState<Set<FitnessGoal>>(new Set());

  const toggle = (id: FitnessGoal) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>What's your goal?</Text>
          <Text style={styles.subtitle}>Pick one or more — we'll tailor your plan accordingly.</Text>
        </View>

        {GOALS.map((goal) => (
          <GoalCard key={goal.id} goal={goal} selected={selected.has(goal.id)} onPress={() => toggle(goal.id)} />
        ))}

        <View style={styles.footer}>
          <PrimaryButton
            label={selected.size === 0 ? 'Select at least one goal' : `Continue with ${selected.size} goal${selected.size > 1 ? 's' : ''} →`}
            onPress={() => navigation.navigate('BodyStats', { goals: Array.from(selected) })}
            disabled={selected.size === 0}
          />
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.navigate('BodyStats', { goals: [] })}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
