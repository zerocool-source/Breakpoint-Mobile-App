import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform, Image, ImageSourcePropType } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { BubbleBackground } from '@/components/BubbleBackground';
import { ChatFAB } from '@/components/ChatFAB';
import { OfflineBanner } from '@/components/OfflineBanner';
import { NotificationBanner } from '@/components/NotificationBanner';
import { BatterySaverBanner } from '@/components/BatterySaverBanner';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { useBattery } from '@/context/BatteryContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockJobs, mockRouteStops, mockQueueMetrics } from '@/lib/mockData';
import { NewEstimateModal, OrderPartsModal, ReportIssueModal, EmergencyReportModal } from './Modals';
import type { Job } from '@/types';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProgressCardProps {
  value: number;
  label: string;
  color: string;
}

function ProgressCard({ value, label, color }: ProgressCardProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.progressCard, { backgroundColor: theme.surface }]}>
      <ThemedText style={[styles.progressValue, { color }]}>{value}</ThemedText>
      <ThemedText style={[styles.progressLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

interface QuickActionProps {
  icon?: string;
  customImage?: ImageSourcePropType;
  label: string;
  color: string;
  onPress: () => void;
}

function QuickAction({ icon, customImage, label, color, onPress }: QuickActionProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable 
      style={[styles.quickAction, { backgroundColor: theme.surface }]} 
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        {customImage ? (
          <Image source={customImage} style={styles.quickActionCustomImage} />
        ) : (
          <Feather name={icon as any} size={22} color={color} />
        )}
      </View>
      <ThemedText style={styles.quickActionLabel}>{label}</ThemedText>
    </Pressable>
  );
}

interface RepairJobCardProps {
  job: Job;
  isFirst: boolean;
  drag?: () => void;
  isActive?: boolean;
  onPress: () => void;
  onNavigate: () => void;
  onComplete: () => void;
}

function RepairJobCard({ job, isFirst, drag, isActive, onPress, onNavigate, onComplete }: RepairJobCardProps) {
  const { theme } = useTheme();
  const swipeableRef = useRef<Swipeable>(null);

  const renderLeftActions = () => (
    <Pressable
      style={styles.swipeActionLeft}
      onPress={() => {
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        swipeableRef.current?.close();
        onNavigate();
      }}
    >
      <Feather name="navigation" size={20} color="#FFFFFF" />
      <ThemedText style={styles.swipeActionText}>Navigate</ThemedText>
    </Pressable>
  );

  const renderRightActions = () => (
    <View style={styles.swipeActionsRight}>
      <Pressable
        style={styles.swipeActionDetails}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          swipeableRef.current?.close();
          onPress();
        }}
      >
        <Feather name="file-text" size={20} color="#FFFFFF" />
        <ThemedText style={styles.swipeActionText}>Details</ThemedText>
      </Pressable>
      <Pressable
        style={styles.swipeActionComplete}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          swipeableRef.current?.close();
          onComplete();
        }}
      >
        <Feather name="check-circle" size={20} color="#FFFFFF" />
        <ThemedText style={styles.swipeActionText}>Complete</ThemedText>
      </Pressable>
    </View>
  );
  
  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      friction={2}
      leftThreshold={40}
      rightThreshold={40}
      overshootLeft={false}
      overshootRight={false}
    >
      <Pressable
        onLongPress={drag}
        onPress={onPress}
        style={[
          styles.jobCard,
          { backgroundColor: theme.surface },
          isFirst && styles.jobCardFirst,
          isActive && styles.jobCardActive,
        ]}
      >
        <View style={[styles.jobCardBorder, { backgroundColor: isFirst ? BrandColors.vividTangerine : BrandColors.azureBlue }]} />
        <View style={styles.jobCardContent}>
          <View style={styles.jobCardHeader}>
            <View style={styles.jobCardTitleRow}>
              <ThemedText style={styles.jobCardTitle}>{job.property?.name}</ThemedText>
              <ThemedText style={[styles.jobCardTime, { color: BrandColors.azureBlue }]}>{job.scheduledTime}</ThemedText>
            </View>
            <ThemedText style={[styles.jobCardType, { color: BrandColors.vividTangerine }]}>{job.title}</ThemedText>
          </View>
          <View style={styles.jobCardAddress}>
            <Feather name="map-pin" size={12} color={theme.textSecondary} />
            <ThemedText style={[styles.jobCardAddressText, { color: theme.textSecondary }]} numberOfLines={1}>
              {job.property?.address}
            </ThemedText>
          </View>
          <View style={styles.swipeHint}>
            <Feather name="chevrons-left" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.swipeHintText, { color: theme.textSecondary }]}>Swipe for actions</ThemedText>
            <Feather name="chevrons-right" size={14} color={theme.textSecondary} />
          </View>
          {isFirst ? (
            <View style={styles.jobCardBadge}>
              <ThemedText style={styles.jobCardBadgeText}>NEXT STOP</ThemedText>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Swipeable>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { isConnected } = useNetwork();
  const { isBatterySaverEnabled } = useBattery();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [showNewEstimateModal, setShowNewEstimateModal] = useState(false);
  const [showOrderPartsModal, setShowOrderPartsModal] = useState(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const nextStop = mockRouteStops.find(stop => !stop.completed);
  const truckId = 'RT-007';

  const handleDragEnd = ({ data }: { data: Job[] }) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setJobs(data.map((job, index) => ({ ...job, order: index + 1 })));
  };

  const handleQuickAction = (action: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    switch (action) {
      case 'emergency':
        setShowEmergencyModal(true);
        break;
      case 'estimate':
        setShowNewEstimateModal(true);
        break;
      case 'parts':
        setShowOrderPartsModal(true);
        break;
      case 'issue':
        setShowReportIssueModal(true);
        break;
    }
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const renderHeader = () => (
    <View>
      <LinearGradient
        colors={['#0078D4', '#0066B8', '#005499']}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerTop}>
          <View style={styles.timeBadge}>
            <Feather name="clock" size={14} color="#FFFFFF" />
            <ThemedText style={styles.timeBadgeText}>{getCurrentTime()}</ThemedText>
          </View>
          <View style={styles.truckBadge}>
            <Feather name="truck" size={14} color="#333" />
            <ThemedText style={styles.truckBadgeText}>{truckId}</ThemedText>
          </View>
        </View>
      </LinearGradient>

      {!isConnected ? <OfflineBanner /> : null}
      {isBatterySaverEnabled ? <BatterySaverBanner /> : null}

      <View style={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Today's Progress</ThemedText>
            <ThemedText style={[styles.sectionSubtitle, { color: BrandColors.vividTangerine }]}>
              {jobs.filter(j => j.status === 'completed').length}/{jobs.length} repairs
            </ThemedText>
          </View>
          
          <View style={styles.progressRow}>
            <ProgressCard value={jobs.filter(j => j.status === 'completed').length} label="COMPLETED" color={BrandColors.azureBlue} />
            <ProgressCard value={mockQueueMetrics.myEstimates} label="ESTIMATES IN PROGRESS" color={BrandColors.vividTangerine} />
            <ProgressCard value={mockQueueMetrics.partsOrdered} label="PARTS ORDERED" color={BrandColors.tropicalTeal} />
          </View>
        </Animated.View>

        {nextStop ? (
          <Animated.View entering={FadeInDown.delay(150).springify()}>
            <View style={[styles.nextStopCard, { backgroundColor: theme.surface }]}>
              <View style={styles.nextStopHeader}>
                <View style={[styles.nextStopBadge, { backgroundColor: BrandColors.azureBlue }]}>
                  <ThemedText style={styles.nextStopBadgeText}>NEXT STOP</ThemedText>
                </View>
                <Feather name="droplet" size={20} color={BrandColors.tropicalTeal} />
                <View style={[styles.nextStopTime, { backgroundColor: BrandColors.vividTangerine }]}>
                  <ThemedText style={styles.nextStopTimeText}>{nextStop.scheduledTime}</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.nextStopName}>{nextStop.property?.name ?? 'Unknown Property'}</ThemedText>
              <View style={styles.nextStopAddressRow}>
                <Feather name="map-pin" size={14} color={BrandColors.vividTangerine} />
                <ThemedText style={[styles.nextStopAddress, { color: theme.textSecondary }]}>
                  {nextStop.property?.address ?? 'Address unavailable'}
                </ThemedText>
              </View>
              <View style={styles.nextStopMeta}>
                <View style={[styles.propertyTypeBadge, { backgroundColor: BrandColors.vividTangerine + '20' }]}>
                  <ThemedText style={[styles.propertyTypeBadgeText, { color: BrandColors.vividTangerine }]}>
                    {nextStop.property.type?.toUpperCase() || 'HOA'}
                  </ThemedText>
                </View>
                <View style={styles.poolCount}>
                  <Feather name="droplet" size={14} color={BrandColors.tropicalTeal} />
                  <ThemedText style={[styles.poolCountText, { color: BrandColors.tropicalTeal }]}>
                    {nextStop.property.poolCount} pools
                  </ThemedText>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ThemedText style={styles.quickActionsTitle}>QUICK ACTIONS</ThemedText>
          <View style={styles.quickActionsGrid}>
            <QuickAction
              icon="alert-triangle"
              label="Emergency"
              color={BrandColors.danger}
              onPress={() => handleQuickAction('emergency')}
            />
            <QuickAction
              customImage={require('@/assets/images/ace-ai-icon.png')}
              label="Create Estimate with ACE"
              color={BrandColors.azureBlue}
              onPress={() => navigation.navigate('AceEstimateBuilder')}
            />
            <QuickAction
              customImage={require('@/assets/images/order-parts-icon.png')}
              label="Order Parts"
              color={BrandColors.vividTangerine}
              onPress={() => handleQuickAction('parts')}
            />
            <QuickAction
              customImage={require('@/assets/images/report-issues-icon.png')}
              label="Report Issue"
              color={BrandColors.danger}
              onPress={() => handleQuickAction('issue')}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <View style={styles.todaysJobsHeader}>
            <ThemedText style={styles.sectionTitle}>Today's Jobs</ThemedText>
            <View style={[styles.reorderBadge, { borderColor: theme.border }]}>
              <Feather name="menu" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.reorderText, { color: theme.textSecondary }]}>Drag to reorder</ThemedText>
            </View>
          </View>
        </Animated.View>
      </View>
    </View>
  );

  const handleNavigateToJob = (job: Job) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    console.log('Navigate to:', job.property?.address);
  };

  const handleCompleteJob = (jobId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setJobs(prev => prev.filter(j => j.id !== jobId));
  };

  const renderJob = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<Job>) => {
      const index = getIndex() ?? 0;
      return (
        <ScaleDecorator>
          <RepairJobCard
            job={item}
            isFirst={index === 0}
            drag={drag}
            isActive={isActive}
            onPress={() => console.log('Job details:', item.id)}
            onNavigate={() => handleNavigateToJob(item)}
            onComplete={() => handleCompleteJob(item.id)}
          />
        </ScaleDecorator>
      );
    },
    [navigation]
  );

  return (
    <BubbleBackground bubbleCount={15}>
      <NotificationBanner
        visible={showNotification}
        title="Emergency: Power Outage"
        message="Aqua Fitness Center - all pool equipment is offline due to power outage. Generator backup needed."
        type="urgent"
        icon="zap-off"
        onDismiss={() => setShowNotification(false)}
      />
      {jobs.length > 0 ? (
        <DraggableFlatList
          style={{ flex: 1 }}
          data={jobs}
          keyExtractor={(item) => item.id}
          renderItem={renderJob}
          onDragEnd={handleDragEnd}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={{
            paddingBottom: tabBarHeight + Spacing.fabSize + Spacing['2xl'],
            flexGrow: 1,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          showsVerticalScrollIndicator={true}
        />
      ) : (
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingBottom: tabBarHeight + Spacing.fabSize + Spacing['2xl'],
            flexGrow: 1,
          }}
          scrollIndicatorInsets={{ bottom: insets.bottom }}
          showsVerticalScrollIndicator={true}
        >
          {renderHeader()}
          <View style={styles.emptyJobsContainer}>
            <Feather name="check-circle" size={48} color={BrandColors.emerald} />
            <ThemedText style={styles.emptyJobsTitle}>All Caught Up!</ThemedText>
            <ThemedText style={[styles.emptyJobsText, { color: theme.textSecondary }]}>
              No jobs scheduled for today
            </ThemedText>
          </View>
        </Animated.ScrollView>
      )}
      <ChatFAB
        onPress={() => navigation.navigate('Chat')}
        bottom={tabBarHeight}
      />

      <NewEstimateModal
        visible={showNewEstimateModal}
        onClose={() => setShowNewEstimateModal(false)}
        onSubmit={(data) => console.log('Estimate:', data)}
      />
      <OrderPartsModal
        visible={showOrderPartsModal}
        onClose={() => setShowOrderPartsModal(false)}
        onSubmit={(data) => console.log('Parts:', data)}
      />
      <ReportIssueModal
        visible={showReportIssueModal}
        onClose={() => setShowReportIssueModal(false)}
        propertyId={nextStop?.propertyId || jobs[0]?.property?.id || 'unknown'}
        propertyName={nextStop?.property?.name || jobs[0]?.property?.name || 'Current Property'}
        bodyOfWater="Main Pool"
        technicianId={user?.id || 'unknown'}
        technicianName={user?.name || user?.email || 'Technician'}
      />
      <EmergencyReportModal
        visible={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        onSubmit={(data) => console.log('Emergency:', data)}
      />
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  truckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  truckBadgeText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    marginTop: -Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  progressCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  progressValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  nextStopCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  nextStopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  nextStopBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: 'auto',
  },
  nextStopBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nextStopTime: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.md,
  },
  nextStopTimeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  nextStopName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  nextStopAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  nextStopAddress: {
    fontSize: 14,
    flex: 1,
  },
  nextStopMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  propertyTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  propertyTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  poolCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  poolCountText: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionCustomImage: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  todaysJobsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reorderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  reorderText: {
    fontSize: 12,
    fontWeight: '500',
  },
  jobCard: {
    flexDirection: 'row',
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  jobCardFirst: {
    borderWidth: 2,
    borderColor: BrandColors.vividTangerine,
  },
  jobCardActive: {
    opacity: 0.95,
  },
  jobCardBorder: {
    width: 4,
  },
  jobCardContent: {
    flex: 1,
    padding: Spacing.md,
  },
  jobCardHeader: {
    marginBottom: Spacing.xs,
  },
  jobCardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  jobCardTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  jobCardType: {
    fontSize: 13,
    fontWeight: '500',
  },
  jobCardAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  jobCardAddressText: {
    fontSize: 13,
    flex: 1,
  },
  jobCardBadge: {
    position: 'absolute',
    top: -Spacing.md - 2,
    left: Spacing.sm,
    backgroundColor: BrandColors.vividTangerine,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  jobCardBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  swipeActionLeft: {
    backgroundColor: BrandColors.azureBlue,
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    marginVertical: Spacing.xs,
    marginLeft: Spacing.screenPadding,
    borderRadius: BorderRadius.md,
  },
  swipeActionsRight: {
    flexDirection: 'row',
    marginVertical: Spacing.xs,
    marginRight: Spacing.screenPadding,
    gap: Spacing.xs,
  },
  swipeActionDetails: {
    backgroundColor: BrandColors.tropicalTeal,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: BorderRadius.md,
  },
  swipeActionComplete: {
    backgroundColor: BrandColors.emerald,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: BorderRadius.md,
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  swipeHintText: {
    fontSize: 11,
    fontWeight: '500',
  },
  emptyJobsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing['2xl'],
  },
  emptyJobsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: Spacing.md,
  },
  emptyJobsText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
});
