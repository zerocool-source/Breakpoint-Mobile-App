import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Pressable } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { MetricCard } from '@/components/MetricCard';
import { JobCard } from '@/components/JobCard';
import { Badge } from '@/components/Badge';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockJobs, mockQueueMetrics } from '@/lib/mockData';
import type { Job } from '@/types';

type Priority = 'all' | 'urgent' | 'high' | 'normal' | 'low';

const priorityOptions: { value: Priority; label: string }[] = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Low' },
];

export default function QueueScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<Priority>('all');
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);

  const filteredJobs = selectedPriority === 'all'
    ? mockJobs
    : mockJobs.filter(job => job.priority === selectedPriority);

  const groupedJobs = {
    urgent: filteredJobs.filter(j => j.priority === 'urgent'),
    high: filteredJobs.filter(j => j.priority === 'high'),
    normal: filteredJobs.filter(j => j.priority === 'normal'),
    low: filteredJobs.filter(j => j.priority === 'low'),
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleMetricPress = (type: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (type === 'urgent') {
      setSelectedPriority('urgent');
    }
  };

  const renderPrioritySection = (priority: 'urgent' | 'high' | 'normal' | 'low', jobs: Job[]) => {
    if (jobs.length === 0) return null;

    return (
      <View style={styles.section} key={priority}>
        <View style={styles.sectionHeader}>
          <Badge variant={priority} />
          <ThemedText style={[styles.sectionCount, { color: theme.textSecondary }]}>
            {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
          </ThemedText>
        </View>
        {jobs.map((job, index) => (
          <JobCard key={job.id} job={job} index={index} onPress={() => {}} />
        ))}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.metricsGrid}>
        <View style={styles.metricsRow}>
          <MetricCard
            icon="file-text"
            label="My Estimates"
            value={mockQueueMetrics.myEstimates}
            color={BrandColors.azureBlue}
            onPress={() => handleMetricPress('estimates')}
          />
          <View style={styles.metricSpacer} />
          <MetricCard
            icon="alert-triangle"
            label="Urgent Jobs"
            value={mockQueueMetrics.urgentJobs}
            color={BrandColors.danger}
            onPress={() => handleMetricPress('urgent')}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            icon="package"
            label="Parts Ordered"
            value={mockQueueMetrics.partsOrdered}
            color={BrandColors.vividTangerine}
            onPress={() => handleMetricPress('parts')}
          />
          <View style={styles.metricSpacer} />
          <MetricCard
            icon="check-circle"
            label="Completed"
            value={mockQueueMetrics.completed}
            color={BrandColors.emerald}
            onPress={() => handleMetricPress('completed')}
          />
        </View>
      </Animated.View>

      <View style={styles.filterSection}>
        <ThemedText style={styles.filterLabel}>Filter by Priority</ThemedText>
        <Pressable
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setShowPriorityPicker(!showPriorityPicker);
          }}
          style={[styles.priorityPicker, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <ThemedText style={styles.priorityPickerText}>
            {priorityOptions.find(p => p.value === selectedPriority)?.label}
          </ThemedText>
          <Feather name={showPriorityPicker ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
        </Pressable>

        {showPriorityPicker ? (
          <View style={[styles.priorityDropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {priorityOptions.map(option => (
              <Pressable
                key={option.value}
                onPress={() => {
                  setSelectedPriority(option.value);
                  setShowPriorityPicker(false);
                }}
                style={[
                  styles.priorityOption,
                  selectedPriority === option.value && { backgroundColor: BrandColors.azureBlue + '15' },
                ]}
              >
                <ThemedText style={[
                  styles.priorityOptionText,
                  selectedPriority === option.value && { color: BrandColors.azureBlue, fontWeight: '600' },
                ]}>
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        ref={listRef}
        data={[1]}
        keyExtractor={() => 'queue'}
        renderItem={() => (
          <>
            {selectedPriority === 'all' ? (
              <>
                {renderPrioritySection('urgent', groupedJobs.urgent)}
                {renderPrioritySection('high', groupedJobs.high)}
                {renderPrioritySection('normal', groupedJobs.normal)}
                {renderPrioritySection('low', groupedJobs.low)}
              </>
            ) : (
              renderPrioritySection(selectedPriority, filteredJobs)
            )}
          </>
        )}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.screenPadding,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BrandColors.azureBlue} />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContent: {
    marginBottom: Spacing.lg,
  },
  metricsGrid: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  metricsRow: {
    flexDirection: 'row',
  },
  metricSpacer: {
    width: Spacing.md,
  },
  filterSection: {
    marginBottom: Spacing.lg,
    zIndex: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  priorityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  priorityPickerText: {
    fontSize: 15,
  },
  priorityDropdown: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    ...Shadows.card,
    zIndex: 100,
  },
  priorityOption: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  priorityOptionText: {
    fontSize: 15,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionCount: {
    fontSize: 13,
    marginLeft: Spacing.sm,
  },
});
