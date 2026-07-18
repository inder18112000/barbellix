import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { glass, glow } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { useTrainerData } from '../../hooks/useTrainerData';
import type { TrainerStackParams } from '../../navigation/types';
import { styles } from './MemberDetailScreen.styles';

type Route = RouteProp<TrainerStackParams, 'MemberDetail'>;

export function MemberDetailScreen() {
  const navigation = useNavigation<any>();
  const { memberId } = useRoute<Route>().params;
  const { members, membersLoading } = useTrainerData();

  if (membersLoading) return (
    <ScreenShell title="Member" onBack={() => navigation.goBack()}>
      <View style={{ padding: 16, gap: 12 }}>
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </View>
    </ScreenShell>
  );

  const m = members.find((mem) => mem.id === memberId) ?? members[0];
  if (!m) return (
    <ScreenShell title="Member" onBack={() => navigation.goBack()}>
      <View style={{ padding: 24 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Member not found.</Text>
      </View>
    </ScreenShell>
  );

  const initials = `${m.firstName[0]}${m.lastName[0]}`;

  return (
    <ScreenShell title={`${m.firstName} ${m.lastName}`} onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.hero}>
            <View style={[styles.avatar, glow.primary]}><Text style={styles.avatarText}>{initials}</Text></View>
            <Text style={styles.memberName}>{m.firstName} {m.lastName}</Text>
            <Text style={styles.memberEmail}>{m.email} · Joined {m.joinDate}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statCard, glass.card]}><Text style={styles.statValue}>{m.sessionsCount}</Text><Text style={styles.statLabel}>Sessions</Text></View>
            <View style={[styles.statCard, glass.card]}><Text style={styles.statValue}>{m.streak}</Text><Text style={styles.statLabel}>Streak</Text></View>
            <View style={[styles.statCard, glass.card]}><Text style={styles.statValue}>{m.plan}</Text><Text style={styles.statLabel}>Plan</Text></View>
          </View>

          {[
            { label: 'Assign / Change Plan', screen: 'AssignPlan' },
            { label: 'Message Member', screen: 'MessageMember' },
          ].map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionBtn, glass.card]}
              onPress={() => navigation.navigate(a.screen, { memberId })}
              activeOpacity={0.85}
            >
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionChevron}>›</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}
