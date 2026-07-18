/**
 * VolumeBarChart -- SRP: weekly training volume as a bar chart using react-native-svg.
 */
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { glass } from '../../theme/effects';

const { width } = Dimensions.get('window');
const CHART_W = width - spacing.lg * 4;
const CHART_H = 120;
const PAD = { top: 8, bottom: 24, left: 8, right: 8 };

export interface VolumeDataPoint { x: string; y: number; }

export function VolumeBarChart({ data }: { data: VolumeDataPoint[] }) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.y)) || 1;
  const thisWeek = data[data.length - 1];
  const lastWeek = data.length >= 2 ? data[data.length - 2] : null;
  const delta = lastWeek ? thisWeek.y - lastWeek.y : 0;
  const deltaColor = delta >= 0 ? colors.success : colors.error;

  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;
  const barW = Math.max(4, innerW / data.length - 4);

  return (
    <View style={[styles.card, glass.card]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Weekly Volume</Text>
          <Text style={styles.value}>
            {(thisWeek.y / 1000).toFixed(1)} <Text style={styles.unit}>t this week</Text>
          </Text>
        </View>
        {lastWeek && (
          <View style={[styles.deltaBadge, { backgroundColor: deltaColor + '20' }]}>
            <Text style={[styles.deltaText, { color: deltaColor }]}>
              {delta >= 0 ? 'up' : 'dn'} {Math.abs(delta / 1000).toFixed(1)}t
            </Text>
          </View>
        )}
      </View>

      <Svg width={CHART_W} height={CHART_H}>
        {data.map((d, i) => {
          const barH = (d.y / maxVal) * innerH;
          const x = PAD.left + (i / data.length) * innerW + 2;
          const y = PAD.top + innerH - barH;
          const isThis = d.x === thisWeek.x;
          return (
            <React.Fragment key={d.x}>
              <Rect
                x={x} y={y} width={barW} height={barH}
                rx={3} fill={isThis ? colors.primary : colors.primary + '50'}
              />
              {i % 2 === 0 && (
                <SvgText x={x + barW / 2} y={CHART_H - 2} fontSize={8} fill={colors.textMuted} textAnchor="middle">
                  {d.x}
                </SvgText>
              )}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  value: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
  unit: { ...typography.body, color: colors.textSecondary },
  deltaBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  deltaText: { ...typography.label },
});
