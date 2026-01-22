import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { QuickActionButton } from '@/components/QuickActionButton';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import {
  mockWeeklyMetrics,
  mockQCInspections,
  supervisorInfo,
  type QCInspection,
} from '@/lib/supervisorMockData';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

interface MetricCardBorderedProps {
  value: number;
  label: string;
  color: string;
}

function MetricCardBordered({ value, label, color }: MetricCardBorderedProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: color }]}>
      <ThemedText style={[styles.metricValue, { color }]}>{value}</ThemedText>
      <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

interface InspectionItemProps {
  inspection: QCInspection;
  onPress: () => void;
}

function InspectionItem({ inspection, onPress }: InspectionItemProps) {
  const { theme } = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return BrandColors.vividTangerine;
      case 'SCHEDULED':
        return '#9C27B0';
      case 'COMPLETED':
        return BrandColors.emerald;
      case 'IN_PROGRESS':
        return BrandColors.azureBlue;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <Pressable style={[styles.inspectionItem, { backgroundColor: theme.surface }]} onPress={onPress}>
      <View style={styles.inspectionContent}>
        <ThemedText style={styles.inspectionProperty}>{inspection.propertyName}</ThemedText>
        <View style={styles.inspectionRow}>
          <Feather name="user" size={12} color={theme.textSecondary} />
          <ThemedText style={[styles.inspectionTech, { color: theme.textSecondary }]}>
            {inspection.technicianName}
          </ThemedText>
        </View>
        <View style={styles.inspectionRow}>
          <Feather name="clock" size={12} color={theme.textSecondary} />
          <ThemedText style={[styles.inspectionTime, { color: theme.textSecondary }]}>
            {inspection.time} - {inspection.date}
          </ThemedText>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(inspection.status) + '20' }]}>
        <ThemedText style={[styles.statusText, { color: getStatusColor(inspection.status) }]}>
          {inspection.status}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export default function SupervisorHomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);
  const metrics = mockWeeklyMetrics;
  const inspections = mockQCInspections.slice(0, 4);

  const handleChatPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleQuickAction = (action: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={['#1a237e', '#283593', '#3949ab']}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Avatar name={user?.name || supervisorInfo.name} size="medium" />
            <View style={styles.headerText}>
              <ThemedText style={styles.greeting}>{getGreeting()},</ThemedText>
              <ThemedText style={styles.userName}>
                {user?.name?.split(' ')[0] || 'Supervisor'}
              </ThemedText>
            </View>
          </View>
          <Pressable style={styles.chatButton} onPress={handleChatPress}>
            <Feather name="message-circle" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        
        <View style={styles.regionBadge}>
          <Feather name="map-pin" size={14} color="#FFFFFF" />
          <ThemedText style={styles.regionText}>{supervisorInfo.region}</ThemedText>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>This Week</ThemedText>
          </View>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricsRow}>
              <MetricCardBordered
                value={metrics.assignmentsCreated}
                label="Assignments Created"
                color={BrandColors.azureBlue}
              />
              <MetricCardBordered
                value={metrics.propertiesInspected}
                label="Properties Inspected"
                color={BrandColors.emerald}
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCardBordered
                value={metrics.pendingResponses}
                label="Pending Responses"
                color={BrandColors.vividTangerine}
              />
              <MetricCardBordered
                value={metrics.qcInspections}
                label="QC Inspections"
                color="#9C27B0"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionBullet, { backgroundColor: BrandColors.azureBlue }]} />
              <ThemedText style={styles.sectionTitle}>QC Inspections</ThemedText>
            </View>
          </View>
          
          <View style={styles.inspectionsList}>
            {inspections.map((inspection) => (
              <InspectionItem
                key={inspection.id}
                inspection={inspection}
                onPress={() => {}}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Pressable
            style={[styles.quickActionsHeader, { backgroundColor: theme.surface }]}
            onPress={() => setQuickActionsExpanded(!quickActionsExpanded)}
          >
            <ThemedText style={styles.quickActionsTitle}>QUICK ACTIONS</ThemedText>
            <Feather
              name={quickActionsExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
          
          {quickActionsExpanded ? (
            <View style={styles.quickActionsGrid}>
              <View style={styles.quickActionsRow}>
                <QuickActionButton
                  icon="tool"
                  label="Repairs Needed"
                  color={BrandColors.vividTangerine}
                  onPress={() => handleQuickAction('repairs')}
                />
                <QuickActionButton
                  icon="droplet"
                  label="Chemical Order"
                  color={BrandColors.azureBlue}
                  onPress={() => handleQuickAction('chemical')}
                />
                <QuickActionButton
                  icon="truck"
                  label="Chemicals Drop-Off"
                  color="#FF6B6B"
                  onPress={() => handleQuickAction('dropoff')}
                />
              </View>
              <View style={styles.quickActionsRow}>
                <QuickActionButton
                  icon="wind"
                  label="Windy Day Clean Up"
                  color={BrandColors.tropicalTeal}
                  onPress={() => handleQuickAction('windy')}
                />
                <QuickActionButton
                  icon="settings"
                  label="Service Repairs"
                  color={BrandColors.vividTangerine}
                  onPress={() => handleQuickAction('service')}
                />
                <QuickActionButton
                  icon="alert-triangle"
                  label="Report Issue"
                  color={BrandColors.danger}
                  onPress={() => handleQuickAction('report')}
                />
              </View>
            </View>
          ) : null}
        </Animated.View>
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
    paddingBottom: Spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  regionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionBullet: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    ...Shadows.card,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  inspectionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  inspectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  inspectionContent: {
    flex: 1,
  },
  inspectionProperty: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inspectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  inspectionTech: {
    fontSize: 13,
  },
  inspectionTime: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quickActionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  quickActionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    gap: Spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
});
