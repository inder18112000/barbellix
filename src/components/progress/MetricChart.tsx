/**
 * MetricChart -- SRP: SVG line chart for any numeric metric over time.
 * Uses react-native-svg (no victory-native dependency).
 * DIP: receives data[], does not fetch.
 */
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { colors, spacing, borderRadius, typography } from '../../theme';
import { glass } from '../../theme/effects';

const { width } = Dimensions.get('window');
const CHART_W = width - spacing.lg * 4;
const CHART_H = 140;
const PAD = { top: 12, bottom: 28, left: 36, right: 8 };

export interface ChartDataPoint { x: string; y: number; }

interface MetricChartProps {
  title: string;
  unit: string;
  data: ChartDataPoint[];
  color?: string;
  delta?: number;
}

function scalePoints(data: ChartDataPoint[]): string {
  const ys = data.map((d) => d.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeY = maxY - minY || 1;
  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  return data
    .map((d, i) => {
      const x = PAD.left + (i / (data.length - 1)) * innerW;
      const y = PAD.top + innerH - ((d.y - minY) / rangeY) * innerH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function MetricChart({ title, unit, data, color = colors.primary, delta }: MetricChartProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 70, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  if (data.length < 2) {
    return (
      <View style={[styles.card, glass.card, styles.empty]}>
        <Text style={styles.emptyText}>Log more entries to see your chart.</Text>
      </View>
    );
  }

  const latest = data[data.length - 1].y;
  const deltaPos = delta !== undefined ? delta >= 0 : true;
  const deltaColor = deltaPos ? colors.success : colors.error;
  const points = scalePoints(data);
  const lastPt = data[data.length - 1];
  const ys = data.map((d) => d.y);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const innerH = CHART_H - PAD.top - PAD.bottom;
  const innerW = CHART_W - PAD.left - PAD.right;
  const lastX = PAD.left + innerW;
  const lastY = PAD.top + innerH - ((lastPt.y - minY) / (maxY - minY || 1)) * innerH;

  // Y-axis tick labels
  const yTicks = [minY, (minY + maxY) / 2, maxY];
  // X-axis: first and last date labels
  const firstLabel = data[0].x.slice(5);
  const lastLabel = lastPt.x.slice(5);

  return (
    <Animated.View style={[styles.card, glass.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.latest}>{latest.toFixed(1)} <Text style={styles.unit}>{unit}</Text></Text>
        </View>
        {delta !== undefined && (
          <View style={[styles.deltaBadge, { backgroundColor: deltaColor + '20' }]}>
            <Text style={[styles.deltaText, { color: deltaColor }]}>
              {delta >= 0 ? '+' : ''}{delta.toFixed(1)} {unit}
            </Text>
          </View>
        )}
      </View>

      <Svg width={CHART_W} height={CHART_H}>
        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const ty = PAD.top + innerH - ((tick - minY) / (maxY - minY || 1)) * innerH;
          return (
            <React.Fragment key={i}>
              <SvgLine x1={PAD.left} y1={ty} x2={CHART_W - PAD.right} y2={ty}
                stroke={colors.border} strokeWidth={1} strokeDasharray="4 4" />
              <SvgText x={PAD.left - 4} y={ty + 4} fontSize={9} fill={colors.textMuted} textAnchor="end">
                {tick.toFixed(0)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X-axis labels */}
        <SvgText x={PAD.left} y={CHART_H - 2} fontSize={9} fill={colors.textMuted}>{firstLabel}</SvgText>
        <SvgText x={CHART_W - PAD.right} y={CHART_H - 2} fontSize={9} fill={colors.textMuted} textAnchor="end">{lastLabel}</SvgText>

        {/* Line */}
        <Polyline points={points} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Last point dot */}
        <Circle cx={lastX} cy={lastY} r={5} fill={color} stroke={colors.background} strokeWidth={2} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: borderRadius.lg, marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  title: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  latest: { ...typography.h3, color: colors.textPrimary, marginTop: 2 },
  unit: { ...typography.body, color: colors.textSecondary },
  deltaBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.full },
  deltaText: { ...typography.label },
  empty: { alignItems: 'center', padding: spacing.xl },
  emptyText: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
});
