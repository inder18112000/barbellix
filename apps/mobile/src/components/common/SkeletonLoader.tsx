/**
 * SkeletonLoader -- SRP: animated shimmer placeholder for loading states.
 * OCP: width/height/borderRadius props let it shape into any skeleton.
 * Usage: replace real content with <SkeletonLoader w={200} h={20} /> while loading.
 */
import React, { useRef, useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { colors, borderRadius as radii } from '../../theme';

interface SkeletonLoaderProps {
  w?: number | string;
  h?: number;
  radius?: number;
  style?: object;
}

export function SkeletonLoader({ w = '100%', h = 16, radius = radii.sm, style }: SkeletonLoaderProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <Animated.View
      style={[
        styles.base,
        { width: w as any, height: h, borderRadius: radius, opacity },
        style,
      ]}
    />
  );
}

// -- Preset compositions ------------------------------------------------------

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <View style={styles.card}>
      <SkeletonLoader w={120} h={14} radius={4} style={{ marginBottom: 8 }} />
      {Array.from({ length: lines }, (_, i) => (
        <SkeletonLoader key={i} w={i === lines - 1 ? '70%' : '100%'} h={12} radius={4} style={{ marginBottom: 6 }} />
      ))}
    </View>
  );
}

export function SkeletonListScreen({ rows = 4 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={styles.listRow}>
          <SkeletonLoader w={44} h={44} radius={22} />
          <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
            <SkeletonLoader h={14} radius={4} />
            <SkeletonLoader w="60%" h={12} radius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.surfaceElevated },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: { paddingHorizontal: 16 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
