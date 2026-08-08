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
import { BrandMark } from '../../components/common/BrandMark';
import {
  queryKeys, fetchAIRecommendations, fetchAttendanceSummary, fetchWorkoutSessions, updateProfile,
  fetchPersonalRecords, fetchProgressMetrics,
} from '../../api/queries';
import { useAuthStore } from '../../store/authStore';
import type { User } from '@barbellix/shared';
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

// ─── Performance Metrics (SRP) - a quick-glance summary built entirely from data already
// available elsewhere in the app (PRs, sessions, attendance, body metrics), not new tracking. ───

function PerformanceMetricsSection({
  prsThisMonth, avgRpe, checkInsThisMonth, weightTrendKg,
}: { prsThisMonth: number; avgRpe: number | null; checkInsThisMonth: number; weightTrendKg: number | null }) {
  const trendLabel = weightTrendKg === null ? '—' : `${weightTrendKg > 0 ? '+' : ''}${weightTrendKg.toFixed(1)}`;
  const trendEmoji = weightTrendKg === null ? '⚖️' : weightTrendKg < 0 ? '📉' : weightTrendKg > 0 ? '📈' : '⚖️';

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Performance</Text>
      <View style={styles.performanceGrid}>
        <View style={styles.performanceCell}><StatCard label="PRs this month" value={prsThisMonth} emoji="🥇" /></View>
        <View style={styles.performanceCell}><StatCard label="Avg RPE" value={avgRpe !== null ? avgRpe.toFixed(1) : '—'} emoji="🔥" /></View>
        <View style={styles.performanceCell}><StatCard label="Check-ins this month" value={checkInsThisMonth} emoji="📅" /></View>
        <View style={styles.performanceCell}><StatCard label="Weight trend" value={trendLabel} unit={weightTrendKg !== null ? 'kg' : undefined} emoji={trendEmoji} /></View>
      </View>
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

// ─── Explore Card (SRP) - icon badge + title + one-line description + chevron affordance ──────

function ExploreCard({
  emoji, title, description, onPress, accentColor,
}: { emoji: string; title: string; description: string; onPress: () => void; accentColor: string }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
    ]).start();
    onPress();
  };
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity style={[styles.exploreCard, glass.card, { borderColor: accentColor + '35' }]} onPress={handlePress} activeOpacity={0.85}>
        <View>
          <View style={[styles.exploreIconBadge, { backgroundColor: accentColor + '20' }]}>
            <Text style={styles.exploreIconEmoji}>{emoji}</Text>
          </View>
          <Text style={styles.exploreTitle}>{title}</Text>
          <Text style={styles.exploreDesc} numberOfLines={2}>{description}</Text>
        </View>
        <View style={styles.exploreFooterRow}>
          <View style={[styles.exploreChevronBtn, { backgroundColor: accentColor + '18' }]}>
            <Text style={[styles.exploreChevronText, { color: accentColor }]}>→</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Profile Card (SRP) - photo/name/editable bio, per the client's Home screen spec ────────

function ProfileCard({ onViewProfile }: { onViewProfile: () => void }) {
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
      <Text style={styles.profileLabel}>YOUR PROFILE</Text>
      <View style={styles.profileCardTop}>
        <Avatar
          size={64}
          uri={user?.profile.avatarUrl}
          initials={initials}
          onPress={handlePickPhoto}
          disabled={pickingPhoto}
          badge={<Text style={{ fontSize: 10 }}>{pickingPhoto ? '⏳' : '📷'}</Text>}
        />
        <View style={styles.profileTextBlock}>
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
              {user?.profile.bio || 'Stay focused, stay strong.'}
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
      </View>
      <View style={styles.profileBottomRow}>
        <TouchableOpacity style={styles.viewProfileBtn} onPress={onViewProfile} activeOpacity={0.85}>
          <Text style={styles.viewProfileBtnText}>VIEW PROFILE</Text>
        </TouchableOpacity>
        <Text style={styles.profileChevron}>›</Text>
      </View>
    </Card>
  );
}

// ─── AI Goal Wizard CTA (SRP) - the client's headline feature: set a goal from real body data,
// let the AI build a workout + diet plan from it. ────────────────────────────────────────────

function AIWizardCTA({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.wizardCard, glass.cardStrong, glow.primary]} onPress={onPress} activeOpacity={0.88}>
      <Text style={styles.wizardEmoji}>🎯</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.wizardTitle}>Get Your Personalized AI Plan</Text>
        <Text style={styles.wizardDesc}>Set your goal, and let AI build your workout + diet plan</Text>
      </View>
      <Text style={styles.wizardArrow}>→</Text>
    </TouchableOpacity>
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
  const parent = navigation.getParent();
  const { user } = useAuthStore();
  const greeting = getGreeting();

  const { data: attendance } = useQuery({ queryKey: queryKeys.attendance.summary, queryFn: fetchAttendanceSummary });
  const { data: sessions } = useQuery({ queryKey: queryKeys.workoutSessions, queryFn: fetchWorkoutSessions });
  const { data: recommendations } = useQuery({ queryKey: queryKeys.ai.recommendations, queryFn: fetchAIRecommendations });
  const { data: prs } = useQuery({ queryKey: queryKeys.progress.prs, queryFn: fetchPersonalRecords });
  const { data: metrics } = useQuery({ queryKey: queryKeys.progress.metrics, queryFn: fetchProgressMetrics });

  const headerFade = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(headerFade, { toValue: 1, duration: 800, useNativeDriver: true }).start(); }, []);

  const thisWeekSessions = sessions?.filter((s) => {
    const d = new Date(s.date);
    return d >= new Date(Date.now() - 7 * 86400000);
  }).length ?? 0;

  const totalVolume = sessions?.slice(0, 7).reduce((acc, s) =>
    acc + s.sets.reduce((a, set) => a + (set.weightKg ?? 0) * (set.reps ?? 1), 0), 0) ?? 0;

  const topRec = recommendations?.[0];

  const now = new Date();
  const prsThisMonth = prs?.filter((p) => {
    const d = new Date(p.achievedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length ?? 0;

  const recentEfforts = sessions?.slice(0, 7).map((s) => s.perceivedEffort).filter((r): r is number => r !== undefined) ?? [];
  const avgRpe = recentEfforts.length > 0 ? recentEfforts.reduce((a, b) => a + b, 0) / recentEfforts.length : null;

  const weighIns = (metrics ?? [])
    .filter((m) => m.weightKg !== undefined)
    .slice()
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  const weightTrendKg = weighIns.length >= 2 ? weighIns[0].weightKg! - weighIns[1].weightKg! : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Brand */}
        <Animated.View style={[styles.brandRow, { opacity: headerFade }]}>
          <BrandMark size={24} />
          <Text style={styles.brandWordmark}>Barbell<Text style={styles.brandWordmarkAccent}>ix</Text></Text>
        </Animated.View>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{user?.firstName} 👋</Text>
            <View style={styles.nameUnderline} />
          </View>
          <TouchableOpacity style={[styles.notifBtn, glass.card]}>
            <Text style={{ fontSize: 20 }}>🔔</Text>
          </TouchableOpacity>
        </Animated.View>

        <ProfileCard onViewProfile={() => parent?.navigate('Profile')} />

        <AIWizardCTA onPress={() => navigation.navigate('AIWizardBasics')} />

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

        <PerformanceMetricsSection
          prsThisMonth={prsThisMonth}
          avgRpe={avgRpe}
          checkInsThisMonth={attendance?.totalThisMonth ?? 0}
          weightTrendKg={weightTrendKg}
        />

        {/* AI Recommendation */}
        {topRec && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Plan</Text>
            <AICard
              title={topRec.title}
              description={topRec.description}
              onAccept={() => parent?.navigate('AICoach')}
            />
          </View>
        )}

        {/* Explore */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore</Text>
          <View style={styles.exploreGrid}>
            <ExploreCard
              emoji="🏋️" title="Workout" description="Plan your workout"
              onPress={() => parent?.navigate('Workout')} accentColor={colors.primary}
            />
            <ExploreCard
              emoji="🥗" title="Diet" description="Track your nutrition"
              onPress={() => parent?.navigate('Progress', { screen: 'Nutrition' })} accentColor={colors.success}
            />
            <ExploreCard
              emoji="⚖️" title="Weight Tracker" description="Track your progress"
              onPress={() => parent?.navigate('Progress', { screen: 'BodyMetrics' })} accentColor="#FFB347"
            />
            <ExploreCard
              emoji="📊" title="Progress Report" description="View your growth"
              onPress={() => parent?.navigate('Progress')} accentColor={colors.accent}
            />
            <ExploreCard
              emoji="🤝" title="Sponsorship" description="Explore opportunities"
              onPress={() => parent?.navigate('Profile', { screen: 'Sponsorship' })} accentColor="#AF52DE"
            />
            <ExploreCard
              emoji="🧘" title="Classes" description="Book your sessions"
              onPress={() => navigation.navigate('ClassesHome')} accentColor="#22A5AC"
            />
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
                onPress={() => parent?.navigate('Workout', { screen: 'WorkoutHistory' })}
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
