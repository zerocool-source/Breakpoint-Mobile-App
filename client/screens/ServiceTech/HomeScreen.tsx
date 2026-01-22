import React, { useState, useCallback } from 'react';
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
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import {
  mockAssignments,
  mockRouteStops,
  mockDailyProgress,
  mockTruckInfo,
  type Assignment,
  type RouteStop,
} from '@/lib/serviceTechMockData';

type RootStackParamList = {
  PropertyDetail: { stop: RouteStop };
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
  onPress: () => void;
}

function RouteStopCard({ stop, index, onPress }: RouteStopCardProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable 
      style={[styles.routeStopCard, { backgroundColor: theme.surface }]}
      onPress={onPress}
    >
      <View style={styles.routeStopNumber}>
        <ThemedText style={styles.routeStopNumberText}>{index + 1}</ThemedText>
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [assignmentsExpanded, setAssignmentsExpanded] = useState(true);
  const [currentTime] = useState(getCurrentTime());
  
  const nextStop = mockRouteStops.find(stop => !stop.completed) || mockRouteStops[0];
  const progress = mockDailyProgress;

  const handleSync = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleStopPress = useCallback((stop: RouteStop) => {
    navigation.navigate('PropertyDetail', { stop });
  }, [navigation]);

  return (
    <BubbleBackground bubbleCount={18}>
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
                    onPress={() => {}}
                  />
                ))}
              </View>
            )}
          </Pressable>
        </Animated.View>

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

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.routeSection}>
            <View style={styles.routeHeader}>
              <ThemedText style={styles.routeTitle}>Today's Route</ThemedText>
              <View style={styles.dragBadge}>
                <ThemedText style={styles.dragBadgeText}>Drag to reorder</ThemedText>
              </View>
            </View>
            <View style={styles.routeList}>
              {mockRouteStops.map((stop, index) => (
                <RouteStopCard
                  key={stop.id}
                  stop={stop}
                  index={index}
                  onPress={() => handleStopPress(stop)}
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
  routeSection: {
    marginBottom: Spacing.lg,
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
  routeStopNumber: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.azureBlue,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
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
});
