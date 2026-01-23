import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { BubbleBackground } from '@/components/BubbleBackground';
import { NotificationBanner } from '@/components/NotificationBanner';
import { OfflineBanner } from '@/components/OfflineBanner';
import { BatterySaverBanner } from '@/components/BatterySaverBanner';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { useBattery } from '@/context/BatteryContext';
import { useUrgentAlerts } from '@/context/UrgentAlertsContext';
import { useTheme } from '@/hooks/useTheme';
import { usePropertyChannels } from '@/context/PropertyChannelsContext';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import {
  mockAssignments,
  mockDailyProgress,
  mockTruckInfo,
  mockCommissionTracker,
  type Assignment,
  type RouteStop,
} from '@/lib/serviceTechMockData';

type RootStackParamList = {
  PropertyDetail: { stop: RouteStop };
  AssignmentDetail: { assignment: Assignment };
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getCurrentTime(): string {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

interface AssignmentCardProps {
  assignment: Assignment;
  onPress: () => void;
}

function AssignmentCard({ assignment, onPress }: AssignmentCardProps) {
  return (
    <Pressable style={styles.assignmentItem} onPress={onPress}>
      <View style={styles.assignmentItemLeft}>
        <ThemedText style={styles.assignmentType}>{assignment.type}</ThemedText>
        <ThemedText style={styles.assignmentProperty}>{assignment.propertyName}</ThemedText>
        <ThemedText style={styles.assignmentNotes}>{assignment.notes}</ThemedText>
        <ThemedText style={styles.assignmentMeta}>
          {assignment.assignedAt} - by {assignment.assignedBy}
        </ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={BrandColors.textSecondary} />
    </Pressable>
  );
}

interface RouteStopCardProps {
  stop: RouteStop;
  index: number;
  totalStops: number;
  onPress: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function RouteStopCard({ stop, index, totalStops, onPress, onMoveUp, onMoveDown }: RouteStopCardProps) {
  const { theme } = useTheme();
  
  const handleMoveUp = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onMoveUp();
  };

  const handleMoveDown = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onMoveDown();
  };
  
  return (
    <Pressable 
      style={[styles.routeStopCard, { backgroundColor: theme.surface }]}
      onPress={onPress}
    >
      <View style={styles.routeStopLeft}>
        <View style={styles.routeStopNumber}>
          <ThemedText style={styles.routeStopNumberText}>{index + 1}</ThemedText>
        </View>
        <View style={styles.reorderButtons}>
          <Pressable 
            onPress={handleMoveUp} 
            style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
            disabled={index === 0}
          >
            <Feather name="chevron-up" size={16} color={index === 0 ? theme.border : BrandColors.azureBlue} />
          </Pressable>
          <Pressable 
            onPress={handleMoveDown} 
            style={[styles.reorderButton, index === totalStops - 1 && styles.reorderButtonDisabled]}
            disabled={index === totalStops - 1}
          >
            <Feather name="chevron-down" size={16} color={index === totalStops - 1 ? theme.border : BrandColors.azureBlue} />
          </Pressable>
        </View>
      </View>
      <View style={styles.routeStopContent}>
        <ThemedText style={styles.routeStopName}>{stop.propertyName}</ThemedText>
        <ThemedText style={[styles.routeStopAddress, { color: theme.textSecondary }]}>
          {stop.address}
        </ThemedText>
        <View style={styles.routeStopMeta}>
          <View style={[styles.propertyTypeBadge, { backgroundColor: BrandColors.vividTangerine + '20' }]}>
            <ThemedText style={[styles.propertyTypeBadgeText, { color: BrandColors.vividTangerine }]}>
              {stop.propertyType}
            </ThemedText>
          </View>
          <View style={styles.poolCountBadge}>
            <Feather name="droplet" size={12} color={BrandColors.azureBlue} />
            <ThemedText style={styles.poolCountText}>{stop.poolCount} pools</ThemedText>
          </View>
        </View>
      </View>
      <View style={styles.routeStopTime}>
        <ThemedText style={styles.routeStopTimeText}>{stop.scheduledTime}</ThemedText>
      </View>
    </Pressable>
  );
}

export default function ServiceTechHomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isConnected } = useNetwork();
  const { isBatterySaverEnabled } = useBattery();
  const { addAlert } = useUrgentAlerts();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [assignmentsExpanded, setAssignmentsExpanded] = useState(true);
  const [currentTime] = useState(getCurrentTime());
  const [showNotification, setShowNotification] = useState(false);
  const { channels: propertyChannels, isLoading: channelsLoading } = usePropertyChannels();
  const [completedStops, setCompletedStops] = useState<Set<string>>(new Set());

  const channelRouteStops: RouteStop[] = useMemo(() => {
    return propertyChannels.map((channel, index) => {
      const property = channel.property;
      const typeMap: Record<string, 'HOA' | 'Apartment' | 'Hotel' | 'Commercial'> = {
        'HOA': 'HOA',
        'Apartment': 'Apartment',
        'Hotel': 'Hotel',
        'Commercial': 'Commercial',
        'Resort': 'Hotel',
        'Winery': 'Commercial',
      };
      return {
        id: property.id,
        propertyName: property.name,
        address: property.address || 'Address TBD',
        propertyType: typeMap[property.type] || 'Commercial',
        poolCount: property.poolCount || 1,
        scheduledTime: `${8 + Math.floor(index / 2)}:${index % 2 === 0 ? '00' : '30'} AM`,
        completed: completedStops.has(property.id),
        gateCode: property.gateCode || undefined,
        contactName: property.contactName || undefined,
        contactPhone: property.contactPhone || undefined,
        notes: undefined,
        bodiesOfWater: [],
      };
    });
  }, [propertyChannels, completedStops]);

  const [routeStops, setRouteStops] = useState<RouteStop[]>([]);

  useEffect(() => {
    setRouteStops(channelRouteStops);
  }, [channelRouteStops]);

  const demoAlert = {
    title: 'Urgent Pool Service Required',
    message: 'Sunset Valley Resort needs immediate attention - pool water is cloudy and guests are complaining.',
    type: 'urgent' as const,
    property: 'Sunset Valley Resort',
    details: 'The main pool at Sunset Valley Resort has become cloudy overnight. Multiple guests have complained to management. The pool has been closed temporarily. Please prioritize this location and assess the situation as soon as possible. Check chemical levels, filtration system, and look for any contamination sources.',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(true);
      addAlert(demoAlert);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);
  
  const nextStop = routeStops.find(stop => !stop.completed) || routeStops[0] || null;
  const progress = {
    ...mockDailyProgress,
    stopsCompleted: routeStops.filter(s => s.completed).length,
    totalStops: routeStops.length,
  };

  const handleMoveUp = useCallback((index: number) => {
    if (index === 0) return;
    setRouteStops(prev => {
      const newStops = [...prev];
      [newStops[index - 1], newStops[index]] = [newStops[index], newStops[index - 1]];
      return newStops;
    });
  }, []);

  const handleMoveDown = useCallback((index: number) => {
    setRouteStops(prev => {
      if (index === prev.length - 1) return prev;
      const newStops = [...prev];
      [newStops[index], newStops[index + 1]] = [newStops[index + 1], newStops[index]];
      return newStops;
    });
  }, []);

  const handleSync = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleStopPress = useCallback((stop: RouteStop) => {
    navigation.navigate('PropertyDetail', { stop });
  }, [navigation]);

  const handleAssignmentPress = useCallback((assignment: Assignment) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.navigate('AssignmentDetail', { assignment });
  }, [navigation]);

  return (
    <BubbleBackground bubbleCount={18}>
      <NotificationBanner
        visible={showNotification}
        title={demoAlert.title}
        message={demoAlert.message}
        type="urgent"
        icon="alert-circle"
        onDismiss={() => setShowNotification(false)}
        onPress={() => {
          setShowNotification(false);
          (navigation.getParent() as any)?.navigate('Chat');
        }}
      />
      {!isConnected ? <OfflineBanner /> : null}
      {isBatterySaverEnabled ? <BatterySaverBanner /> : null}
      <View
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Avatar name={user?.name} size="medium" />
            <View style={styles.headerText}>
              <ThemedText style={styles.greeting}>{getGreeting()}</ThemedText>
              <ThemedText style={styles.userName}>{user?.name?.split(' ')[0] || 'Demo'}</ThemedText>
            </View>
          </View>
          <Pressable style={styles.syncButton} onPress={handleSync}>
            <Feather name="refresh-cw" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        
        <View style={styles.headerBadges}>
          <View style={styles.timeBadge}>
            <Feather name="clock" size={14} color="#FFFFFF" />
            <ThemedText style={styles.timeBadgeText}>{currentTime}</ThemedText>
          </View>
          <View style={styles.truckBadge}>
            <Feather name="truck" size={14} color={BrandColors.textPrimary} />
            <ThemedText style={styles.truckBadgeText}>Truck #{mockTruckInfo.number}</ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <Pressable
            style={styles.assignmentsCard}
            onPress={() => setAssignmentsExpanded(!assignmentsExpanded)}
          >
            <View style={styles.assignmentsHeader}>
              <View style={styles.assignmentsHeaderLeft}>
                <Feather
                  name={assignmentsExpanded ? 'chevron-down' : 'chevron-right'}
                  size={20}
                  color="#FFFFFF"
                />
                <Feather name="clipboard" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                <ThemedText style={styles.assignmentsTitle}>ASSIGNMENTS</ThemedText>
              </View>
              <View style={styles.assignmentsBadge}>
                <ThemedText style={styles.assignmentsBadgeText}>
                  {mockAssignments.length} pending
                </ThemedText>
              </View>
            </View>
            
            {assignmentsExpanded && (
              <View style={styles.assignmentsList}>
                {mockAssignments.slice(0, 2).map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    onPress={() => handleAssignmentPress(assignment)}
                  />
                ))}
              </View>
            )}
          </Pressable>
        </Animated.View>

        {nextStop ? (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <Pressable 
              style={[styles.nextStopCard, { backgroundColor: theme.surface }]}
              onPress={() => handleStopPress(nextStop)}
            >
              <View style={styles.nextStopHeader}>
                <View style={styles.nextStopHeaderLeft}>
                  <ThemedText style={styles.nextStopLabel}>NEXT STOP</ThemedText>
                </View>
                <View style={styles.nextStopTimeBadge}>
                  <ThemedText style={styles.nextStopTimeText}>{nextStop.scheduledTime}</ThemedText>
                </View>
              </View>
              <ThemedText style={styles.nextStopName}>{nextStop.propertyName}</ThemedText>
              <View style={styles.nextStopAddress}>
                <Feather name="map-pin" size={14} color={BrandColors.danger} />
                <ThemedText style={[styles.nextStopAddressText, { color: theme.textSecondary }]}>
                  {nextStop.address}
                </ThemedText>
              </View>
              <View style={styles.nextStopMeta}>
                <View style={[styles.propertyTypeBadge, { backgroundColor: BrandColors.vividTangerine + '20' }]}>
                  <ThemedText style={[styles.propertyTypeBadgeText, { color: BrandColors.vividTangerine }]}>
                    {nextStop.propertyType}
                  </ThemedText>
                </View>
                <View style={styles.poolCountBadge}>
                  <Feather name="droplet" size={12} color={BrandColors.azureBlue} />
                  <ThemedText style={styles.poolCountText}>{nextStop.poolCount} pools</ThemedText>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        ) : (
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={[styles.nextStopCard, { backgroundColor: theme.surface }]}>
              <View style={styles.emptyStateContainer}>
                <Feather name="map-pin" size={32} color={BrandColors.textSecondary} />
                <ThemedText style={styles.emptyStateTitle}>No Stops Scheduled</ThemedText>
                <ThemedText style={styles.emptyStateText}>Your route will appear here once assigned</ThemedText>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <ThemedText style={styles.progressTitle}>Today's Progress</ThemedText>
              <ThemedText style={styles.progressCount}>
                {progress.stopsCompleted}/{progress.totalStops} stops
              </ThemedText>
            </View>
            <View style={styles.progressCards}>
              <View style={[styles.progressCard, { backgroundColor: theme.surface }]}>
                <ThemedText style={[styles.progressCardValue, { color: BrandColors.azureBlue }]}>
                  {progress.chemicals}
                </ThemedText>
                <ThemedText style={[styles.progressCardLabel, { color: theme.textSecondary }]}>
                  Chemicals
                </ThemedText>
              </View>
              <View style={[styles.progressCard, { backgroundColor: theme.surface }]}>
                <ThemedText style={[styles.progressCardValue, { color: theme.textSecondary }]}>
                  {progress.repairs}
                </ThemedText>
                <ThemedText style={[styles.progressCardLabel, { color: theme.textSecondary }]}>
                  Repairs
                </ThemedText>
              </View>
              <View style={[styles.progressCard, { backgroundColor: theme.surface }]}>
                <ThemedText style={[styles.progressCardValue, { color: BrandColors.danger }]}>
                  {progress.dropOffs}
                </ThemedText>
                <ThemedText style={[styles.progressCardLabel, { color: theme.textSecondary }]}>
                  Drop-offs
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <View style={[styles.commissionSection, { backgroundColor: theme.surface }]}>
            <View style={styles.commissionHeader}>
              <View style={styles.commissionHeaderLeft}>
                <Feather name="dollar-sign" size={20} color={BrandColors.emerald} />
                <ThemedText style={styles.commissionTitle}>Commission Tracker</ThemedText>
              </View>
              <View style={[styles.commissionBadge, { backgroundColor: BrandColors.emerald + '20' }]}>
                <ThemedText style={[styles.commissionBadgeText, { color: BrandColors.emerald }]}>
                  Service Repairs
                </ThemedText>
              </View>
            </View>
            
            <View style={styles.commissionTotals}>
              <View style={styles.commissionTotalCard}>
                <ThemedText style={[styles.commissionAmount, { color: BrandColors.emerald }]}>
                  ${mockCommissionTracker.weeklyTotal.toFixed(2)}
                </ThemedText>
                <ThemedText style={[styles.commissionLabel, { color: theme.textSecondary }]}>This Week</ThemedText>
                <View style={styles.commissionProgressBar}>
                  <View 
                    style={[
                      styles.commissionProgressFill, 
                      { 
                        width: `${Math.min((mockCommissionTracker.weeklyTotal / mockCommissionTracker.weeklyGoal) * 100, 100)}%`,
                        backgroundColor: BrandColors.emerald 
                      }
                    ]} 
                  />
                </View>
                <ThemedText style={[styles.commissionGoal, { color: theme.textSecondary }]}>
                  Goal: ${mockCommissionTracker.weeklyGoal}
                </ThemedText>
              </View>
              
              <View style={styles.commissionTotalCard}>
                <ThemedText style={[styles.commissionAmount, { color: BrandColors.azureBlue }]}>
                  ${mockCommissionTracker.monthlyTotal.toFixed(2)}
                </ThemedText>
                <ThemedText style={[styles.commissionLabel, { color: theme.textSecondary }]}>This Month</ThemedText>
                <View style={styles.commissionProgressBar}>
                  <View 
                    style={[
                      styles.commissionProgressFill, 
                      { 
                        width: `${Math.min((mockCommissionTracker.monthlyTotal / mockCommissionTracker.monthlyGoal) * 100, 100)}%`,
                        backgroundColor: BrandColors.azureBlue 
                      }
                    ]} 
                  />
                </View>
                <ThemedText style={[styles.commissionGoal, { color: theme.textSecondary }]}>
                  Goal: ${mockCommissionTracker.monthlyGoal}
                </ThemedText>
              </View>
            </View>

            <View style={styles.recentCommissions}>
              <ThemedText style={[styles.recentCommissionsTitle, { color: theme.textSecondary }]}>
                Recent Installs
              </ThemedText>
              {mockCommissionTracker.recentItems.slice(0, 3).map((item) => (
                <View key={item.id} style={[styles.commissionItem, { borderBottomColor: theme.border }]}>
                  <View style={styles.commissionItemLeft}>
                    <View style={[styles.commissionTypeIcon, { backgroundColor: item.type === 'product' ? BrandColors.azureBlue + '20' : BrandColors.vividTangerine + '20' }]}>
                      <Feather 
                        name={item.type === 'product' ? 'box' : 'tool'} 
                        size={14} 
                        color={item.type === 'product' ? BrandColors.azureBlue : BrandColors.vividTangerine} 
                      />
                    </View>
                    <View>
                      <ThemedText style={styles.commissionItemName}>{item.name}</ThemedText>
                      <ThemedText style={[styles.commissionItemDate, { color: theme.textSecondary }]}>
                        {item.date} - {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      </ThemedText>
                    </View>
                  </View>
                  <ThemedText style={[styles.commissionItemAmount, { color: BrandColors.emerald }]}>
                    +${(item.unitPrice * item.quantity * item.commissionRate).toFixed(2)}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.routeSection}>
            <View style={styles.routeDateRow}>
              <ThemedText style={styles.routeDate}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </ThemedText>
              <View style={[styles.scheduleBadge, { backgroundColor: new Date().getMonth() >= 4 && new Date().getMonth() <= 9 ? BrandColors.vividTangerine + '20' : BrandColors.azureBlue + '20' }]}>
                <Feather 
                  name={new Date().getMonth() >= 4 && new Date().getMonth() <= 9 ? 'sun' : 'cloud'} 
                  size={12} 
                  color={new Date().getMonth() >= 4 && new Date().getMonth() <= 9 ? BrandColors.vividTangerine : BrandColors.azureBlue} 
                />
                <ThemedText style={[styles.scheduleBadgeText, { color: new Date().getMonth() >= 4 && new Date().getMonth() <= 9 ? BrandColors.vividTangerine : BrandColors.azureBlue }]}>
                  {new Date().getMonth() >= 4 && new Date().getMonth() <= 9 ? 'Summer (6 days)' : 'Winter (5 days)'}
                </ThemedText>
              </View>
            </View>
            <View style={styles.routeHeader}>
              <ThemedText style={styles.routeTitle}>Today's Route</ThemedText>
              <View style={styles.dragBadge}>
                <ThemedText style={styles.dragBadgeText}>Tap arrows to reorder</ThemedText>
              </View>
            </View>
            <View style={styles.routeList}>
              {routeStops.map((stop, index) => (
                <RouteStopCard
                  key={stop.id}
                  stop={stop}
                  index={index}
                  totalStops={routeStops.length}
                  onPress={() => handleStopPress(stop)}
                  onMoveUp={() => handleMoveUp(index)}
                  onMoveDown={() => handleMoveDown(index)}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </BubbleBackground>
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: Spacing.md,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  syncButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    color: BrandColors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
  },
  assignmentsCard: {
    backgroundColor: BrandColors.vividTangerine,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  assignmentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignmentsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignmentsTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: Spacing.sm,
  },
  assignmentsBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  assignmentsBadgeText: {
    color: BrandColors.vividTangerine,
    fontSize: 12,
    fontWeight: '700',
  },
  assignmentsList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  assignmentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.vividTangerine,
  },
  assignmentItemLeft: {
    flex: 1,
  },
  assignmentType: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  assignmentProperty: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.vividTangerine,
  },
  assignmentNotes: {
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  assignmentMeta: {
    fontSize: 12,
    color: BrandColors.textSecondary,
    marginTop: Spacing.xs,
  },
  nextStopCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: BrandColors.azureBlue,
    ...Shadows.card,
  },
  nextStopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  nextStopHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  nextStopLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
  nextStopTimeBadge: {
    backgroundColor: BrandColors.vividTangerine,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  nextStopTimeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  nextStopName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  nextStopAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  nextStopAddressText: {
    fontSize: 14,
  },
  nextStopMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  propertyTypeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  propertyTypeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  poolCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  poolCountText: {
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 14,
    color: BrandColors.azureBlue,
    fontWeight: '600',
  },
  progressCards: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  progressCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  progressCardValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  progressCardLabel: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  commissionSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  commissionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  commissionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  commissionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  commissionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  commissionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  commissionTotals: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  commissionTotalCard: {
    flex: 1,
    alignItems: 'center',
  },
  commissionAmount: {
    fontSize: 24,
    fontWeight: '700',
  },
  commissionLabel: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  commissionProgressBar: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginTop: Spacing.sm,
    overflow: 'hidden',
  },
  commissionProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  commissionGoal: {
    fontSize: 10,
    marginTop: Spacing.xs,
  },
  recentCommissions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.md,
  },
  recentCommissionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  commissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  commissionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  commissionTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commissionItemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  commissionItemDate: {
    fontSize: 11,
  },
  commissionItemAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  routeSection: {
    marginBottom: Spacing.lg,
  },
  routeDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  routeDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  scheduleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  dragBadge: {
    backgroundColor: BrandColors.azureBlue + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  dragBadgeText: {
    fontSize: 12,
    color: BrandColors.azureBlue,
    fontWeight: '600',
  },
  routeList: {
    gap: Spacing.sm,
  },
  routeStopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  routeStopLeft: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: Spacing.md,
    gap: 4,
  },
  routeStopNumber: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.azureBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtons: {
    flexDirection: 'row',
    gap: 2,
  },
  reorderButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.xs,
    backgroundColor: 'rgba(0,120,212,0.1)',
  },
  reorderButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  routeStopNumberText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  routeStopContent: {
    flex: 1,
  },
  routeStopName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  routeStopAddress: {
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
  routeStopMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  routeStopTime: {
    marginLeft: Spacing.sm,
  },
  routeStopTimeText: {
    fontSize: 13,
    color: BrandColors.azureBlue,
    fontWeight: '600',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: BrandColors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptyStateText: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
  },
});
