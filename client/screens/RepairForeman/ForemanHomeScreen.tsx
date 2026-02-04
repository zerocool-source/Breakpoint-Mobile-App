import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  FlatList,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface EstimatePreview {
  id: string;
  estimateNumber: string;
  propertyName: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface AssignedJob {
  id: string;
  jobNumber: string;
  propertyName: string;
  propertyAddress: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  scheduledTime: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'dismissed';
  estimatedDuration: string;
  contactName?: string;
  contactPhone?: string;
}

const mockAssignedJobs: AssignedJob[] = [
  {
    id: 'job-1',
    jobNumber: 'WO-2026-0158',
    propertyName: 'Sunset Valley HOA',
    propertyAddress: '1250 Sunset Blvd, San Diego, CA 92101',
    description: 'Pool pump making unusual noise. Customer reports reduced water flow.',
    priority: 'high',
    scheduledTime: '2026-02-03T09:00:00Z',
    status: 'pending',
    estimatedDuration: '2 hours',
    contactName: 'Maria Garcia',
    contactPhone: '(619) 555-0142',
  },
  {
    id: 'job-2',
    jobNumber: 'WO-2026-0159',
    propertyName: 'Marina Bay Apartments',
    propertyAddress: '450 Marina Way, San Diego, CA 92109',
    description: 'Annual pool equipment inspection and assessment for potential upgrades.',
    priority: 'medium',
    scheduledTime: '2026-02-03T11:30:00Z',
    status: 'pending',
    estimatedDuration: '1.5 hours',
    contactName: 'James Wilson',
    contactPhone: '(619) 555-0198',
  },
  {
    id: 'job-3',
    jobNumber: 'WO-2026-0160',
    propertyName: 'Hilltop Country Club',
    propertyAddress: '8900 Hilltop Dr, La Jolla, CA 92037',
    description: 'Chemical feeder malfunction. pH levels unstable.',
    priority: 'high',
    scheduledTime: '2026-02-03T14:00:00Z',
    status: 'pending',
    estimatedDuration: '1 hour',
    contactName: 'Robert Chen',
    contactPhone: '(858) 555-0234',
  },
];

const priorityConfig = {
  high: { label: 'High', color: '#FF3B30', bg: 'rgba(255,59,48,0.15)' },
  medium: { label: 'Medium', color: BrandColors.vividTangerine, bg: 'rgba(255,128,0,0.15)' },
  low: { label: 'Low', color: BrandColors.azureBlue, bg: 'rgba(0,120,212,0.15)' },
};

const mockEstimates: EstimatePreview[] = [
  {
    id: '1',
    estimateNumber: 'EST-2026-0042',
    propertyName: 'Sunset Valley HOA',
    status: 'draft',
    total: 2450.00,
    createdAt: '2026-02-03T10:00:00Z',
    updatedAt: '2026-02-03T10:30:00Z',
  },
  {
    id: '2',
    estimateNumber: 'EST-2026-0041',
    propertyName: 'Marina Bay Apartments',
    status: 'sent',
    total: 5680.00,
    createdAt: '2026-02-02T14:00:00Z',
    updatedAt: '2026-02-02T16:00:00Z',
  },
  {
    id: '3',
    estimateNumber: 'EST-2026-0040',
    propertyName: 'Hilltop Country Club',
    status: 'approved',
    total: 12340.00,
    createdAt: '2026-02-01T09:00:00Z',
    updatedAt: '2026-02-02T11:00:00Z',
  },
];

const statusConfig = {
  draft: { label: 'Draft', color: BrandColors.azureBlue, bg: 'rgba(0,120,212,0.15)' },
  sent: { label: 'Sent', color: BrandColors.vividTangerine, bg: 'rgba(255,128,0,0.15)' },
  approved: { label: 'Approved', color: BrandColors.emerald, bg: 'rgba(34,214,154,0.15)' },
  rejected: { label: 'Rejected', color: '#FF3B30', bg: 'rgba(255,59,48,0.15)' },
};

export default function ForemanHomeScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<AssignedJob[]>(mockAssignedJobs);

  const firstName = user?.name?.split(' ')[0] || 'Foreman';
  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const acceptedJobs = jobs.filter(j => j.status === 'accepted' || j.status === 'in_progress');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleNewEstimate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AceEstimateBuilder');
  };

  const handleViewDrafts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Drafts');
  };

  const handleEstimatePress = (estimate: EstimatePreview) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (estimate.status === 'draft') {
      navigation.navigate('AceEstimateBuilder', { estimateId: estimate.id });
    }
  };

  const handleAcceptJob = (jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: 'accepted' as const } : j
    ));
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      navigation.navigate('JobDetails', { job: { ...job, status: 'accepted' } });
    }
  };

  const handleDismissJob = (jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: 'dismissed' as const } : j
    ));
  };

  const handleViewJobDetails = (job: AssignedJob) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('JobDetails', { job });
  };

  const renderEstimateCard = ({ item }: { item: EstimatePreview }) => {
    const config = statusConfig[item.status];
    return (
      <Pressable
        style={[styles.estimateCard, { backgroundColor: theme.surface }]}
        onPress={() => handleEstimatePress(item)}
      >
        <View style={styles.estimateHeader}>
          <View>
            <ThemedText style={styles.estimateNumber}>{item.estimateNumber}</ThemedText>
            <ThemedText style={[styles.propertyName, { color: theme.textSecondary }]}>
              {item.propertyName}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <ThemedText style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </ThemedText>
          </View>
        </View>
        <View style={styles.estimateFooter}>
          <ThemedText style={[styles.total, { color: BrandColors.azureBlue }]}>
            ${(item.total / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </ThemedText>
          <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
            {new Date(item.updatedAt).toLocaleDateString()}
          </ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + 100 },
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom + 85 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <View style={styles.greeting}>
          <ThemedText style={styles.greetingText}>Good morning,</ThemedText>
          <ThemedText style={styles.nameText}>{firstName}</ThemedText>
        </View>

        <Pressable
          style={[styles.newEstimateButton, { backgroundColor: BrandColors.vividTangerine }]}
          onPress={handleNewEstimate}
        >
          <View style={styles.newEstimateContent}>
            <Image
              source={require('../../../assets/images/ace-avatar.png')}
              style={styles.aceAvatar}
            />
            <View style={styles.newEstimateText}>
              <ThemedText style={styles.newEstimateTitle}>New Estimate</ThemedText>
              <ThemedText style={styles.newEstimateSubtitle}>
                Speak or type to create
              </ThemedText>
            </View>
          </View>
          <Feather name="chevron-right" size={24} color="#fff" />
        </Pressable>

        {pendingJobs.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Today's Jobs</ThemedText>
              <View style={[styles.jobCountBadge, { backgroundColor: BrandColors.vividTangerine }]}>
                <ThemedText style={styles.jobCountText}>{pendingJobs.length}</ThemedText>
              </View>
            </View>
            {pendingJobs.map((job) => {
              const priority = priorityConfig[job.priority];
              const time = new Date(job.scheduledTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
              return (
                <View key={job.id} style={[styles.jobCard, { backgroundColor: theme.surface }]}>
                  <View style={styles.jobHeader}>
                    <View style={styles.jobTitleRow}>
                      <ThemedText style={styles.jobNumber}>{job.jobNumber}</ThemedText>
                      <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
                        <ThemedText style={[styles.priorityText, { color: priority.color }]}>
                          {priority.label}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.jobPropertyName}>{job.propertyName}</ThemedText>
                    <ThemedText style={[styles.jobAddress, { color: theme.textSecondary }]} numberOfLines={1}>
                      {job.propertyAddress}
                    </ThemedText>
                  </View>
                  <ThemedText style={[styles.jobDescription, { color: theme.textSecondary }]} numberOfLines={2}>
                    {job.description}
                  </ThemedText>
                  <View style={styles.jobMeta}>
                    <View style={styles.jobMetaItem}>
                      <Feather name="clock" size={14} color={theme.textSecondary} />
                      <ThemedText style={[styles.jobMetaText, { color: theme.textSecondary }]}>
                        {time}
                      </ThemedText>
                    </View>
                    <View style={styles.jobMetaItem}>
                      <Feather name="watch" size={14} color={theme.textSecondary} />
                      <ThemedText style={[styles.jobMetaText, { color: theme.textSecondary }]}>
                        {job.estimatedDuration}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.jobActions}>
                    <Pressable
                      style={[styles.dismissButton, { borderColor: theme.border }]}
                      onPress={() => handleDismissJob(job.id)}
                    >
                      <Feather name="x" size={18} color={theme.textSecondary} />
                      <ThemedText style={[styles.dismissText, { color: theme.textSecondary }]}>
                        Dismiss
                      </ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.acceptButton, { backgroundColor: BrandColors.emerald }]}
                      onPress={() => handleAcceptJob(job.id)}
                    >
                      <Feather name="check" size={18} color="#fff" />
                      <ThemedText style={styles.acceptText}>Accept</ThemedText>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {acceptedJobs.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Active Jobs</ThemedText>
            </View>
            {acceptedJobs.map((job) => (
              <Pressable
                key={job.id}
                style={[styles.activeJobCard, { backgroundColor: theme.surface }]}
                onPress={() => handleViewJobDetails(job)}
              >
                <View style={styles.activeJobInfo}>
                  <ThemedText style={styles.jobNumber}>{job.jobNumber}</ThemedText>
                  <ThemedText style={styles.jobPropertyName}>{job.propertyName}</ThemedText>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </Pressable>
            ))}
          </>
        )}

        <View style={styles.statsRow}>
          <Pressable
            style={[styles.statCard, { backgroundColor: theme.surface }]}
            onPress={handleViewDrafts}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(0,120,212,0.15)' }]}>
              <Feather name="edit-3" size={20} color={BrandColors.azureBlue} />
            </View>
            <ThemedText style={styles.statValue}>3</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Drafts
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,128,0,0.15)' }]}>
              <Feather name="send" size={20} color={BrandColors.vividTangerine} />
            </View>
            <ThemedText style={styles.statValue}>5</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Sent
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(34,214,154,0.15)' }]}>
              <Feather name="check-circle" size={20} color={BrandColors.emerald} />
            </View>
            <ThemedText style={styles.statValue}>12</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Approved
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Recent Estimates</ThemedText>
          <Pressable onPress={handleViewDrafts}>
            <ThemedText style={[styles.viewAll, { color: BrandColors.azureBlue }]}>
              View All
            </ThemedText>
          </Pressable>
        </View>

        {mockEstimates.map((estimate) => (
          <View key={estimate.id}>
            {renderEstimateCard({ item: estimate })}
          </View>
        ))}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    flexGrow: 1,
  },
  greeting: {
    marginBottom: Spacing.lg,
  },
  greetingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '700',
  },
  newEstimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  newEstimateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  newEstimateIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aceAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  newEstimateText: {
    gap: 2,
  },
  newEstimateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  newEstimateSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  estimateCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  estimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  estimateNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  propertyName: {
    fontSize: 13,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  estimateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
  },
  jobCountBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  jobCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  jobCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  jobHeader: {
    gap: 4,
  },
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobNumber: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  jobPropertyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  jobAddress: {
    fontSize: 13,
  },
  jobDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  jobMeta: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobMetaText: {
    fontSize: 13,
  },
  jobActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  dismissButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '500',
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  activeJobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  activeJobInfo: {
    gap: 2,
  },
});
