import React, { useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import type { TrainerStackParams } from '../../navigation/types';
import { styles } from './MessageMemberScreen.styles';

type Route = RouteProp<TrainerStackParams, 'MessageMember'>;

interface Message { id: string; text: string; from: 'trainer' | 'member'; time: string; }

const INITIAL_MESSAGES: Message[] = [
  { id: '1', from: 'member', text: 'Hey coach, my knee has been a bit sore after leg day.', time: '2:10 PM' },
  { id: '2', from: 'trainer', text: 'Thanks for letting me know. Let\'s swap squats for leg press this week and add some band work. How does that sound?', time: '2:14 PM' },
  { id: '3', from: 'member', text: 'Sounds great, thanks! Should I skip deadlifts too?', time: '2:16 PM' },
];

export function MessageMemberScreen() {
  const navigation = useNavigation();
  const { memberId } = useRoute<Route>().params;
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState('');
  const flatRef = useRef<FlatList>(null);

  const send = () => {
    if (!draft.trim()) return;
    const msg: Message = { id: String(Date.now()), from: 'trainer', text: draft.trim(), time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) };
    setMessages((prev) => [...prev, msg]);
    setDraft('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <ScreenShell title="Message Member" onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            style={styles.messageList}
            contentContainerStyle={{ paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: m }) => {
              const isTrainer = m.from === 'trainer';
              return (
                <View style={[styles.bubble, glass.card, isTrainer ? styles.bubbleTrainer : styles.bubbleMember]}>
                  <Text style={[styles.bubbleText, isTrainer ? styles.bubbleTextTrainer : styles.bubbleTextMember]}>{m.text}</Text>
                  <Text style={[styles.bubbleTime, !isTrainer && styles.bubbleTimeMember]}>{m.time}</Text>
                </View>
              );
            }}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, glass.card]}
              value={draft}
              onChangeText={setDraft}
              placeholder="Type a message…"
              placeholderTextColor={colors.textMuted}
              multiline
              returnKeyType="default"
            />
            <TouchableOpacity style={styles.sendBtn} onPress={send} activeOpacity={0.85}>
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenShell>
  );
}
