import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform, Modal } from 'react-native';
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
import { useUrgentAlerts, UrgentAlert } from '@/context/UrgentAlertsContext';
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
  const { alerts, markAsRead, clearAlert } = useUrgentAlerts();
  const [selectedAlert, setSelectedAlert] = useState<UrgentAlert | null>(null);

  const handleChannelPress = (channel: ChatChannel) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('ChatConversation', { channel });
  };

  const handleAlertPress = (alert: UrgentAlert) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    markAsRead(alert.id);
    setSelectedAlert(alert);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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

      <Modal
        visible={selectedAlert !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedAlert(null)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setSelectedAlert(null)} style={styles.modalClose}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.modalTitle}>Alert Details</ThemedText>
            <View style={{ width: 24 }} />
          </View>
          {selectedAlert ? (
            <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
              <View style={[styles.alertDetailHeader, { backgroundColor: BrandColors.danger }]}>
                <View style={styles.alertDetailIconContainer}>
                  <Feather name="alert-circle" size={32} color="#FFFFFF" />
                </View>
                <ThemedText style={styles.alertDetailTitle}>{selectedAlert.title}</ThemedText>
                <ThemedText style={styles.alertDetailTime}>
                  {formatTime(selectedAlert.timestamp)}
                </ThemedText>
              </View>
              <View style={[styles.alertDetailBody, { backgroundColor: theme.surface }]}>
                <ThemedText style={[styles.alertDetailLabel, { color: theme.textSecondary }]}>
                  MESSAGE
                </ThemedText>
                <ThemedText style={styles.alertDetailMessage}>{selectedAlert.message}</ThemedText>
                
                {selectedAlert.property ? (
                  <>
                    <ThemedText style={[styles.alertDetailLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
                      PROPERTY
                    </ThemedText>
                    <ThemedText style={styles.alertDetailMessage}>{selectedAlert.property}</ThemedText>
                  </>
                ) : null}
                
                {selectedAlert.details ? (
                  <>
                    <ThemedText style={[styles.alertDetailLabel, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
                      ADDITIONAL DETAILS
                    </ThemedText>
                    <ThemedText style={styles.alertDetailMessage}>{selectedAlert.details}</ThemedText>
                  </>
                ) : null}
              </View>
              <Pressable 
                style={[styles.acknowledgeButton, { backgroundColor: BrandColors.azureBlue }]}
                onPress={() => {
                  clearAlert(selectedAlert.id);
                  setSelectedAlert(null);
                }}
              >
                <Feather name="check" size={20} color="#FFFFFF" />
                <ThemedText style={styles.acknowledgeButtonText}>Acknowledge & Dismiss</ThemedText>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ 
          paddingBottom: tabBarHeight + Spacing.lg,
          paddingHorizontal: Spacing.screenPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        {alerts.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.urgentHeader}>
              <ThemedText style={[styles.sectionTitle, { color: BrandColors.danger }]}>
                URGENT ALERTS
              </ThemedText>
              <View style={styles.urgentBadge}>
                <ThemedText style={styles.urgentBadgeText}>{alerts.length}</ThemedText>
              </View>
            </View>
            {alerts.map((alert, index) => (
              <Animated.View key={alert.id} entering={FadeInDown.delay(index * 50).springify()}>
                <Pressable
                  style={[
                    styles.alertCard,
                    { backgroundColor: theme.surface },
                    !alert.isRead && styles.alertCardUnread,
                  ]}
                  onPress={() => handleAlertPress(alert)}
                >
                  <View style={[styles.alertIconContainer, { backgroundColor: BrandColors.danger + '20' }]}>
                    <Feather name="alert-circle" size={24} color={BrandColors.danger} />
                  </View>
                  <View style={styles.alertContent}>
                    <ThemedText style={styles.alertTitle} numberOfLines={1}>{alert.title}</ThemedText>
                    <ThemedText style={[styles.alertMessage, { color: theme.textSecondary }]} numberOfLines={2}>
                      {alert.message}
                    </ThemedText>
                    <ThemedText style={[styles.alertTime, { color: theme.textSecondary }]}>
                      {formatTime(alert.timestamp)}
                    </ThemedText>
                  </View>
                  <Feather name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>
              </Animated.View>
            ))}
          </View>
        ) : null}

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
  urgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  urgentBadge: {
    backgroundColor: BrandColors.danger,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  alertCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.danger,
  },
  alertIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  alertContent: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 13,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 11,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  modalClose: {
    padding: Spacing.sm,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  alertDetailHeader: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  alertDetailIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  alertDetailTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  alertDetailTime: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  alertDetailBody: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  alertDetailLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  alertDetailMessage: {
    fontSize: 16,
    lineHeight: 24,
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
