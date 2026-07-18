import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import { styles } from './MemberManagementScreen.styles';

type Status = 'active' | 'inactive' | 'suspended';

interface Member { id: string; firstName: string; lastName: string; email: string; plan: string; status: Status; joinDate: string; }

const MEMBERS: Member[] = [
  { id: 'm1', firstName: 'Alex',  lastName: 'Chen',   email: 'alex@gym.com',  plan: 'Premium',  status: 'active',    joinDate: 'Jan 2025' },
  { id: 'm2', firstName: 'Priya', lastName: 'Sharma',  email: 'priya@gym.com', plan: 'Basic',    status: 'active',    joinDate: 'Mar 2025' },
  { id: 'm3', firstName: 'Jake',  lastName: 'Wilson',  email: 'jake@gym.com',  plan: 'Premium',  status: 'inactive',  joinDate: 'Jun 2025' },
  { id: 'm4', firstName: 'Maria', lastName: 'Lopez',   email: 'maria@gym.com', plan: 'Premium',  status: 'active',    joinDate: 'Nov 2024' },
  { id: 'm5', firstName: 'Sam',   lastName: 'Park',    email: 'sam@gym.com',   plan: 'Trial',    status: 'active',    joinDate: 'Jan 2026' },
  { id: 'm6', firstName: 'Troy',  lastName: 'Hughes',  email: 'troy@gym.com',  plan: 'Basic',    status: 'suspended', joinDate: 'Sep 2024' },
];

const STATUS_COLOR: Record<Status, string> = { active: colors.success, inactive: '#FFB347', suspended: colors.error };

export function MemberManagementScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() =>
    MEMBERS.filter((m) => `${m.firstName} ${m.lastName} ${m.email}`.toLowerCase().includes(query.toLowerCase())),
    [query]);

  const handleMore = (m: Member) => {
    Alert.alert(`${m.firstName} ${m.lastName}`, `Plan: ${m.plan}\nStatus: ${m.status}\nJoined: ${m.joinDate}`, [
      { text: 'Suspend', style: 'destructive', onPress: () => {} },
      { text: 'Edit Plan', onPress: () => {} },
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
        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          renderItem={({ item: m }) => {
            const col = STATUS_COLOR[m.status];
            return (
              <View style={[styles.memberRow, glass.card]}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{m.firstName[0]}{m.lastName[0]}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.memberName}>{m.firstName} {m.lastName}</Text>
                  <Text style={styles.memberMeta}>{m.plan} · {m.joinDate}</Text>
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
      </SafeAreaView>
    </ScreenShell>
  );
}
