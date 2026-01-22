import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

export interface ChatChannel {
  id: string;
  name: string;
  type: 'office' | 'supervisor' | 'property';
  icon: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants?: string[];
}

const mockChannels: ChatChannel[] = [
  {
    id: 'office',
    name: 'Office',
    type: 'office',
    icon: 'home',
    lastMessage: 'Good morning team! Remember to check in when arriving at each property.',
    lastMessageTime: '8:00 AM',
    unreadCount: 2,
    participants: ['Dispatch', 'Admin'],
  },
  {
    id: 'supervisor',
    name: 'My Supervisor',
    type: 'supervisor',
    icon: 'user',
    lastMessage: 'Great work on the Sunnymead inspection!',
    lastMessageTime: '9:30 AM',
    unreadCount: 0,
    participants: ['Mike Rodriguez'],
  },
  {
    id: 'prop_1',
    name: 'Sunnymead Ranch PCA',
    type: 'property',
    icon: 'map-pin',
    lastMessage: 'Pool heater issue reported by resident',
    lastMessageTime: 'Yesterday',
    unreadCount: 1,
  },
  {
    id: 'prop_2',
    name: 'Riverside Community Pool',
    type: 'property',
    icon: 'map-pin',
    lastMessage: 'Chemical levels adjusted',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
  },
  {
    id: 'prop_3',
    name: 'Oak Valley Estates',
    type: 'property',
    icon: 'map-pin',
    lastMessage: 'Filter replacement scheduled for next week',
    lastMessageTime: 'Mon',
    unreadCount: 0,
  },
];

interface ChannelCardProps {
  channel: ChatChannel;
  onPress: () => void;
  index: number;
}

function ChannelCard({ channel, onPress, index }: ChannelCardProps) {
  const { theme } = useTheme();
  
  const getIconColor = () => {
    switch (channel.type) {
      case 'office': return BrandColors.azureBlue;
      case 'supervisor': return BrandColors.vividTangerine;
      case 'property': return BrandColors.tropicalTeal;
      default: return BrandColors.azureBlue;
    }
  };

  const iconColor = getIconColor();

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
      <Pressable 
        style={[styles.channelCard, { backgroundColor: theme.surface }]}
        onPress={onPress}
      >
        <View style={[styles.channelIcon, { backgroundColor: iconColor + '20' }]}>
          <Feather name={channel.icon as any} size={20} color={iconColor} />
        </View>
        <View style={styles.channelContent}>
          <View style={styles.channelHeader}>
            <ThemedText style={styles.channelName} numberOfLines={1}>
              {channel.name}
            </ThemedText>
            <ThemedText style={[styles.channelTime, { color: theme.textSecondary }]}>
              {channel.lastMessageTime}
            </ThemedText>
          </View>
          <View style={styles.channelFooter}>
            <ThemedText 
              style={[styles.channelLastMessage, { color: theme.textSecondary }]} 
              numberOfLines={1}
            >
              {channel.lastMessage}
            </ThemedText>
            {channel.unreadCount > 0 ? (
              <View style={[styles.unreadBadge, { backgroundColor: BrandColors.azureBlue }]}>
                <ThemedText style={styles.unreadText}>{channel.unreadCount}</ThemedText>
              </View>
            ) : null}
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    </Animated.View>
  );
}

interface ChatChannelsScreenProps {
  role: 'serviceTech' | 'supervisor';
}

export default function ChatChannelsScreen({ role = 'serviceTech' }: ChatChannelsScreenProps) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();

  const handleChannelPress = (channel: ChatChannel) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('ChatConversation', { channel });
  };

  const officeChannels = mockChannels.filter(c => c.type === 'office');
  const supervisorChannels = mockChannels.filter(c => c.type === 'supervisor');
  const propertyChannels = mockChannels.filter(c => c.type === 'property');

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <ThemedText style={styles.headerTitle}>Messages</ThemedText>
        <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
          {role === 'supervisor' ? 'Team & Property Chats' : 'Office & Property Chats'}
        </ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ 
          paddingBottom: tabBarHeight + Spacing.lg,
          paddingHorizontal: Spacing.screenPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            DIRECT MESSAGES
          </ThemedText>
          {officeChannels.map((channel, index) => (
            <ChannelCard 
              key={channel.id} 
              channel={channel} 
              onPress={() => handleChannelPress(channel)}
              index={index}
            />
          ))}
          {supervisorChannels.map((channel, index) => (
            <ChannelCard 
              key={channel.id} 
              channel={channel} 
              onPress={() => handleChannelPress(channel)}
              index={index + officeChannels.length}
            />
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            PROPERTY CHANNELS
          </ThemedText>
          {propertyChannels.map((channel, index) => (
            <ChannelCard 
              key={channel.id} 
              channel={channel} 
              onPress={() => handleChannelPress(channel)}
              index={index + officeChannels.length + supervisorChannels.length}
            />
          ))}
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  channelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  channelContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  channelName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  channelTime: {
    fontSize: 12,
    marginLeft: Spacing.sm,
  },
  channelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelLastMessage: {
    fontSize: 13,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
