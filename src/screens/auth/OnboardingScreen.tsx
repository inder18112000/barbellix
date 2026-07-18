import React, { useRef, useState } from 'react';
import { View, Text, Dimensions, Animated, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { colors } from '../../theme';
import { styles } from './OnboardingScreen.styles';

const { width } = Dimensions.get('window');

const SLIDES = [
  { key: 'track',   emoji: '📊', title: 'Track Every Rep',        body: 'Log workouts, monitor volume, and see your strength grow week by week with beautiful charts.', bg: colors.primary },
  { key: 'ai',      emoji: '🤖', title: 'AI-Powered Coaching',    body: 'Your personal AI coach adapts your plan based on performance, recovery, and goals — in real time.', bg: '#7B4FD8' },
  { key: 'checkin', emoji: '⚡', title: 'Seamless Check-In',      body: 'Scan a QR code at the gym door. Your streak, attendance history, and membership — all in one tap.', bg: colors.accent },
];

// ─── Slide (SRP) ─────────────────────────────────────────────────────────────

function Slide({ item }: { item: typeof SLIDES[0] }) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -12, duration: 1800, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.emojiCircle, { backgroundColor: item.bg + '30', transform: [{ translateY: floatAnim }] }]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </Animated.View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideBody}>{item.body}</Text>
    </View>
  );
}

// ─── Dot Indicator (SRP) ─────────────────────────────────────────────────────

function DotIndicator({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={[styles.dot, i === active && styles.dotActive, i === active && { backgroundColor: SLIDES[active].bg }]} />
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function OnboardingScreen() {
  const navigation = useNavigation<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
      setActiveIndex((i) => i + 1);
    } else {
      navigation.replace('Register');
    }
  };

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skip} onPress={() => navigation.replace('Login')}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <Slide item={item} />}
        onMomentumScrollEnd={(e) => setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      />
      <View style={styles.bottom}>
        <DotIndicator count={SLIDES.length} active={activeIndex} />
        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: SLIDES[activeIndex].bg }]} onPress={handleNext}>
          <Text style={styles.nextBtnText}>{isLast ? 'Get Started →' : 'Next'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.replace('Login')}>
          <Text style={styles.loginLinkText}>Already have an account? <Text style={{ color: colors.primary }}>Log in</Text></Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
