import React, { useState, useRef } from 'react';
import { View, StyleSheet, TextInput, Pressable, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'office';
  senderName: string;
  timestamp: string;
}

const initialMessages: Message[] = [
  {
    id: '1',
    text: 'Good morning! Let me know if you need anything today.',
    sender: 'office',
    senderName: 'Office',
    timestamp: '8:00 AM',
  },
  {
    id: '2',
    text: 'Will do! Heading to first stop now.',
    sender: 'user',
    senderName: 'You',
    timestamp: '8:05 AM',
  },
  {
    id: '3',
    text: 'Great! The customer at Sunnymead called - they mentioned the pool heater might need inspection.',
    sender: 'office',
    senderName: 'Office',
    timestamp: '8:15 AM',
  },
];

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();
  const { theme } = useTheme();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (!inputText.trim()) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      senderName: 'You',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser && styles.messageContainerUser]}>
        {!isUser && (
          <Avatar name={item.senderName} size="small" backgroundColor={BrandColors.azureBlue} />
        )}
        <View style={[
          styles.messageBubble,
          isUser ? styles.messageBubbleUser : styles.messageBubbleOffice,
          { backgroundColor: isUser ? BrandColors.azureBlue : theme.surface },
        ]}>
          <ThemedText style={[styles.messageText, isUser && { color: '#FFFFFF' }]}>
            {item.text}
          </ThemedText>
          <ThemedText style={[
            styles.messageTime, 
            { color: isUser ? 'rgba(255,255,255,0.7)' : theme.textSecondary }
          ]}>
            {item.timestamp}
          </ThemedText>
        </View>
        {isUser && (
          <Avatar name={user?.name} size="small" backgroundColor={BrandColors.emerald} />
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <ThemedText style={styles.headerTitle}>Office Chat</ThemedText>
        <View style={styles.onlineIndicator}>
          <View style={styles.onlineDot} />
          <ThemedText style={[styles.onlineText, { color: theme.textSecondary }]}>Online</ThemedText>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.messagesList, { paddingBottom: Spacing.lg }]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      <View style={[styles.inputContainer, { paddingBottom: tabBarHeight + Spacing.md }]}>
        <View style={[styles.inputWrapper, { backgroundColor: theme.surface }]}>
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
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Feather name="send" size={20} color="#FFFFFF" />
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
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.emerald,
  },
  onlineText: {
    fontSize: 13,
  },
  messagesList: {
    padding: Spacing.screenPadding,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  messageContainerUser: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  messageBubbleUser: {
    borderBottomRightRadius: BorderRadius.xs,
  },
  messageBubbleOffice: {
    borderBottomLeftRadius: BorderRadius.xs,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BrandColors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BorderRadius.lg,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
    ...Shadows.card,
  },
  input: {
    flex: 1,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.azureBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: BrandColors.disabled,
  },
});
