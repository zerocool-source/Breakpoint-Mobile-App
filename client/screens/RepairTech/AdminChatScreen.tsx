import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, TextInput, Pressable, FlatList, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { getAuthApiUrl, joinUrl } from '@/lib/query-client';

interface AdminMessage {
  id: string;
  senderId: string;
  content: string;
  subject?: string;
  priority: 'normal' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  isFromAdmin: boolean;
  createdAt: string;
  sender?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  property?: {
    name: string;
  };
}

interface MessageBubbleProps {
  message: AdminMessage;
  isOwnMessage: boolean;
}

function MessageBubble({ message, isOwnMessage }: MessageBubbleProps) {
  const { theme } = useTheme();
  
  const senderName = message.sender?.firstName && message.sender?.lastName
    ? `${message.sender.firstName} ${message.sender.lastName}`
    : message.isFromAdmin ? 'Office' : 'You';
    
  const time = new Date(message.createdAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  
  return (
    <View style={[
      styles.messageBubbleContainer,
      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
    ]}>
      {!isOwnMessage ? (
        <Avatar name={senderName} size="small" />
      ) : null}
      
      <View style={[
        styles.messageBubble,
        isOwnMessage 
          ? { backgroundColor: BrandColors.azureBlue }
          : { backgroundColor: theme.surface },
      ]}>
        {!isOwnMessage ? (
          <ThemedText style={[styles.senderName, { color: BrandColors.vividTangerine }]}>
            {senderName}
          </ThemedText>
        ) : null}
        
        {message.subject ? (
          <ThemedText style={[
            styles.messageSubject,
            isOwnMessage ? { color: '#FFFFFF' } : { color: theme.text }
          ]}>
            {message.subject}
          </ThemedText>
        ) : null}
        
        <ThemedText style={[
          styles.messageContent,
          isOwnMessage ? { color: '#FFFFFF' } : { color: theme.text }
        ]}>
          {message.content}
        </ThemedText>
        
        <View style={styles.messageFooter}>
          {message.priority === 'urgent' ? (
            <View style={styles.urgentBadge}>
              <Feather name="alert-circle" size={10} color="#FFFFFF" />
              <ThemedText style={styles.urgentText}>URGENT</ThemedText>
            </View>
          ) : null}
          <ThemedText style={[
            styles.messageTime,
            isOwnMessage ? { color: 'rgba(255,255,255,0.7)' } : { color: theme.textSecondary }
          ]}>
            {time}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

function EmptyMessages() {
  const { theme } = useTheme();
  
  return (
    <View style={styles.emptyContainer}>
      <Feather name="message-circle" size={48} color={theme.textSecondary} />
      <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
        Message the Office
      </ThemedText>
      <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
        Send a message to the office for support, questions, or to report issues.
      </ThemedText>
    </View>
  );
}

export default function AdminChatScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const inputRef = useRef<TextInput>(null);
  
  const [message, setMessage] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);

  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['/api/admin-messages'],
    queryFn: async () => {
      const url = joinUrl(getAuthApiUrl(), '/api/admin-messages');
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      return response.json();
    },
    enabled: !!token,
    refetchInterval: 10000,
  });

  const messages: AdminMessage[] = messagesData || [];
  
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; priority: string }) => {
      const url = joinUrl(getAuthApiUrl(), '/api/admin-messages');
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin-messages'] });
      setMessage('');
      setIsUrgent(false);
    },
  });

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleSend = () => {
    if (!message.trim()) return;
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    sendMessageMutation.mutate({
      content: message.trim(),
      priority: isUrgent ? 'urgent' : 'normal',
    });
  };

  const toggleUrgent = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsUrgent(!isUrgent);
  };

  const renderMessage = useCallback(({ item, index }: { item: AdminMessage; index: number }) => {
    const isOwnMessage = item.senderId === user?.id;
    return (
      <Animated.View entering={FadeInUp.delay(index * 30).springify()}>
        <MessageBubble message={item} isOwnMessage={isOwnMessage} />
      </Animated.View>
    );
  }, [user?.id]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={[BrandColors.vividTangerine, '#E86B00', '#D45A00']}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerContent}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Office Chat</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Direct line to admin
            </ThemedText>
          </View>
          <Avatar name="Office" size="medium" />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={sortedMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted={sortedMessages.length > 0}
          contentContainerStyle={[
            styles.messagesList,
            sortedMessages.length === 0 && styles.emptyMessagesList,
          ]}
          ListEmptyComponent={isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BrandColors.azureBlue} />
            </View>
          ) : (
            <EmptyMessages />
          )}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        <View style={[
          styles.inputContainer,
          { 
            backgroundColor: theme.surface,
            paddingBottom: insets.bottom + Spacing.sm,
          }
        ]}>
          <Pressable
            style={[
              styles.urgentButton,
              isUrgent && { backgroundColor: BrandColors.danger }
            ]}
            onPress={toggleUrgent}
          >
            <Feather 
              name="alert-circle" 
              size={20} 
              color={isUrgent ? '#FFFFFF' : theme.textSecondary} 
            />
          </Pressable>
          
          <TextInput
            ref={inputRef}
            style={[
              styles.input,
              { 
                backgroundColor: theme.backgroundRoot,
                color: theme.text,
              }
            ]}
            placeholder="Message the office..."
            placeholderTextColor={theme.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={1000}
          />
          
          <Pressable
            style={[
              styles.sendButton,
              message.trim() 
                ? { backgroundColor: BrandColors.azureBlue }
                : { backgroundColor: theme.textSecondary + '40' }
            ]}
            onPress={handleSend}
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Feather name="send" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 2,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
  },
  emptyMessagesList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  ownMessageContainer: {
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageSubject: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    gap: 3,
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  messageTime: {
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  urgentButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
});
