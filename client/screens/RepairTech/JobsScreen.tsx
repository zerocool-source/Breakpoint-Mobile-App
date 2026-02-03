import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Platform, Alert, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { BubbleBackground } from '@/components/BubbleBackground';
import { ChatFAB } from '@/components/ChatFAB';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { getLocalApiUrl, joinUrl } from '@/lib/query-client';
import { safeApiRequest, checkNetworkConnection, getErrorMessage } from '@/lib/apiHelper';
import type { Job } from '@/types';

interface JobDetailCardProps {
  job: Job;
  isFirst: boolean;
  onNavigate: () => void;
  onDetails: () => void;
  onComplete: () => void;
  onViewHistory: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}

function JobDetailCard({ job, isFirst, onNavigate, onDetails, onComplete, onViewHistory, onAccept, onDismiss }: JobDetailCardProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.jobCard, { backgroundColor: theme.surface }, isFirst && styles.jobCardFirst]}>
      {isFirst ? (
        <View style={styles.nextStopBadge}>
          <ThemedText style={styles.nextStopBadgeText}>NEXT STOP</ThemedText>
        </View>
      ) : null}
      
      <View style={styles.jobCardHeader}>
        <View style={styles.jobCardTitleRow}>
          <ThemedText style={styles.jobCardTitle}>{job.property?.name}</ThemedText>
          <ThemedText style={[styles.jobCardTime, { color: BrandColors.azureBlue }]}>
            {job.scheduledTime}
          </ThemedText>
        </View>
        <View style={styles.jobCardSubtitleRow}>
          <ThemedText style={[styles.jobCardType, { color: BrandColors.vividTangerine }]}>
            {job.title}
          </ThemedText>
          <ThemedText style={[styles.jobCardDistance, { color: theme.textSecondary }]}>
            3.2 mi
          </ThemedText>
        </View>
      </View>

      <View style={styles.jobCardAddressRow}>
        <Feather name="map-pin" size={14} color={theme.textSecondary} />
        <ThemedText style={[styles.jobCardAddress, { color: theme.textSecondary }]} numberOfLines={2}>
          {job.property?.address}
        </ThemedText>
      </View>

      <View style={styles.attachmentsSection}>
        <View style={styles.attachmentsHeader}>
          <Feather name="paperclip" size={12} color={theme.textSecondary} />
          <ThemedText style={[styles.attachmentsLabel, { color: theme.textSecondary }]}>
            ATTACHMENTS FROM OFFICE
          </ThemedText>
        </View>
        <View style={styles.attachmentsThumbnails}>
          <View style={[styles.attachmentThumb, { backgroundColor: BrandColors.tropicalTeal + '30' }]}>
            <Feather name="image" size={20} color={BrandColors.tropicalTeal} />
          </View>
          <View style={[styles.attachmentThumb, { backgroundColor: BrandColors.azureBlue + '30' }]}>
            <Feather name="image" size={20} color={BrandColors.azureBlue} />
          </View>
        </View>
        <ThemedText style={[styles.attachmentCaption, { color: theme.textSecondary }]}>
          Current pump motor - note the rust on housing
        </ThemedText>
      </View>

      <View style={styles.jobCardActions}>
        <Pressable 
          style={[styles.navigateButton, { backgroundColor: BrandColors.azureBlue }]}
          onPress={onNavigate}
        >
          <Feather name="navigation" size={16} color="#FFFFFF" />
          <ThemedText style={styles.navigateButtonText}>Navigate</ThemedText>
        </Pressable>
        <Pressable 
          style={[styles.detailsButton, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}
          onPress={onDetails}
        >
          <Feather name="file-text" size={16} color={theme.text} />
          <ThemedText style={styles.detailsButtonText}>Details</ThemedText>
        </Pressable>
      </View>
      
      <Pressable 
        style={[styles.historyButton, { backgroundColor: BrandColors.tropicalTeal + '15', borderColor: BrandColors.tropicalTeal }]}
        onPress={onViewHistory}
      >
        <Feather name="clock" size={16} color={BrandColors.tropicalTeal} />
        <ThemedText style={[styles.historyButtonText, { color: BrandColors.tropicalTeal }]}>View Repair History</ThemedText>
      </Pressable>

      {job.status === 'pending' ? (
        <View style={styles.acceptDismissRow}>
          <Pressable 
            style={[styles.acceptButton, { backgroundColor: BrandColors.emerald }]}
            onPress={onAccept}
          >
            <Feather name="check-circle" size={16} color="#FFFFFF" />
            <ThemedText style={styles.acceptButtonText}>Accept</ThemedText>
          </Pressable>
          <Pressable 
            style={[styles.dismissButton, { backgroundColor: theme.backgroundRoot, borderColor: BrandColors.danger }]}
            onPress={onDismiss}
          >
            <Feather name="x-circle" size={16} color={BrandColors.danger} />
            <ThemedText style={[styles.dismissButtonText, { color: BrandColors.danger }]}>Dismiss</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {isFirst && job.status === 'in_progress' ? (
        <Pressable 
          style={[styles.completeButton, { backgroundColor: BrandColors.emerald }]}
          onPress={onComplete}
        >
          <Feather name="check" size={18} color="#FFFFFF" />
          <ThemedText style={styles.completeButtonText}>Verify & Complete</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [jobs, setJobs] = useState<Job[]>([]);

  // Fetch jobs from API
  const { data: jobsData, isLoading: isLoadingJobs, refetch: refetchJobs } = useQuery<Job[]>({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const apiUrl = getLocalApiUrl();
      const response = await fetch(joinUrl(apiUrl, '/api/jobs'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      return response.json();
    },
    enabled: !!token,
  });

  useEffect(() => {
    if (jobsData) {
      setJobs(jobsData);
    }
  }, [jobsData]);

  const handleChatPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('Chat');
  };

  const handleNavigateToJob = async (job: Job) => {
    const address = job.property?.address;
    if (!address) {
      Alert.alert('No Address', 'This job does not have an address to navigate to.');
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const encodedAddress = encodeURIComponent(address);
    let url = '';
    if (Platform.OS === 'ios') {
      url = `maps://app?daddr=${encodedAddress}`;
    } else if (Platform.OS === 'android') {
      url = `google.navigation:q=${encodedAddress}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    }
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      Alert.alert('Navigation Error', 'Could not open maps application.');
    }
  };

  const handleCompleteJob = (jobId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const handleAcceptJob = async (jobId: string) => {
    const isConnected = await checkNetworkConnection();
    if (!isConnected) {
      Alert.alert('No Connection', 'Please check your internet connection and try again.');
      return;
    }

    const result = await safeApiRequest(`/api/jobs/${jobId}/accept`, {
      method: 'PATCH',
      showAlerts: false,
    });

    if (result.success) {
      refetchJobs();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (result.status === 401) {
        Alert.alert('Session Expired', 'Please log in again to continue.');
      } else if (result.status === 403) {
        Alert.alert('Access Denied', 'You don\'t have permission to accept this job.');
      } else if (result.status && result.status >= 500) {
        Alert.alert('Service Unavailable', 'The server is temporarily unavailable. Please try again in a moment.');
      } else {
        Alert.alert('Error', result.error || 'Failed to accept job. Please try again.');
      }
    }
  };

  const handleDismissJob = async (jobId: string) => {
    Alert.alert(
      'Dismiss Job',
      'Are you sure you want to dismiss this job?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Dismiss', 
          style: 'destructive',
          onPress: async () => {
            const isConnected = await checkNetworkConnection();
            if (!isConnected) {
              Alert.alert('No Connection', 'Please check your internet connection and try again.');
              return;
            }

            const result = await safeApiRequest(`/api/jobs/${jobId}/dismiss`, {
              method: 'PATCH',
              showAlerts: false,
            });

            if (result.success) {
              refetchJobs();
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
            } else {
              if (result.status === 401) {
                Alert.alert('Session Expired', 'Please log in again to continue.');
              } else if (result.status && result.status >= 500) {
                Alert.alert('Service Unavailable', 'The server is temporarily unavailable. Please try again.');
              } else {
                Alert.alert('Error', result.error || 'Failed to dismiss job.');
              }
            }
          }
        }
      ]
    );
  };

  const handleViewHistory = (job: Job) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('RepairHistory', {
      propertyId: job.property?.id,
      propertyName: job.property?.name,
    });
  };

  const handleAdminChat = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('AdminChat');
  };

  return (
    <BubbleBackground bubbleCount={12}>
      <LinearGradient
        colors={['#0078D4', '#0066B8', '#005499']}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Avatar name={user?.name || 'Rick'} size="medium" />
            <ThemedText style={styles.headerTitle}>Repair Tech App</ThemedText>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: tabBarHeight + Spacing.fabSize + Spacing['2xl'] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View>
              <ThemedText style={styles.pageTitle}>Today's Jobs</ThemedText>
              <ThemedText style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
                {jobs.length} jobs assigned
              </ThemedText>
            </View>
          </View>

          {isLoadingJobs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BrandColors.azureBlue} />
              <ThemedText style={styles.loadingText}>Loading jobs...</ThemedText>
            </View>
          ) : jobs.length > 0 ? (
            jobs.map((item, index) => (
              <Animated.View 
                key={item.id} 
                entering={FadeInDown.delay(100 + index * 50).springify()}
              >
                <JobDetailCard
                  job={item}
                  isFirst={index === 0}
                  onNavigate={() => handleNavigateToJob(item)}
                  onDetails={() => console.log('View job details:', item.id)}
                  onComplete={() => handleCompleteJob(item.id)}
                  onViewHistory={() => handleViewHistory(item)}
                  onAccept={() => handleAcceptJob(item.id)}
                  onDismiss={() => handleDismissJob(item.id)}
                />
              </Animated.View>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Feather name="check-circle" size={48} color={BrandColors.emerald} />
              <ThemedText style={styles.emptyTitle}>All Caught Up!</ThemedText>
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No jobs scheduled for today
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      <ChatFAB onPress={handleChatPress} bottom={tabBarHeight} />
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  pageSubtitle: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    marginTop: Spacing.xs,
  },
  jobCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  jobCardFirst: {
    borderWidth: 2,
    borderColor: BrandColors.vividTangerine,
  },
  nextStopBadge: {
    position: 'absolute',
    top: -10,
    left: Spacing.lg,
    backgroundColor: BrandColors.vividTangerine,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  nextStopBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  jobCardHeader: {
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  jobCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  jobCardTime: {
    fontSize: 15,
    fontWeight: '600',
  },
  jobCardSubtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  jobCardType: {
    fontSize: 14,
    fontWeight: '500',
  },
  jobCardDistance: {
    fontSize: 13,
  },
  jobCardAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  jobCardAddress: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  attachmentsSection: {
    marginBottom: Spacing.md,
  },
  attachmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  attachmentsLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  attachmentsThumbnails: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  attachmentThumb: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentCaption: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  jobCardActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  navigateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  navigateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  historyButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  acceptDismissRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
