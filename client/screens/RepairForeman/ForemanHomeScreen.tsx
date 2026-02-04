import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BubbleBackground } from '@/components/BubbleBackground';
import { EarningsTimer } from '@/components/EarningsTimer';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { getApiUrl } from '@/lib/query-client';

interface EstimatePreview {
  id: string;
  estimateNumber: string;
  propertyName: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'needs_review' | 'pending';
  totalAmount: number;
  createdAt: string;
  sentAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
}

interface ForemanEstimatesResponse {
  estimates: EstimatePreview[];
  stats: {
    drafts: number;
    sent: number;
    approved: number;
    rejected: number;
    totalApprovedAmount: number;
  };
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


const priorityConfig = {
  high: { label: 'High', color: '#FF3B30', bg: 'rgba(255,59,48,0.15)' },
  medium: { label: 'Medium', color: BrandColors.vividTangerine, bg: 'rgba(255,128,0,0.15)' },
  low: { label: 'Low', color: BrandColors.azureBlue, bg: 'rgba(0,120,212,0.15)' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: BrandColors.azureBlue, bg: 'rgba(0,120,212,0.15)' },
  sent: { label: 'Sent', color: BrandColors.vividTangerine, bg: 'rgba(255,128,0,0.15)' },
  needs_review: { label: 'Pending', color: BrandColors.vividTangerine, bg: 'rgba(255,128,0,0.15)' },
  pending: { label: 'Pending', color: BrandColors.vividTangerine, bg: 'rgba(255,128,0,0.15)' },
  approved: { label: 'Approved', color: BrandColors.emerald, bg: 'rgba(34,214,154,0.15)' },
  rejected: { label: 'Rejected', color: '#FF3B30', bg: 'rgba(255,59,48,0.15)' },
};

const HOURLY_RATE_KEY = 'foreman_hourly_rate';
const ACTIVE_JOB_KEY = 'foreman_active_job';
const JOB_START_TIME_KEY = 'foreman_job_start_time';
const NEW_JOBS_SEEN_KEY = 'foreman_seen_jobs';

export default function ForemanHomeScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user, token } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState<AssignedJob[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStartTime, setJobStartTime] = useState<Date | null>(null);
  const [seenJobIds, setSeenJobIds] = useState<Set<string>>(new Set());
  const hourlyRate = 60; // Rick's hourly rate

  const technicianId = user?.technicianId;
  
  // Fetch tech jobs from /api/auth/tech/:id/jobs endpoint
  const { data: techJobsData, refetch: refetchTechJobs } = useQuery<{ items: any[] }>({
    queryKey: ['/api/auth/tech/jobs', technicianId],
    queryFn: async () => {
      if (!technicianId) return { items: [] };
      const response = await fetch(`${getApiUrl()}/api/auth/tech/${technicianId}/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch tech jobs');
      return response.json();
    },
    enabled: !!token && !!technicianId,
  });

  // Also fetch repair requests assigned to this technician
  const { data: repairRequestsData, refetch: refetchRepairRequests } = useQuery<{ items: any[] }>({
    queryKey: ['/api/repair-requests', user?.id],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}/api/repair-requests?technicianId=${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch repair requests');
      return response.json();
    },
    enabled: !!token && !!user?.id,
  });

  const refetchJobs = useCallback(async () => {
    await Promise.all([refetchTechJobs(), refetchRepairRequests()]);
  }, [refetchTechJobs, refetchRepairRequests]);

  useEffect(() => {
    const techJobs = techJobsData?.items || [];
    const repairRequests = repairRequestsData?.items || [];
    
    // Map tech jobs
    const mappedTechJobs: AssignedJob[] = techJobs.map((job: any) => ({
      id: job.id,
      jobNumber: job.jobNumber || `WO-${job.id?.substring(0, 8) || 'NEW'}`,
      propertyName: job.propertyName || 'Unknown Property',
      propertyAddress: job.propertyAddress || '',
      description: job.description || job.issueTitle || '',
      priority: job.priority || 'medium',
      scheduledTime: job.scheduledDate || job.createdAt || new Date().toISOString(),
      status: job.status || 'pending',
      estimatedDuration: job.estimatedDuration || '2 hours',
      contactName: job.contactName,
      contactPhone: job.contactPhone,
    }));
    
    // Map repair requests  
    const mappedRepairRequests: AssignedJob[] = repairRequests.map((req: any) => ({
      id: req.id,
      jobNumber: `RR-${req.id?.substring(0, 8) || 'NEW'}`,
      propertyName: req.propertyName || 'Unknown Property',
      propertyAddress: '',
      description: req.issueTitle || req.notes || '',
      priority: 'medium',
      scheduledTime: req.scheduledDate || req.createdAt || new Date().toISOString(),
      status: req.status || 'pending',
      estimatedDuration: '2 hours',
    }));
    
    setJobs([...mappedTechJobs, ...mappedRepairRequests]);
  }, [techJobsData, repairRequestsData]);

  const { data: estimatesData, isLoading: estimatesLoading, refetch: refetchEstimates } = useQuery<ForemanEstimatesResponse>({
    queryKey: ['/api/foreman/estimates'],
    queryFn: async () => {
      const response = await fetch(`${getApiUrl()}/api/foreman/estimates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch estimates');
      return response.json();
    },
    enabled: !!token,
  });

  const estimates = estimatesData?.estimates || [];
  const stats = estimatesData?.stats || { drafts: 0, sent: 0, approved: 0, rejected: 0, totalApprovedAmount: 0 };
  const totalEarnings = stats.totalApprovedAmount / 100;

  const firstName = user?.name?.split(' ')[0] || 'Foreman';
  const newJobs = jobs.filter(j => j.status === 'pending' && !seenJobIds.has(j.id));
  const pendingJobs = jobs.filter(j => j.status === 'pending');
  const acceptedJobs = jobs.filter(j => j.status === 'accepted');
  const activeJob = jobs.find(j => j.id === activeJobId && j.status === 'in_progress');

  // Load saved active job state on mount
  useEffect(() => {
    const loadSavedState = async () => {
      try {
        const [savedActiveJob, savedStartTime, savedSeenJobs] = await Promise.all([
          AsyncStorage.getItem(ACTIVE_JOB_KEY),
          AsyncStorage.getItem(JOB_START_TIME_KEY),
          AsyncStorage.getItem(NEW_JOBS_SEEN_KEY),
        ]);
        
        if (savedActiveJob) {
          setActiveJobId(savedActiveJob);
          setJobs(prev => prev.map(j => 
            j.id === savedActiveJob ? { ...j, status: 'in_progress' as const } : j
          ));
        }
        if (savedStartTime) {
          setJobStartTime(new Date(savedStartTime));
        }
        if (savedSeenJobs) {
          setSeenJobIds(new Set(JSON.parse(savedSeenJobs)));
        }
      } catch (e) {
        console.error('Error loading saved state:', e);
      }
    };
    loadSavedState();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchEstimates(), refetchJobs()]);
    setRefreshing(false);
  }, [refetchEstimates, refetchJobs]);

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

  const handleAcceptJob = async (jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: 'accepted' as const } : j
    ));
    // Mark job as seen
    const newSeenIds = new Set(seenJobIds);
    newSeenIds.add(jobId);
    setSeenJobIds(newSeenIds);
    await AsyncStorage.setItem(NEW_JOBS_SEEN_KEY, JSON.stringify([...newSeenIds]));
    
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      navigation.navigate('JobDetails', { job: { ...job, status: 'accepted' } });
    }
  };

  const handleStartWork = async (jobId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const startTime = new Date();
    
    // Update job status to in_progress
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: 'in_progress' as const } : j
    ));
    setActiveJobId(jobId);
    setJobStartTime(startTime);
    
    // Persist to storage
    await Promise.all([
      AsyncStorage.setItem(ACTIVE_JOB_KEY, jobId),
      AsyncStorage.setItem(JOB_START_TIME_KEY, startTime.toISOString()),
    ]);
  };

  const handleStopWork = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Calculate final earnings for this session
    if (jobStartTime) {
      const elapsed = (Date.now() - jobStartTime.getTime()) / 1000;
      const hours = elapsed / 3600;
      const earned = (hours * hourlyRate).toFixed(2);
      console.log(`Job completed. Earned: $${earned}`);
    }
    
    // Update job status back to accepted (or completed)
    if (activeJobId) {
      setJobs(prev => prev.map(j => 
        j.id === activeJobId ? { ...j, status: 'completed' as const } : j
      ));
    }
    setActiveJobId(null);
    setJobStartTime(null);
    
    // Clear from storage
    await Promise.all([
      AsyncStorage.removeItem(ACTIVE_JOB_KEY),
      AsyncStorage.removeItem(JOB_START_TIME_KEY),
    ]);
  };

  const handleDismissJob = async (jobId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setJobs(prev => prev.map(j => 
      j.id === jobId ? { ...j, status: 'dismissed' as const } : j
    ));
    // Mark as seen when dismissed
    const newSeenIds = new Set(seenJobIds);
    newSeenIds.add(jobId);
    setSeenJobIds(newSeenIds);
    await AsyncStorage.setItem(NEW_JOBS_SEEN_KEY, JSON.stringify([...newSeenIds]));
  };

  const handleMarkAllJobsSeen = async () => {
    const newSeenIds = new Set(seenJobIds);
    pendingJobs.forEach(job => newSeenIds.add(job.id));
    setSeenJobIds(newSeenIds);
    await AsyncStorage.setItem(NEW_JOBS_SEEN_KEY, JSON.stringify([...newSeenIds]));
  };

  const handleViewJobDetails = (job: AssignedJob) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('JobDetails', { job });
  };

  const renderEstimateCard = ({ item }: { item: EstimatePreview }) => {
    const config = statusConfig[item.status] || statusConfig.draft;
    const amount = (item.totalAmount || 0) / 100;
    const displayDate = item.approvedAt || item.sentAt || item.createdAt;
    return (
      <Pressable
        style={[styles.estimateCard, { backgroundColor: theme.surface }]}
        onPress={() => handleEstimatePress(item)}
      >
        <View style={styles.estimateHeader}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.estimateNumber}>{item.estimateNumber || 'New Estimate'}</ThemedText>
            <ThemedText style={[styles.propertyName, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.propertyName || 'No property'}
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
            ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </ThemedText>
          <View style={styles.dateRow}>
            {item.status === 'approved' && item.approvedAt ? (
              <ThemedText style={[styles.date, { color: BrandColors.emerald }]}>
                Approved {new Date(item.approvedAt).toLocaleDateString()}
              </ThemedText>
            ) : (
              <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
                {displayDate ? new Date(displayDate).toLocaleDateString() : ''}
              </ThemedText>
            )}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <BubbleBackground bubbleCount={15}>
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
          <View style={styles.greetingRow}>
            <View>
              <ThemedText style={styles.greetingText}>Good morning,</ThemedText>
              <ThemedText style={styles.nameText}>{firstName}</ThemedText>
            </View>
            <View style={[styles.rateDisplay, { backgroundColor: 'rgba(0,120,212,0.1)' }]}>
              <Feather name="dollar-sign" size={16} color={BrandColors.azureBlue} />
              <ThemedText style={[styles.rateText, { color: BrandColors.azureBlue }]}>
                ${hourlyRate}/hr
              </ThemedText>
            </View>
          </View>
        </View>

        {activeJob && jobStartTime ? (
          <View style={styles.activeJobSection}>
            <EarningsTimer 
              hourlyRate={hourlyRate} 
              isRunning={true} 
              startTime={jobStartTime}
            />
            <View style={[styles.currentJobCard, { backgroundColor: theme.surface }]}>
              <View style={styles.currentJobHeader}>
                <View style={[styles.liveIndicator, { backgroundColor: BrandColors.emerald }]} />
                <ThemedText style={styles.currentJobLabel}>Currently Working On</ThemedText>
              </View>
              <ThemedText style={styles.currentJobNumber}>{activeJob.jobNumber}</ThemedText>
              <ThemedText style={styles.currentJobProperty}>{activeJob.propertyName}</ThemedText>
              <ThemedText style={[styles.currentJobAddress, { color: theme.textSecondary }]} numberOfLines={1}>
                {activeJob.propertyAddress}
              </ThemedText>
              <Pressable
                style={[styles.stopWorkButton, { backgroundColor: '#FF3B30' }]}
                onPress={handleStopWork}
              >
                <Feather name="square" size={18} color="#fff" />
                <ThemedText style={styles.stopWorkText}>Finish Job</ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}

        {newJobs.length > 0 ? (
          <View style={[styles.newJobsAlert, { backgroundColor: 'rgba(255,59,48,0.15)' }]}>
            <View style={styles.newJobsHeader}>
              <View style={styles.newJobsIcon}>
                <Feather name="alert-circle" size={20} color="#FF3B30" />
              </View>
              <View style={styles.newJobsContent}>
                <ThemedText style={[styles.newJobsTitle, { color: '#FF3B30' }]}>
                  {newJobs.length} New Job{newJobs.length > 1 ? 's' : ''} Assigned!
                </ThemedText>
                <ThemedText style={[styles.newJobsSubtitle, { color: theme.textSecondary }]}>
                  Review and accept to start earning
                </ThemedText>
              </View>
              <Pressable onPress={handleMarkAllJobsSeen}>
                <Feather name="check-circle" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>
          </View>
        ) : null}

        <Pressable
          style={[styles.newEstimateButton, { backgroundColor: BrandColors.azureBlue }]}
          onPress={handleNewEstimate}
        >
          <View style={styles.bubbleDecor1} />
          <View style={styles.bubbleDecor2} />
          <View style={styles.bubbleDecor3} />
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

        {pendingJobs.length > 0 ? (
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
        ) : null}

        {acceptedJobs.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Ready to Start</ThemedText>
              <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                Start work to track earnings
              </ThemedText>
            </View>
            {acceptedJobs.map((job) => (
              <View key={job.id} style={[styles.readyJobCard, { backgroundColor: theme.surface }]}>
                <Pressable
                  style={styles.readyJobInfo}
                  onPress={() => handleViewJobDetails(job)}
                >
                  <ThemedText style={styles.jobNumber}>{job.jobNumber}</ThemedText>
                  <ThemedText style={styles.jobPropertyName}>{job.propertyName}</ThemedText>
                  <ThemedText style={[styles.jobAddress, { color: theme.textSecondary }]} numberOfLines={1}>
                    {job.propertyAddress}
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.startWorkButton, { backgroundColor: BrandColors.emerald }]}
                  onPress={() => handleStartWork(job.id)}
                >
                  <Feather name="play" size={18} color="#fff" />
                  <ThemedText style={styles.startWorkText}>Start Work</ThemedText>
                </Pressable>
              </View>
            ))}
          </>
        ) : null}

        <View style={[styles.earningsCard, { backgroundColor: BrandColors.emerald }]}>
          <View style={styles.earningsContent}>
            <View>
              <ThemedText style={styles.earningsLabel}>Total Approved Earnings</ThemedText>
              <ThemedText style={styles.earningsAmount}>
                ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </ThemedText>
            </View>
            <View style={styles.earningsIconContainer}>
              <Feather name="dollar-sign" size={32} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <View style={styles.earningsStats}>
            <View style={styles.earningsStat}>
              <ThemedText style={styles.earningsStatValue}>{stats.approved}</ThemedText>
              <ThemedText style={styles.earningsStatLabel}>Approved</ThemedText>
            </View>
            <View style={styles.earningsStatDivider} />
            <View style={styles.earningsStat}>
              <ThemedText style={styles.earningsStatValue}>{stats.sent}</ThemedText>
              <ThemedText style={styles.earningsStatLabel}>Pending</ThemedText>
            </View>
            <View style={styles.earningsStatDivider} />
            <View style={styles.earningsStat}>
              <ThemedText style={styles.earningsStatValue}>{stats.drafts}</ThemedText>
              <ThemedText style={styles.earningsStatLabel}>Drafts</ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Pressable
            style={[styles.statCard, { backgroundColor: theme.surface }]}
            onPress={handleViewDrafts}
          >
            <View style={[styles.statIcon, { backgroundColor: 'rgba(0,120,212,0.15)' }]}>
              <Feather name="edit-3" size={20} color={BrandColors.azureBlue} />
            </View>
            <ThemedText style={styles.statValue}>{stats.drafts}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Drafts
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,128,0,0.15)' }]}>
              <Feather name="send" size={20} color={BrandColors.vividTangerine} />
            </View>
            <ThemedText style={styles.statValue}>{stats.sent}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Sent
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(34,214,154,0.15)' }]}>
              <Feather name="check-circle" size={20} color={BrandColors.emerald} />
            </View>
            <ThemedText style={styles.statValue}>{stats.approved}</ThemedText>
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

        {estimatesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={BrandColors.azureBlue} />
            <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading estimates...
            </ThemedText>
          </View>
        ) : estimates.length > 0 ? (
          estimates.slice(0, 5).map((estimate) => (
            <View key={estimate.id}>
              {renderEstimateCard({ item: estimate })}
            </View>
          ))
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: theme.surface }]}>
            <Feather name="file-text" size={40} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No estimates yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Create your first estimate to get started
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </BubbleBackground>
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
    overflow: 'hidden',
  },
  bubbleDecor1: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    top: -20,
    right: 30,
  },
  bubbleDecor2: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.08)',
    bottom: -15,
    right: 80,
  },
  bubbleDecor3: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    top: 10,
    right: 120,
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
  earningsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  earningsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  earningsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 4,
  },
  earningsAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
  },
  earningsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  earningsStat: {
    alignItems: 'center',
  },
  earningsStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  earningsStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  earningsStatDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 14,
  },
  emptyContainer: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 13,
    textAlign: 'center',
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  rateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeJobSection: {
    marginBottom: Spacing.lg,
  },
  currentJobCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  currentJobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  currentJobLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  currentJobNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  currentJobProperty: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  currentJobAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  stopWorkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  stopWorkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  newJobsAlert: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  newJobsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  newJobsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,59,48,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newJobsContent: {
    flex: 1,
  },
  newJobsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  newJobsSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginLeft: Spacing.xs,
  },
  readyJobCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  readyJobInfo: {
    marginBottom: Spacing.md,
  },
  startWorkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  startWorkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
