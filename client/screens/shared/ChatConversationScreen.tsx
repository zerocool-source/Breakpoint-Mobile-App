import React, { useState, useRef, useLayoutEffect } from 'react';
import { View, StyleSheet, TextInput, Pressable, FlatList, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { VoiceRecorderButton } from '@/components/VoiceRecorderButton';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import type { ChatChannel } from './ChatChannelsScreen';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'other';
  senderName: string;
  timestamp: string;
}

const getInitialMessages = (channelType: string): Message[] => {
  if (channelType === 'office') {
    return [
      { id: '1', text: 'Good morning team! Remember to check in when arriving at each property.', sender: 'other', senderName: 'Dispatch', timestamp: '8:00 AM' },
      { id: '2', text: 'Will do! Heading to first stop now.', sender: 'user', senderName: 'You', timestamp: '8:05 AM' },
      { id: '3', text: 'Great! The customer at Sunnymead called - they mentioned the pool heater might need inspection.', sender: 'other', senderName: 'Admin', timestamp: '8:15 AM' },
    ];
  } else if (channelType === 'supervisor') {
    return [
      { id: '1', text: 'Hey, how\'s it going today?', sender: 'other', senderName: 'Mike Rodriguez', timestamp: '9:00 AM' },
      { id: '2', text: 'Good! Just finished up at Sunnymead.', sender: 'user', senderName: 'You', timestamp: '9:25 AM' },
      { id: '3', text: 'Great work on the Sunnymead inspection!', sender: 'other', senderName: 'Mike Rodriguez', timestamp: '9:30 AM' },
    ];
  } else {
    return [
      { id: '1', text: 'Pool heater issue reported by resident - needs inspection.', sender: 'other', senderName: 'Office', timestamp: 'Yesterday' },
      { id: '2', text: 'I\'ll take a look when I\'m there this afternoon.', sender: 'user', senderName: 'You', timestamp: 'Yesterday' },
    ];
  }
};

type ChatConversationRouteProp = RouteProp<{ ChatConversation: { channel: ChatChannel } }, 'ChatConversation'>;

export default function ChatConversationScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<ChatConversationRouteProp>();
  const flatListRef = useRef<FlatList>(null);
  
  const { channel } = route.params;
  const [messages, setMessages] = useState<Message[]>(getInitialMessages(channel.type));
  const [inputText, setInputText] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: channel.name,
    });
  }, [navigation, channel.name]);

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

  const handleVoiceRecordingComplete = (uri: string, duration: number) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text: `Voice note (${Math.round(duration)}s)`,
      sender: 'user',
      senderName: 'You',
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[styles.messageContainer, isUser && styles.messageContainerUser]}>
        {!isUser ? (
          <Avatar name={item.senderName} size="small" />
        ) : null}
        <View style={[
          styles.messageBubble,
          isUser ? styles.messageBubbleUser : styles.messageBubbleOther,
          { backgroundColor: isUser ? BrandColors.azureBlue : theme.surface },
        ]}>
          {!isUser ? (
            <ThemedText style={[styles.senderName, { color: BrandColors.azureBlue }]}>
              {item.senderName}
            </ThemedText>
          ) : null}
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
        {isUser ? (
          <Avatar name="You" size="small" />
        ) : null}
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Feather name="message-circle" size={48} color={theme.textSecondary} />
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        No messages yet. Start the conversation!
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
        data={messages.toReversed()}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        inverted={messages.length > 0}
        ListEmptyComponent={EmptyState}
        contentContainerStyle={[
          styles.messagesList,
          messages.length === 0 && styles.messagesListEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      <View style={[
        styles.inputContainer, 
        { 
          backgroundColor: theme.surface, 
          borderTopColor: theme.border,
          paddingBottom: insets.bottom + Spacing.sm,
        }
      ]}>
        <View style={styles.inputRow}>
          <VoiceRecorderButton 
            compact 
            label=""
            onRecordingComplete={handleVoiceRecordingComplete}
          />
          <TextInput
            style={[styles.textInput, { 
              backgroundColor: theme.backgroundSecondary, 
              color: theme.text,
              borderColor: theme.border,
            }]}
            placeholder="Type a message..."
            placeholderTextColor={theme.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <Pressable 
            style={[
              styles.sendButton, 
              { backgroundColor: inputText.trim() ? BrandColors.azureBlue : theme.backgroundSecondary }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Feather 
              name="send" 
              size={20} 
              color={inputText.trim() ? '#FFFFFF' : theme.textSecondary} 
            />
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
  messagesList: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
  },
  messagesListEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  messageContainerUser: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  messageBubbleUser: {
    borderBottomRightRadius: BorderRadius.xs,
  },
  messageBubbleOther: {
    borderBottomLeftRadius: BorderRadius.xs,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['3xl'],
  },
  emptyText: {
    fontSize: 14,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  inputContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
