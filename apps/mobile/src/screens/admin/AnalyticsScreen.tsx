import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { queryKeys, fetchAdminAttendanceAnalytics } from '../../api/queries';
import { ScreenShell } from '../../components/common/ScreenShell';
import { styles } from './AnalyticsScreen.styles';

const DAY_ABBRS = ['M','T','W','T','F','S','S'];
const FALLBACK_COUNTS = [32,28,41,38,45,20,15,35,30,42,39,44,18,12,40,37,43,41,47,22,18,38,35,44,40,46,19,14,41,47];
const PEAK_HOURS = [
  { hour: '6AM', count: 22 },{ hour: '8AM', count: 34 },{ hour: '10AM', count: 18 },
  { hour: '12PM', count: 26 },{ hour: '2PM', count: 15 },{ hour: '4PM', count: 48 },
  { hour: '6PM', count: 38 },{ hour: '8PM', count: 11 },
];
const maxPeak = Math.max(...PEAK_HOURS.map((h) => h.count));

export function AnalyticsScreen() {
  const navigation = useNavigation();
  const { data: analytics } = useQuery({ queryKey: queryKeys.admin.attendanceAnalytics, queryFn: fetchAdminAttendanceAnalytics });

  const chartCounts = (analytics && analytics.length > 0)
    ? analytics.map((a) => a.count)
    : FALLBACK_COUNTS;
  const maxCount = Math.max(...chartCounts);

  return (
    <ScreenShell title="Analytics" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Summary stats */}
          <View style={[styles.section, { marginTop: 16 }]}>
            <View style={styles.statRow}>
              {[
                { value: '1,247', label: 'Total Check-ins (30d)' },
                { value: '41.6', label: 'Daily Avg' },
                { value: '127', label: 'Active Members' },
              ].map((s) => (
                <View key={s.label} style={[styles.statCard, glass.card]}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Daily bar chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Attendance (30 days)</Text>
            <View style={[styles.chartCard, glass.card]}>
              <View style={styles.barRow}>
                {chartCounts.slice(-14).map((count, i) => {
                  const heightPct = count / maxCount;
                  const isToday = i === 13;
                  return (
                    <View key={i} style={styles.barWrap}>
                      <Text style={styles.barValue}>{count}</Text>
                      <View style={[styles.bar, { height: Math.max(8, heightPct * 64), backgroundColor: isToday ? colors.primary : colors.primary + '40' }]} />
                      <Text style={styles.barLabel}>{DAY_ABBRS[i % 7]}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Peak hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peak Hours (Today)</Text>
            <View style={[styles.chartCard, glass.card]}>
              <View style={styles.peakRow}>
                {PEAK_HOURS.map((h) => {
                  const heightPct = h.count / maxPeak;
                  const isPeak = h.count === maxPeak;
                  return (
                    <View key={h.hour} style={styles.peakHour}>
                      <Text style={styles.peakHourCount}>{h.count}</Text>
                      <View style={[styles.peakHourBar, { height: Math.max(4, heightPct * 60), backgroundColor: isPeak ? colors.primary : colors.primary + '40' }]} />
                      <Text style={styles.peakHourLabel}>{h.hour}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

        </ScrollView>
      </SafeAreaView>
    </ScreenShell>
  );
}