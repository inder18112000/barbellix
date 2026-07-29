import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { Sponsor } from '@barbellix/shared';

import { colors } from '../../theme';
import { ScreenShell } from '../../components/common/ScreenShell';
import { queryKeys, fetchSponsors } from '../../api/queries';
import { styles } from './SponsorshipScreen.styles';

// Bold, high-energy gradients rotated deterministically per sponsor name so a given
// sponsor's colour identity stays stable across app opens (mirrors the web admin's
// gradientFor() convention in apps/web/src/pages/admin/SponsorsPage.tsx).
const GRADIENTS: readonly [string, string][] = [
  ['#7C3AED', '#EC4899'],
  ['#F59E0B', '#EF4444'],
  ['#10B981', '#0A84FF'],
  ['#EC4899', '#0A84FF'],
  ['#0A84FF', '#22D3EE'],
];
function gradientFor(name: string): [string, string] {
  const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length] as [string, string];
}

function SponsorCard({ sponsor }: { sponsor: Sponsor }) {
  const [from, to] = gradientFor(sponsor.name);
  return (
    <View style={styles.card}>
      <LinearGradient colors={[from, to]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.cardHeader}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoBadgeText}>{sponsor.name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.cardHeaderText}>
            <Text style={styles.sponsorName}>{sponsor.name}</Text>
            <View style={styles.activeChip}>
              <Text style={styles.activeChipText}>PARTNER</Text>
            </View>
          </View>
        </View>
        {(sponsor.description || sponsor.websiteUrl) && (
          <View style={styles.cardBody}>
            {sponsor.description && <Text style={styles.sponsorDescription}>{sponsor.description}</Text>}
            {sponsor.websiteUrl && (
              <TouchableOpacity style={styles.visitBtn} onPress={() => Linking.openURL(sponsor.websiteUrl!)}>
                <Text style={[styles.visitBtnText, { color: from }]}>Visit Website</Text>
                <Ionicons name="arrow-forward" size={14} color={from} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

export function SponsorshipScreen() {
  const navigation = useNavigation();
  const { data: sponsors, isPending } = useQuery({ queryKey: queryKeys.sponsors, queryFn: fetchSponsors });

  return (
    <ScreenShell title="Sponsors" onBack={() => navigation.goBack()}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#7C3AED', '#0A84FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.heroBadge}
        >
          <Text style={styles.heroBadgeText}>🤝 BRAND PARTNERS</Text>
        </LinearGradient>
        <Text style={styles.heroTitle}>Powered by</Text>
        <Text style={styles.heroSubtitle}>The brands backing your gym and the perks that come with membership.</Text>

        {isPending ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : sponsors && sponsors.length > 0 ? (
          sponsors.map((sponsor) => <SponsorCard key={sponsor.id} sponsor={sponsor} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🤝</Text>
            <Text style={styles.emptyText}>No sponsors to show yet.{'\n'}Check back soon!</Text>
          </View>
        )}
      </ScrollView>
    </ScreenShell>
  );
}
