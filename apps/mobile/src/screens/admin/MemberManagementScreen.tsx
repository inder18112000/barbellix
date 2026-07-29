import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { TrainerMemberSummary, UserStatus } from '@barbellix/shared';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import { useTrainerData } from '../../hooks/useTrainerData';
import { styles } from './MemberManagementScreen.styles';

const STATUS_COLOR: Record<UserStatus, string> = { active: colors.success, inactive: '#FFB347', suspended: colors.error };

export function MemberManagementScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const { members, membersLoading, membersError, setMemberStatus } = useTrainerData();

  const filtered = useMemo(() =>
    members.filter((m) => `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(query.toLowerCase())),
    [members, query]);

  const handleMore = (m: TrainerMemberSummary) => {
    const joined = new Date(m.joinDate).toLocaleDateString('en', { month: 'short', year: 'numeric' });
    const nextStatus: UserStatus = m.status === 'suspended' ? 'active' : 'suspended';
    Alert.alert(`${m.firstName} ${m.lastName}`, `Plan: ${m.plan || 'None'}\nStatus: ${m.status}\nJoined: ${joined}`, [
      {
        text: nextStatus === 'suspended' ? 'Suspend' : 'Reactivate',
        style: nextStatus === 'suspended' ? 'destructive' : 'default',
        onPress: () => setMemberStatus({ memberId: m.id, status: nextStatus }),
      },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  return (
    <ScreenShell title="Members" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.topBar}>
          <View style={[styles.searchBar, glass.card]}>
            <Text>🔍</Text>
            <TextInput style={styles.searchInput} value={query} onChangeText={setQuery} placeholder="Search members…" placeholderTextColor={colors.textMuted} />
          </View>
        </View>
        {membersLoading ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
        ) : membersError ? (
          <Text style={[styles.memberMeta, { textAlign: 'center', marginTop: 32 }]}>Couldn't load members.</Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(m) => m.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item: m }) => {
              const col = STATUS_COLOR[m.status];
              const joined = new Date(m.joinDate).toLocaleDateString('en', { month: 'short', year: 'numeric' });
              return (
                <View style={[styles.memberRow, glass.card]}>
                  <View style={styles.avatar}><Text style={styles.avatarText}>{m.firstName[0]}{m.lastName[0]}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{m.firstName} {m.lastName}</Text>
                    <Text style={styles.memberMeta}>{m.plan || 'No active plan'} · {joined}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: col + '25', borderWidth: 1, borderColor: col }]}>
                    <Text style={[styles.statusText, { color: col }]}>{m.status}</Text>
                  </View>
                  <TouchableOpacity style={styles.moreBtn} onPress={() => handleMore(m)}>
                    <Text style={styles.moreBtnText}>⋮</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </ScreenShell>
  );
}
