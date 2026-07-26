import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Animated, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { colors } from '../../theme';
import { glass, glow } from '../../theme/effects';
import { Card } from '../../components/common/Card';
import { Avatar } from '../../components/common/Avatar';
import { queryKeys, fetchAIRecommendations, fetchAttendanceSummary, fetchWorkoutSessions, updateProfile } from '../../api/queries';
import { useAuthStore } from '../../store/authStore';
import type { User } from '@fitpulse/shared';
import { format } from 'date-fns';
import { styles } from './HomeScreen.styles';

const { width } = Dimensions.get('window');

// ─── Pulse Ring (SRP) ────────────────────────────────────────────────────────

function PulseRing({ color = colors.primary }: { color?: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    const pulse = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 1500, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 1500, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.7, duration: 1500, useNativeDriver: true }),
      ]),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, []);
  return <Animated.View style={[styles.pulseRing, { borderColor: color, transform: [{ scale }], opacity }]} />;
}

// ─── Streak Badge (SRP) ──────────────────────────────────────────────────────

function StreakBadge({ streak }: { streak: number }) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(bounceAnim, { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }).start(); }, []);
  return (
    <Animated.View style={[styles.streakCard, glass.cardStrong, { transform: [{ scale: bounceAnim }] }]}>
      <View style={styles.streakInner}>
        <PulseRing color={colors.accent} />
        <Text style={styles.streakEmoji}>🔥</Text>
      </View>
      <Text style={styles.streakCount}>{streak}</Text>
      <Text style={styles.streakLabel}>Day Streak</Text>
    </Animated.View>
  );
}

// ─── Stat Card (SRP) ─────────────────────────────────────────────────────────

function StatCard({ label, value, unit, emoji }: { label: string; value: string | number; unit?: string; emoji: string }) {
  return (
    <View style={[styles.statCard, glass.card]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}{unit && <Text style={styles.statUnit}> {unit}</Text>}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── AI Card (SRP) ───────────────────────────────────────────────────────────

function AICard({ title, description, onAccept }: { title: string; description: string; onAccept: () => void }) {
  const slideIn = useRef(new Animated.Value(40)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideIn, { toValue: 0, tension: 70, friction: 8, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[styles.aiCard, glass.cardStrong, glow.primary, { transform: [{ translateY: slideIn }], opacity: fadeIn }]}>
      <View style={styles.aiCardHeader}>
        <Text style={styles.aiChip}>✨ AI Coach</Text>
      </View>
      <Text style={styles.aiCardTitle}>{title}</Text>
      <Text style={styles.aiCardDesc}>{description}</Text>
      <View style={styles.aiCardActions}>
        <TouchableOpacity style={styles.aiAcceptBtn} onPress={onAccept}>
          <Text style={styles.aiAcceptText}>Start Now →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.aiSkipBtn}>
          <Text style={styles.aiSkipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Quick Action (SRP) ──────────────────────────────────────────────────────

function QuickAction({ emoji, label, onPress, glowColor }: { emoji: string; label: string; onPress: () => void; glowColor: string }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={[styles.quickAction, glass.card, { borderColor: glowColor + '40' }]} onPress={handlePress} activeOpacity={0.8}>
        <Text style={styles.quickActionEmoji}>{emoji}</Text>
        <Text style={styles.quickActionLabel}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Profile Card (SRP) - photo/name/editable bio, per the client's Home screen spec ────────

function ProfileCard() {
  const { user, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user?.profile.bio ?? '');
  const [pickingPhoto, setPickingPhoto] = useState(false);

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: (partial: Partial<User['profile']>) => updateProfile(partial),
    onSuccess: (updated) => {
      setUser(updated);
      setEditing(false);
    },
  });

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`;

  const handlePickPhoto = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      Alert.alert('Photo access needed', 'Enable photo library access in Settings to change your profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setPickingPhoto(true);
    try {
      // Resize + compress before base64-encoding to keep the JSON payload well under
      // Fastify's default 1MB body limit - full-res phone photos would blow past it.
      const manipulated = await manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400 } }],
        { compress: 0.6, format: SaveFormat.JPEG, base64: true },
      );
      saveProfile({ avatarUrl: `data:image/jpeg;base64,${manipulated.base64}` });
    } finally {
      setPickingPhoto(false);
    }
  };

  return (
    <Card style={styles.profileCard}>
      <Avatar
        uri={user?.profile.avatarUrl}
        initials={initials}
        onPress={handlePickPhoto}
        disabled={pickingPhoto}
        badge={<Text style={{ fontSize: 10 }}>{pickingPhoto ? '⏳' : '📷'}</Text>}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.profileName}>{user?.firstName} {user?.lastName}</Text>
        {editing ? (
          <TextInput
            style={styles.profileBioInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a short bio…"
            placeholderTextColor={colors.textMuted}
            autoFocus
            maxLength={280}
            onSubmitEditing={() => saveProfile({ bio: draft })}
            onBlur={() => saveProfile({ bio: draft })}
            editable={!isPending}
          />
        ) : (
          <Text style={styles.profileBio} numberOfLines={2}>
            {user?.profile.bio || 'Tap the pencil to add a bio'}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.profileEditBtn}
        onPress={() => {
          if (editing) saveProfile({ bio: draft });
          else setEditing(true);
        }}
      >
        <Text style={{ fontSize: 16 }}>{editing ? '✓' : '✏️'}</Text>
      </TouchableOpacity>
    </Card>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuthStore();
  const greeting = getGreeting();

  const { data: attendance } = useQuery({ queryKey: queryKeys.attendance.summary, queryFn: fetchAttendanceSummary });
  const { data: sessions } = useQuery({ queryKey: queryKeys.workoutSessions, queryFn: fetchWorkoutSessions });
  const { data: recommendations } = useQuery({ queryKey: queryKeys.ai.recommendations, queryFn: fetchAIRecommendations });

  const headerFade = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(headerFade, { toValue: 1, duration: 800, useNativeDriver: true }).start(); }, []);

  const thisWeekSessions = sessions?.filter((s) => {
    const d = new Date(s.date);
    return d >= new Date(Date.now() - 7 * 86400000);
  }).length ?? 0;

  const totalVolume = sessions?.slice(0, 7).reduce((acc, s) =>
    acc + s.sets.reduce((a, set) => a + (set.weightKg ?? 0) * (set.reps ?? 1), 0), 0) ?? 0;

  const topRec = recommendations?.[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{user?.firstName} 👋</Text>
          </View>
          <TouchableOpacity style={[styles.notifBtn, glass.card]}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
        </Animated.View>

        <ProfileCard />

        <View style={styles.datePill}>
          <Text style={styles.datePillText}>{format(new Date(), 'EEEE, MMMM d')}</Text>
        </View>

        {/* Streak + Stats */}
        <View style={styles.statsRow}>
          <StreakBadge streak={attendance?.streak ?? 0} />
          <View style={styles.statsColumn}>
            <StatCard label="This Week" value={thisWeekSessions} unit="sessions" emoji="📅" />
            <StatCard label="Volume" value={Math.round(totalVolume / 1000)} unit="t" emoji="⚖️" />
          </View>
        </View>

        {/* AI Recommendation */}
        {topRec && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Plan</Text>
            <AICard
              title={topRec.title}
              description={topRec.description}
              onAccept={() => navigation.navigate('AICoach')}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <QuickAction emoji="🏋️" label="Workout"   onPress={() => navigation.navigate('Workout')}                                  glowColor={colors.primary} />
            <QuickAction emoji="🥗" label="Diet"       onPress={() => navigation.navigate('Progress', { screen: 'Nutrition' })}        glowColor={colors.success} />
            <QuickAction emoji="⚖️" label="Weight"     onPress={() => navigation.navigate('Progress', { screen: 'BodyMetrics' })}      glowColor={'#FFB347'} />
            <QuickAction emoji="📊" label="Progress"   onPress={() => navigation.navigate('Progress')}                                 glowColor={colors.accent} />
            <QuickAction emoji="🤝" label="Sponsors"   onPress={() => navigation.navigate('Profile', { screen: 'Sponsorship' })}      glowColor={'#AF52DE'} />
          </View>
        </View>

        {/* Recent Sessions */}
        {sessions && sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Sessions</Text>
            {sessions.slice(0, 3).map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.sessionCard, glass.card]}
                onPress={() => navigation.navigate('Workout', { screen: 'WorkoutHistory' })}
              >
                <View>
                  <Text style={styles.sessionDate}>{format(new Date(s.date), 'EEE, MMM d')}</Text>
                  <Text style={styles.sessionSets}>{s.sets.length} sets · {s.durationMins} min</Text>
                </View>
                <View style={styles.rpeTag}>
                  <Text style={styles.rpeText}>RPE {s.perceivedEffort}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.viewAllBtn} onPress={() => navigation.navigate('Workout', { screen: 'WorkoutHistory' })}>
              <Text style={styles.viewAllText}>View all sessions →</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
