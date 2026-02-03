import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
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
import { mockEstimates, mockJobs, mockQueueMetrics, mockQuickRepairs, QuickRepair } from '@/lib/mockData';

interface MetricCardProps {
  icon: string;
  value: number;
  label: string;
  color: string;
  onPress?: () => void;
}

function MetricCard({ icon, value, label, color, onPress }: MetricCardProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable 
      style={[styles.metricCard, { backgroundColor: theme.surface }]} 
      onPress={onPress}
    >
      <View style={[styles.metricIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon as any} size={24} color={color} />
      </View>
      <ThemedText style={[styles.metricValue, { color }]}>{value}</ThemedText>
      <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </Pressable>
  );
}

interface CollapsibleSectionProps {
  title: string;
  count: number;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, count, color, expanded, onToggle, children }: CollapsibleSectionProps) {
  const { theme } = useTheme();
  
  return (
    <View style={styles.collapsibleSection}>
      <Pressable style={styles.collapsibleHeader} onPress={onToggle}>
        <Feather 
          name={expanded ? 'chevron-down' : 'chevron-right'} 
          size={20} 
          color={theme.text} 
        />
        <ThemedText style={styles.collapsibleTitle}>{title}</ThemedText>
        <View style={[styles.countBadge, { backgroundColor: color }]}>
          <ThemedText style={styles.countBadgeText}>{count}</ThemedText>
        </View>
      </Pressable>
      {expanded ? children : null}
    </View>
  );
}

interface EstimateCardProps {
  propertyName: string;
  amount: number;
  status: string;
  submittedDate: string;
  waitingDays?: number;
  onPress: () => void;
}

function EstimateCard({ propertyName, amount, status, submittedDate, waitingDays, onPress }: EstimateCardProps) {
  const { theme } = useTheme();
  
  const getStatusColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'sent': return BrandColors.azureBlue;
      case 'approved': return BrandColors.emerald;
      case 'draft': return '#999';
      case 'scheduled': return '#9C27B0';
      default: return theme.textSecondary;
    }
  };

  return (
    <Pressable 
      style={[styles.estimateCard, { backgroundColor: theme.surface }]} 
      onPress={onPress}
    >
      <View style={[styles.estimateCardBorder, { backgroundColor: BrandColors.azureBlue }]} />
      <View style={styles.estimateCardContent}>
        <View style={styles.estimateCardHeader}>
          <ThemedText style={styles.estimateCardTitle}>{propertyName}</ThemedText>
          {waitingDays ? (
            <View style={[styles.waitingBadge, { backgroundColor: BrandColors.vividTangerine + '20' }]}>
              <ThemedText style={[styles.waitingBadgeText, { color: BrandColors.vividTangerine }]}>
                Waiting {waitingDays} days
              </ThemedText>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
              <ThemedText style={[styles.statusBadgeText, { color: getStatusColor(status) }]}>
                {status.toUpperCase()}
              </ThemedText>
            </View>
          )}
        </View>
        <ThemedText style={[styles.estimateAmount, { color: BrandColors.emerald }]}>
          ${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </ThemedText>
        <View style={styles.submittedRow}>
          <Feather name="calendar" size={12} color={theme.textSecondary} />
          <ThemedText style={[styles.submittedText, { color: theme.textSecondary }]}>
            Submitted: {submittedDate}
          </ThemedText>
        </View>
      </View>
    </Pressable>
  );
}

interface JobCardProps {
  propertyName: string;
  jobType: string;
  amount: number;
  waitingDays?: number;
  onPress: () => void;
}

function JobCard({ propertyName, jobType, amount, waitingDays, onPress }: JobCardProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable 
      style={[styles.estimateCard, { backgroundColor: theme.surface }]} 
      onPress={onPress}
    >
      <View style={[styles.estimateCardBorder, { backgroundColor: BrandColors.vividTangerine }]} />
      <View style={styles.estimateCardContent}>
        <View style={styles.estimateCardHeader}>
          <ThemedText style={styles.estimateCardTitle}>{propertyName}</ThemedText>
          {waitingDays ? (
            <View style={[styles.waitingBadge, { backgroundColor: BrandColors.vividTangerine + '20' }]}>
              <ThemedText style={[styles.waitingBadgeText, { color: BrandColors.vividTangerine }]}>
                Waiting {waitingDays} days
              </ThemedText>
            </View>
          ) : null}
        </View>
        <ThemedText style={[styles.jobType, { color: theme.textSecondary }]}>{jobType}</ThemedText>
        <ThemedText style={[styles.estimateAmount, { color: BrandColors.emerald }]}>
          ${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </ThemedText>
      </View>
    </Pressable>
  );
}

interface QuickRepairCardProps {
  repair: QuickRepair;
  onClaim: (id: string) => void;
}

function QuickRepairCard({ repair, onClaim }: QuickRepairCardProps) {
  const { theme } = useTheme();
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#FF3B30';
      case 'medium': return '#D4A017';
      case 'low': return BrandColors.emerald;
      default: return theme.textSecondary;
    }
  };

  const priorityColor = getPriorityColor(repair.priority);

  const handleClaim = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onClaim(repair.id);
  };

  return (
    <View style={[styles.quickRepairCard, { backgroundColor: theme.surface }]}>
      <View style={[styles.quickRepairBorder, { backgroundColor: priorityColor }]} />
      <View style={styles.quickRepairContent}>
        <View style={styles.quickRepairHeader}>
          <View style={styles.quickRepairLocation}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
            <ThemedText style={styles.quickRepairPropertyName}>{repair.propertyName}</ThemedText>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor }]}>
            <ThemedText style={styles.priorityBadgeText}>
              {repair.priority.charAt(0).toUpperCase() + repair.priority.slice(1)} Priority
            </ThemedText>
          </View>
        </View>
        
        <View style={styles.quickRepairDescRow}>
          <ThemedText style={styles.quickRepairDescription} numberOfLines={2}>
            {repair.description}
          </ThemedText>
          <View style={styles.underBadge}>
            <ThemedText style={styles.underBadgeText}>Under $500</ThemedText>
          </View>
        </View>
        
        <ThemedText style={[styles.quickRepairAddress, { color: theme.textSecondary }]}>
          {repair.address}
        </ThemedText>
        
        <View style={styles.quickRepairFooter}>
          <View style={styles.quickRepairCostRow}>
            <Feather name="credit-card" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.quickRepairCost, { color: theme.text }]}>
              ${repair.estimatedCost}
            </ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: '#666' }]}>
              <ThemedText style={styles.statusBadgeText}>Unassigned</ThemedText>
            </View>
          </View>
          <Pressable
            style={styles.claimButton}
            onPress={handleClaim}
          >
            <Feather name="check-circle" size={16} color="#FFFFFF" />
            <ThemedText style={styles.claimButtonText}>Claim This Job</ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function QueueScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { theme } = useTheme();

  const [estimatesExpanded, setEstimatesExpanded] = useState(true);
  const [urgentExpanded, setUrgentExpanded] = useState(true);
  const [partsExpanded, setPartsExpanded] = useState(true);
  const [quickRepairs, setQuickRepairs] = useState(mockQuickRepairs);
  const [quickRepairsExpanded, setQuickRepairsExpanded] = useState(true);

  const handleChatPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('Chat');
  };

  const handleClaimRepair = useCallback((id: string) => {
    setQuickRepairs(prev => prev.map(r => 
      r.id === id ? { ...r, status: 'claimed' as const, assignedTo: user?.name || 'You' } : r
    ));
  }, [user]);

  const estimates = mockEstimates.slice(0, 4);
  const urgentJobs = mockJobs.filter(j => j.priority === 'urgent' || j.priority === 'high');
  const unassignedQuickRepairs = quickRepairs.filter(r => r.status === 'unassigned');

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
              <ThemedText style={styles.pageTitle}>Repair Queue</ThemedText>
              <ThemedText style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
                {mockQueueMetrics.myEstimates} repairs assigned to you
              </ThemedText>
            </View>
          </View>

          <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.metricsGrid}>
            <View style={styles.metricsRow}>
              <MetricCard
                icon="file-text"
                value={mockQueueMetrics.myEstimates}
                label="My Estimates"
                color={BrandColors.azureBlue}
              />
              <MetricCard
                icon="alert-triangle"
                value={mockQueueMetrics.urgentJobs}
                label="Urgent Jobs"
                color={BrandColors.vividTangerine}
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCard
                icon="package"
                value={mockQueueMetrics.partsOrdered}
                label="Parts Ordered"
                color={BrandColors.azureBlue}
              />
              <MetricCard
                icon="check-circle"
                value={mockQueueMetrics.completed}
                label="Completed"
                color={BrandColors.emerald}
              />
            </View>
          </Animated.View>

          {unassignedQuickRepairs.length > 0 ? (
            <Animated.View entering={FadeInDown.delay(125).springify()} style={styles.quickRepairsSection}>
              <View style={styles.quickRepairsHeader}>
                <Feather name="zap" size={20} color="#FFD700" />
                <ThemedText style={styles.quickRepairsTitle}>Quick Repairs (Under $500)</ThemedText>
                <View style={styles.newBadge}>
                  <ThemedText style={styles.newBadgeText}>New</ThemedText>
                </View>
              </View>
              {unassignedQuickRepairs.map((repair) => (
                <QuickRepairCard
                  key={repair.id}
                  repair={repair}
                  onClaim={handleClaimRepair}
                />
              ))}
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <CollapsibleSection
              title="MY ESTIMATES PROGRESS"
              count={estimates.length}
              color={BrandColors.azureBlue}
              expanded={estimatesExpanded}
              onToggle={() => setEstimatesExpanded(!estimatesExpanded)}
            >
              {estimates.map((est) => (
                <EstimateCard
                  key={est.id}
                  propertyName={est.property?.name || 'Unknown'}
                  amount={est.total}
                  status={est.status}
                  submittedDate={new Date(est.createdAt).toLocaleDateString('en-CA')}
                  onPress={() => {}}
                />
              ))}
            </CollapsibleSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <CollapsibleSection
              title="URGENT JOBS"
              count={urgentJobs.length}
              color={BrandColors.danger}
              expanded={urgentExpanded}
              onToggle={() => setUrgentExpanded(!urgentExpanded)}
            >
              {urgentJobs.map((job, index) => (
                <JobCard
                  key={job.id}
                  propertyName={job.property?.name || 'Unknown'}
                  jobType={job.title}
                  amount={1500 + index * 500}
                  waitingDays={3 + index * 2}
                  onPress={() => {}}
                />
              ))}
            </CollapsibleSection>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(250).springify()}>
            <CollapsibleSection
              title="PARTS ORDERED"
              count={mockQueueMetrics.partsOrdered}
              color={BrandColors.tropicalTeal}
              expanded={partsExpanded}
              onToggle={() => setPartsExpanded(!partsExpanded)}
            >
              <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
                <Feather name="package" size={32} color={theme.textSecondary} />
                <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                  Parts on order will appear here
                </ThemedText>
              </View>
            </CollapsibleSection>
          </Animated.View>
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
  metricsGrid: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: Spacing.xs,
  },
  collapsibleSection: {
    marginBottom: Spacing.lg,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  collapsibleTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  estimateCard: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  estimateCardBorder: {
    width: 4,
  },
  estimateCardContent: {
    flex: 1,
    padding: Spacing.md,
  },
  estimateCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  estimateCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  waitingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  waitingBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  estimateAmount: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  jobType: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  submittedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  submittedText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    ...Shadows.card,
  },
  emptyStateText: {
    marginTop: Spacing.sm,
    fontSize: 14,
  },
  quickRepairsSection: {
    marginBottom: Spacing.xl,
  },
  quickRepairsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  quickRepairsTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    color: '#FFFFFF',
  },
  newBadge: {
    backgroundColor: BrandColors.tropicalTeal,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  quickRepairCard: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  quickRepairBorder: {
    width: 4,
  },
  quickRepairContent: {
    flex: 1,
    padding: Spacing.md,
  },
  quickRepairHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  quickRepairLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  quickRepairPropertyName: {
    fontSize: 15,
    fontWeight: '600',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  priorityBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  quickRepairDescRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  quickRepairDescription: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  underBadge: {
    backgroundColor: BrandColors.emerald,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  underBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  quickRepairAddress: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  quickRepairFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  quickRepairCostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickRepairCost: {
    fontSize: 16,
    fontWeight: '700',
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: BrandColors.tropicalTeal,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  claimButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
