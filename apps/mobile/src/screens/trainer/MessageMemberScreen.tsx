import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Message } from '@barbellix/shared';

import { colors } from '../../theme';
import { glass } from '../../theme/effects';
import { ScreenShell } from '../../components/common/ScreenShell';
import { useAuthStore } from '../../store/authStore';
import { useTrainerData } from '../../hooks/useTrainerData';
import { queryKeys, fetchMessageThread, sendMessage, markMessageRead } from '../../api/queries';
import type { TrainerStackParams } from '../../navigation/types';
import { styles } from './MessageMemberScreen.styles';

type Route = RouteProp<TrainerStackParams, 'MessageMember'>;

export function MessageMemberScreen() {
  const navigation = useNavigation();
  const { memberId } = useRoute<Route>().params;
  const { user } = useAuthStore();
  const { members } = useTrainerData();
  const member = members.find((m) => m.id === memberId);

  const qc = useQueryClient();
  const [draft, setDraft] = useState('');
  const flatRef = useRef<FlatList>(null);

  const { data: messages = [], isLoading } = useQuery({
    queryKey: queryKeys.messages(memberId),
    queryFn: () => fetchMessageThread(memberId),
  });

  const { mutate: send, isPending: sending } = useMutation({
    mutationFn: (text: string) => sendMessage(memberId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.messages(memberId) });
      setDraft('');
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    },
  });

  const { mutate: markRead } = useMutation({ mutationFn: (id: string) => markMessageRead(id) });

  // Mark anything the member sent us as read once the thread is open.
  useEffect(() => {
    messages.filter((m) => !m.read && m.senderId === memberId).forEach((m) => markRead(m.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const handleSend = () => {
    if (!draft.trim() || sending) return;
    send(draft.trim());
  };

  return (
    <ScreenShell title={member ? `${member.firstName} ${member.lastName}` : 'Message Member'} onBack={() => navigation.goBack()}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={colors.primary} />
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(m) => m.id}
              style={styles.messageList}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
              ListEmptyComponent={
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 32 }}>No messages yet - say hello.</Text>
              }
              renderItem={({ item: m }: { item: Message }) => {
                const isTrainer = m.senderId === user?.id;
                const time = new Date(m.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
                return (
                  <View style={[styles.bubble, glass.card, isTrainer ? styles.bubbleTrainer : styles.bubbleMember]}>
                    <Text style={[styles.bubbleText, isTrainer ? styles.bubbleTextTrainer : styles.bubbleTextMember]}>{m.text}</Text>
                    <Text style={[styles.bubbleTime, !isTrainer && styles.bubbleTimeMember]}>{time}</Text>
                  </View>
                );
              }}
            />
          )}

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
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} activeOpacity={0.85} disabled={sending}>
              <Text style={styles.sendBtnText}>➤</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenShell>
  );
}
