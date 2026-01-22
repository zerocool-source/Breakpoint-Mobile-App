import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TextInput, Pressable, FlatList, Platform } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { mockChatMessages } from '@/lib/mockData';
import type { ChatMessage } from '@/types';

export default function ChatModal() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputText, setInputText] = useState('');

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newMessage: ChatMessage = {
      id: String(Date.now()),
      senderId: user?.id || '1',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
      isUser: true,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');

    setTimeout(() => {
      const response: ChatMessage = {
        id: String(Date.now() + 1),
        senderId: 'support',
        content: 'Thanks for your message! A support representative will get back to you shortly.',
        timestamp: new Date().toISOString(),
        isUser: false,
      };
      setMessages(prev => [...prev, response]);
    }, 1000);
  }, [inputText, user?.id]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => (
      <Animated.View
        entering={FadeInUp.delay(index * 50).springify()}
        style={[
          styles.messageContainer,
          item.isUser ? styles.userMessageContainer : styles.supportMessageContainer,
        ]}
      >
        {!item.isUser ? (
          <Avatar name="Support" size="small" />
        ) : null}
        <View
          style={[
            styles.messageBubble,
            item.isUser
              ? [styles.userBubble, { backgroundColor: BrandColors.azureBlue }]
              : [styles.supportBubble, { backgroundColor: theme.surface }],
          ]}
        >
          <ThemedText
            style={[
              styles.messageText,
              { color: item.isUser ? '#FFFFFF' : theme.text },
            ]}
          >
            {item.content}
          </ThemedText>
          <ThemedText
            style={[
              styles.timestamp,
              { color: item.isUser ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
            ]}
          >
            {formatTime(item.timestamp)}
          </ThemedText>
        </View>
      </Animated.View>
    ),
    [theme]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="message-circle" size={48} color={theme.textSecondary} />
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Start a conversation with support
      </ThemedText>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          styles.messageList,
          { paddingTop: headerHeight + Spacing.lg },
          messages.length === 0 && styles.emptyList,
        ]}
        onContentSizeChange={() => {
          if (messages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: true });
          }
        }}
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm, backgroundColor: theme.backgroundRoot }]}>
        <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? BrandColors.vividTangerine : theme.border },
            ]}
          >
            <Feather name="send" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: Spacing['3xl'],
  },
  emptyText: {
    marginTop: Spacing.lg,
    fontSize: 15,
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  supportMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userBubble: {
    borderBottomRightRadius: BorderRadius.xs,
  },
  supportBubble: {
    marginLeft: Spacing.sm,
    borderBottomLeftRadius: BorderRadius.xs,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
