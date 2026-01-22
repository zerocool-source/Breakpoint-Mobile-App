import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Image, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { BubbleBackground } from '@/components/BubbleBackground';
import { ChatFAB } from '@/components/ChatFAB';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockJobs } from '@/lib/mockData';
import type { Job } from '@/types';

interface JobDetailCardProps {
  job: Job;
  isFirst: boolean;
  onNavigate: () => void;
  onDetails: () => void;
  onComplete: () => void;
}

function JobDetailCard({ job, isFirst, onNavigate, onDetails, onComplete }: JobDetailCardProps) {
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

      {isFirst ? (
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
  const { user } = useAuth();
  const { theme } = useTheme();

  const jobs = mockJobs;

  const handleChatPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('Chat');
  };

  const handleNavigate = (job: Job) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleDetails = (job: Job) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleComplete = (job: Job) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
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

          {jobs.map((job, index) => (
            <Animated.View 
              key={job.id} 
              entering={FadeInDown.delay(100 + index * 50).springify()}
            >
              <JobDetailCard
                job={job}
                isFirst={index === 0}
                onNavigate={() => handleNavigate(job)}
                onDetails={() => handleDetails(job)}
                onComplete={() => handleComplete(job)}
              />
            </Animated.View>
          ))}
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
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
