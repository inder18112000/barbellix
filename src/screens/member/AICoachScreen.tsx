import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  TextInput, PanResponder, Animated, Dimensions,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing, borderRadius, typography } from '../../theme';
import { glass, glow } from '../../theme/effects';
import { queryKeys, acceptRecommendation } from '../../api/queries';
import { useAICoach } from '../../hooks/useAICoach';
import { useLocalCoach, localCoachReply } from '../../hooks/useLocalCoach';
import { useClientContext } from '../../hooks/useClientContext';
import { aiCoachService, type AIMessage } from '../../ai';
import { SkeletonCard } from '../../components/common/SkeletonLoader';
import { styles, CARD_WIDTH } from './AICoachScreen.styles';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.35;

const QUICK_QUESTIONS = [
  'What should I train today?',
  'Suggest a meal to hit my protein goal',
  "How is my progress this week?",
  'How can I improve my bench press?',
];

interface ChatMessage { id: string; from: 'user' | 'ai'; text: string; }

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(d, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.3, duration: 280, useNativeDriver: true }),
          Animated.delay((dots.length - 1 - i) * 180),
        ]),
      ),
    );
    const combined = Animated.parallel(anims);
    combined.start();
    return () => combined.stop();
  }, []);

  return (
    <View style={[typingStyles.bubble, glass.card]}>
      <View style={typingStyles.dotsRow}>
        {dots.map((d, i) => (
          <Animated.View key={i} style={[typingStyles.dot, { opacity: d }]} />
        ))}
      </View>
    </View>
  );
}

const typingStyles = {
  bubble: {
    alignSelf: 'flex-start' as const,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    borderRadius: borderRadius.lg, borderBottomLeftRadius: 4,
    marginHorizontal: spacing.md,
  },
  dotsRow: { flexDirection: 'row' as const, gap: 5, alignItems: 'center' as const },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
};

// ─── Swipe card ───────────────────────────────────────────────────────────────

function SwipeCard({ rec, onAccept, onDismiss }: { rec: any; onAccept: () => void; onDismiss: () => void }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const rotate = translateX.interpolate({ inputRange: [-width / 2, 0, width / 2], outputRange: ['-8deg', '0deg', '8deg'] });
  const acceptOpacity = translateX.interpolate({ inputRange: [0, SWIPE_THRESHOLD], outputRange: [0, 1], extrapolate: 'clamp' });
  const dismissOpacity = translateX.interpolate({ inputRange: [-SWIPE_THRESHOLD, 0], outputRange: [1, 0], extrapolate: 'clamp' });

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, g) => translateX.setValue(g.dx),
    onPanResponderRelease: (_, g) => {
      if (g.dx > SWIPE_THRESHOLD) {
        Animated.timing(translateX, { toValue: width, duration: 250, useNativeDriver: true }).start(onAccept);
      } else if (g.dx < -SWIPE_THRESHOLD) {
        Animated.timing(translateX, { toValue: -width, duration: 250, useNativeDriver: true }).start(onDismiss);
      } else {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      }
    },
  })).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[styles.swipeCard, glass.cardStrong, glow.primary, { transform: [{ translateX }, { rotate }] }]}
    >
      <Animated.View style={[styles.overlayAccept, { opacity: acceptOpacity }]}>
        <Text style={[styles.overlayText, { color: colors.success }]}>✓ Accept</Text>
      </Animated.View>
      <Animated.View style={[styles.overlayDismiss, { opacity: dismissOpacity }]}>
        <Text style={[styles.overlayText, { color: colors.error }]}>✕ Skip</Text>
      </Animated.View>
      <Text style={styles.cardEmoji}>{rec.emoji ?? '🤖'}</Text>
      <Text style={styles.cardTitle}>{rec.title}</Text>
      <Text style={styles.cardBody}>{rec.body ?? rec.description}</Text>
      <Text style={styles.cardType}>{rec.type?.replace(/_/g, ' ')}</Text>
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function AICoachScreen() {
  const qc = useQueryClient();
  const { recommendations, isLoading: recsLoading } = useAICoach();
  const localCoachData = useLocalCoach();
  const systemContext = useClientContext();
  const scrollRef = useRef<ScrollView>(null);
  const { bottom: bottomInset } = useSafeAreaInsets();

  // Scroll to bottom whenever keyboard opens so the latest message stays visible
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    });
    return () => sub.remove();
  }, []);

  const [cardIndex, setCardIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init', from: 'ai',
      text: "Hey! I'm your AI coach. I can see your workouts, PRs, nutrition, and habits — so every answer is based on your actual data, not generic advice. Ask me anything below or swipe the cards above 💪",
    },
  ]);
  const [draft, setDraft] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<AIMessage[]>([]);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);

  const { mutate: doAccept } = useMutation({
    mutationFn: (id: string) => acceptRecommendation(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.ai.recommendations }),
  });

  const handleAccept = () => {
    if (recommendations[cardIndex]?.id) doAccept(recommendations[cardIndex].id);
    setCardIndex(i => i + 1);
  };
  const handleDismiss = () => setCardIndex(i => i + 1);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: ChatMessage = { id: String(Date.now()), from: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setDraft('');
    setIsTyping(true);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    let reply = '';
    let provider = 'local';

    try {
      const result = await aiCoachService.complete({
        systemPrompt: systemContext,
        history: conversationHistory,
        userMessage: text,
      });
      reply = result.text;
      provider = result.providerId;
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: reply },
      ]);
    } catch {
      // All API providers failed or no keys — use on-device coach
      await new Promise(r => setTimeout(r, 600));
      reply = localCoachReply(text, localCoachData);
      provider = 'local';
    }

    setActiveProvider(provider);
    setMessages(prev => [...prev, { id: String(Date.now() + 1), from: 'ai', text: reply }]);
    setIsTyping(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  if (recsLoading) return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 16, gap: 12 }}>
        <SkeletonCard lines={3} />
        <SkeletonCard lines={2} />
      </View>
    </SafeAreaView>
  );

  const currentRec = recommendations[cardIndex];

  return (
    // edges excludes 'bottom' — KeyboardAvoidingView owns that space
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >

        {/* Header */}
        <View style={headerStyles.header}>
          <View style={headerStyles.aiAvatar}>
            <Ionicons name="flash" size={18} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={headerStyles.title}>AI Coach</Text>
            <Text style={headerStyles.subtitle}>Knows your workouts, nutrition & habits</Text>
          </View>
          {activeProvider && (
            <View style={[headerStyles.providerBadge, activeProvider === 'local' && headerStyles.providerBadgeLocal]}>
              <Text style={[headerStyles.providerText, activeProvider === 'local' && headerStyles.providerTextLocal]}>
                  {activeProvider === 'groq'       ? '⚡ Groq'
                : activeProvider === 'gemini'     ? '✦ Gemini'
                : activeProvider === 'openrouter' ? '🔀 OpenRouter'
                : activeProvider === 'claude'     ? '◆ Claude'
                : '📱 Local'}
              </Text>
            </View>
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Stack */}
          <View style={styles.stackArea}>
            {recommendations.slice(cardIndex + 1, cardIndex + 3).map((rec, i) => (
              <Animated.View key={rec.id} style={[styles.swipeCard, glass.card, { transform: [{ scale: 1 - (i + 1) * 0.04 }, { translateY: (i + 1) * 8 }], zIndex: -i }]} />
            ))}
            {currentRec ? (
              <SwipeCard rec={currentRec} onAccept={handleAccept} onDismiss={handleDismiss} />
            ) : (
              <View style={[styles.emptyCard, glass.card]}>
                <Text style={styles.emptyEmoji}>🎯</Text>
                <Text style={styles.emptyText}>All caught up! New recommendations appear after your next session.</Text>
              </View>
            )}
          </View>

          {/* Swipe actions */}
          {currentRec && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error + '18', borderWidth: 1, borderColor: colors.error + '60' }]} onPress={handleDismiss} activeOpacity={0.8}>
                <Ionicons name="close" size={24} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success + '18', borderWidth: 1, borderColor: colors.success + '60' }]} onPress={handleAccept} activeOpacity={0.8}>
                <Ionicons name="checkmark" size={24} color={colors.success} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.divider} />

          {/* Quick chips */}
          <Text style={styles.chatLabel}>Quick questions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
            {QUICK_QUESTIONS.map(q => (
              <TouchableOpacity
                key={q}
                style={[styles.chip, glass.card, isTyping && { opacity: 0.5 }]}
                onPress={() => sendMessage(q)}
                disabled={isTyping}
                activeOpacity={0.8}
              >
                <Text style={styles.chipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Chat messages */}
          <View style={styles.chatMessages}>
            {messages.map(m =>
              m.from === 'user' ? (
                <View key={m.id} style={styles.userBubble}>
                  <Text style={styles.userBubbleText}>{m.text}</Text>
                </View>
              ) : (
                <View key={m.id} style={[styles.aiBubble, glass.card]}>
                  <Text style={styles.aiBubbleText}>{m.text}</Text>
                </View>
              )
            )}
            {isTyping && <TypingDots />}
          </View>

        </ScrollView>

        {/* Input row — sits above keyboard, respects home indicator */}
        <View style={[
          styles.inputRow,
          { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm, paddingBottom: Math.max(bottomInset, spacing.sm) },
        ]}>
          <TextInput
            style={[styles.chatInput, glass.card]}
            value={draft}
            onChangeText={setDraft}
            placeholder="Ask anything about your training…"
            placeholderTextColor={colors.textMuted}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(draft)}
            editable={!isTyping}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!draft.trim() || isTyping) && { opacity: 0.4 }]}
            onPress={() => sendMessage(draft)}
            disabled={!draft.trim() || isTyping}
            activeOpacity={0.85}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const headerStyles = {
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aiAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  title: { ...typography.h4, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textMuted },
  providerBadge: {
    backgroundColor: colors.primary + '18',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  providerBadgeLocal: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  providerText: { fontSize: 10, fontWeight: '600' as const, color: colors.primary },
  providerTextLocal: { color: colors.textMuted },
};
