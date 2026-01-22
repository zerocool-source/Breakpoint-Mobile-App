import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { BubbleBackground } from '@/components/BubbleBackground';
import { Avatar } from '@/components/Avatar';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockTechnicians, type Technician } from '@/lib/supervisorMockData';

type FilterType = 'all' | 'active' | 'break' | 'offline';

const statusConfig = {
  active: { label: 'Active', color: BrandColors.emerald, icon: 'check-circle' as const },
  running_behind: { label: 'Running Behind', color: BrandColors.vividTangerine, icon: 'alert-circle' as const },
  on_break: { label: 'On Break', color: '#9C27B0', icon: 'coffee' as const },
  offline: { label: 'Offline', color: '#8E8E93', icon: 'wifi-off' as const },
  inactive: { label: 'Inactive', color: '#8E8E93', icon: 'minus-circle' as const },
};

interface TechnicianRowProps {
  technician: Technician;
  index: number;
  onPress: () => void;
}

function TechnicianRow({ technician, index, onPress }: TechnicianRowProps) {
  const { theme } = useTheme();
  const config = statusConfig[technician.status] || statusConfig.inactive;
  const isOnline = technician.status === 'active' || technician.status === 'running_behind';
  
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        style={[styles.techCard, { backgroundColor: theme.surface }]}
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
      >
        <View style={styles.techLeft}>
          <View style={styles.avatarContainer}>
            <Avatar name={technician.name} size="medium" />
            <View style={[styles.statusDot, { backgroundColor: config.color }]} />
          </View>
          <View style={styles.techInfo}>
            <ThemedText style={styles.techName}>{technician.name}</ThemedText>
            <View style={styles.roleRow}>
              <Feather 
                name={technician.role === 'service_tech' ? 'droplet' : 'tool'} 
                size={12} 
                color={theme.textSecondary} 
              />
              <ThemedText style={[styles.techRole, { color: theme.textSecondary }]}>
                {technician.role === 'service_tech' ? 'Service Tech' : 'Repair Tech'}
              </ThemedText>
            </View>
            {technician.currentStop && isOnline ? (
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={12} color={BrandColors.azureBlue} />
                <ThemedText style={[styles.locationText, { color: BrandColors.azureBlue }]} numberOfLines={1}>
                  {technician.currentStop}
                </ThemedText>
              </View>
            ) : null}
          </View>
        </View>
        
        <View style={styles.techRight}>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
            <Feather name={config.icon} size={12} color={config.color} />
            <ThemedText style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </ThemedText>
          </View>
          {isOnline ? (
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      backgroundColor: config.color,
                      width: `${(technician.progress.completed / technician.progress.total) * 100}%` 
                    }
                  ]} 
                />
              </View>
              <ThemedText style={[styles.progressText, { color: theme.textSecondary, fontVariant: ['tabular-nums'] }]}>
                {technician.progress.completed}/{technician.progress.total}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function WhosOnScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const technicians = mockTechnicians;

  const filteredTechnicians = technicians.filter(tech => {
    if (filter === 'all') return true;
    if (filter === 'active') return tech.status === 'active' || tech.status === 'running_behind';
    if (filter === 'break') return tech.status === 'on_break';
    if (filter === 'offline') return tech.status === 'offline' || tech.status === 'inactive';
    return true;
  });

  const activeCount = technicians.filter(t => t.status === 'active' || t.status === 'running_behind').length;
  const breakCount = technicians.filter(t => t.status === 'on_break').length;
  const offlineCount = technicians.filter(t => t.status === 'offline' || t.status === 'inactive').length;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdated(new Date());
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const handleTechPress = (tech: Technician) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: technicians.length },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'break', label: 'Break', count: breakCount },
    { key: 'offline', label: 'Offline', count: offlineCount },
  ];

  return (
    <BubbleBackground bubbleCount={18}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerContent}>
          <View>
            <ThemedText style={styles.headerTitle}>Who's On</ThemedText>
            <ThemedText style={styles.headerSubtitle}>
              Active technicians in the field
            </ThemedText>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <ThemedText style={styles.liveText}>LIVE</ThemedText>
          </View>
        </View>
        <ThemedText style={styles.lastUpdated}>
          Last updated: {formatTime(lastUpdated)}
        </ThemedText>
      </View>

      <View style={[styles.statsRow, { backgroundColor: theme.surface }]}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: BrandColors.emerald, fontVariant: ['tabular-nums'] }]}>
            {activeCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Active</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: '#9C27B0', fontVariant: ['tabular-nums'] }]}>
            {breakCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>On Break</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: '#8E8E93', fontVariant: ['tabular-nums'] }]}>
            {offlineCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Offline</ThemedText>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((f) => (
            <Pressable
              key={f.key}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: filter === f.key ? BrandColors.azureBlue : theme.surface,
                  borderColor: filter === f.key ? BrandColors.azureBlue : theme.border,
                }
              ]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.selectionAsync();
                }
                setFilter(f.key);
              }}
            >
              <ThemedText style={[
                styles.filterText,
                { color: filter === f.key ? '#FFFFFF' : theme.text }
              ]}>
                {f.label}
              </ThemedText>
              <View style={[
                styles.filterBadge,
                { backgroundColor: filter === f.key ? 'rgba(255,255,255,0.3)' : theme.border }
              ]}>
                <ThemedText style={[
                  styles.filterBadgeText,
                  { color: filter === f.key ? '#FFFFFF' : theme.textSecondary, fontVariant: ['tabular-nums'] }
                ]}>
                  {f.count}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BrandColors.azureBlue}
            colors={[BrandColors.azureBlue]}
          />
        }
      >
        {filteredTechnicians.length > 0 ? (
          filteredTechnicians.map((tech, index) => (
            <TechnicianRow
              key={tech.id}
              technician={tech}
              index={index}
              onPress={() => handleTechPress(tech)}
            />
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <Feather name="users" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyTitle, { color: theme.textSecondary }]}>
              No Technicians Found
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No technicians match the current filter
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.emerald,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  filterContainer: {
    marginBottom: Spacing.md,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  techCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  techLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  techInfo: {
    flex: 1,
  },
  techName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  techRole: {
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  techRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  progressBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});
