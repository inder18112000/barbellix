import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { Ionicons } from '@expo/vector-icons';
import { ScreenShell } from '../../components/common/ScreenShell';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { ErrorState } from '../../components/common/ErrorState';
import { useTrainerData } from '../../hooks/useTrainerData';
import type { TrainerMemberSummary } from '@fitpulse/shared';
import { styles } from './MemberListScreen.styles';

export function MemberListScreen() {
  const navigation = useNavigation<any>();
  const { members, membersLoading, membersError, refetchMembers } = useTrainerData();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      members.filter((m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [members, query],
  );

  if (membersLoading) return (
    <ScreenShell title="All Members" onBack={() => navigation.goBack()}>
      <View style={{ padding: 16, gap: 12 }}>
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
        <SkeletonCard lines={2} />
      </View>
    </ScreenShell>
  );

  if (membersError) return (
    <ScreenShell title="All Members" onBack={() => navigation.goBack()}>
      <ErrorState message="Could not load members." onRetry={refetchMembers} />
    </ScreenShell>
  );

  return (
    <ScreenShell title="All Members" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={[styles.searchBar, glass.card]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search members..."
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item: m }: { item: TrainerMemberSummary }) => {
            const initials = `${m.firstName[0]}${m.lastName[0]}`;
            return (
              <TouchableOpacity
                style={[styles.memberRow, glass.card]}
                onPress={() => navigation.navigate('MemberDetail', { memberId: m.id })}
                activeOpacity={0.85}
              >
                <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.firstName} {m.lastName}</Text>
                  <Text style={styles.memberMeta}>{m.email}</Text>
                </View>
                <View style={styles.badgeRow}>
                  <View style={styles.streakBadge}><Text style={styles.streakText}>🔥 {m.streak}</Text></View>
                  <View style={styles.planBadge}><Text style={styles.planText}>{m.plan}</Text></View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </ScreenShell>
  );
}
