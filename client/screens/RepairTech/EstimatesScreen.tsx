import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Pressable, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { EstimateCard } from '@/components/EstimateCard';
import { EmptyState } from '@/components/EmptyState';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { getLocalApiUrl, joinUrl } from '@/lib/query-client';
import type { Estimate } from '@/types';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FilterTab = 'all' | 'draft' | 'pending' | 'approved';

export default function EstimatesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const { data: estimatesData, isLoading, refetch, isRefetching } = useQuery<Estimate[]>({
    queryKey: ['/api/estimates'],
    queryFn: async () => {
      const apiUrl = getLocalApiUrl();
      const response = await fetch(joinUrl(apiUrl, '/api/estimates'), {
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

  const estimates = estimatesData || [];

  const filteredEstimates = useMemo(() => {
    if (activeFilter === 'all') return estimates;
    if (activeFilter === 'draft') return estimates.filter(e => e.status === 'draft');
    if (activeFilter === 'pending') return estimates.filter(e => e.status === 'pending_approval');
    if (activeFilter === 'approved') return estimates.filter(e => e.status === 'approved' || e.status === 'scheduled' || e.status === 'completed');
    return estimates;
  }, [estimates, activeFilter]);

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderEstimate = useCallback(
    ({ item, index }: { item: Estimate; index: number }) => (
      <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
        <EstimateCard
          estimate={item}
          onPress={() => navigation.navigate('EstimateDetail', { estimateId: item.id })}
        />
      </Animated.View>
    ),
    [navigation]
  );

  const getEmptyMessage = () => {
    if (activeFilter === 'draft') return 'No draft estimates. Create one to get started!';
    if (activeFilter === 'pending') return 'No estimates pending approval.';
    if (activeFilter === 'approved') return 'No approved estimates yet.';
    return 'Create your first estimate to get started';
  };

  const renderEmpty = () => (
    <EmptyState
      image={require('../../../assets/images/empty-estimates.png')}
      title={activeFilter === 'all' ? 'No Estimates Yet' : `No ${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Estimates`}
      message={getEmptyMessage()}
      actionLabel="Create Estimate"
      onAction={() => navigation.navigate('AceEstimateBuilder')}
    />
  );

  const handleFilterChange = (filter: FilterTab) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveFilter(filter);
  };

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: estimates.length },
    { key: 'draft', label: 'Drafts', count: estimates.filter(e => e.status === 'draft').length },
    { key: 'pending', label: 'Pending', count: estimates.filter(e => e.status === 'pending_approval').length },
    { key: 'approved', label: 'Approved', count: estimates.filter(e => ['approved', 'scheduled', 'completed'].includes(e.status)).length },
  ];

  const renderHeader = () => (
    <View style={styles.createOptionsContainer}>
      <Pressable
        onPress={() => navigation.navigate('AceEstimateBuilder')}
        style={styles.aceCreateCard}
      >
        <Image
          source={require('../../../assets/images/ace-ai-button.png')}
          style={styles.aceCardImage}
          resizeMode="contain"
        />
      </Pressable>

      <View style={styles.filterTabsContainer}>
        {filterTabs.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => handleFilterChange(tab.key)}
            style={[
              styles.filterTab,
              activeFilter === tab.key && styles.filterTabActive,
              { backgroundColor: activeFilter === tab.key ? BrandColors.azureBlue : theme.surface },
            ]}
          >
            <ThemedText style={[
              styles.filterTabText,
              { color: activeFilter === tab.key ? '#fff' : theme.text },
            ]}>
              {tab.label}
            </ThemedText>
            {tab.count > 0 ? (
              <View style={[
                styles.filterBadge,
                { backgroundColor: activeFilter === tab.key ? 'rgba(255,255,255,0.3)' : BrandColors.azureBlue + '20' },
              ]}>
                <ThemedText style={[
                  styles.filterBadgeText,
                  { color: activeFilter === tab.key ? '#fff' : BrandColors.azureBlue },
                ]}>
                  {tab.count}
                </ThemedText>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={BrandColors.azureBlue} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>Loading estimates...</ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={filteredEstimates}
        keyExtractor={(item) => item.id}
        renderItem={renderEstimate}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          {
            paddingTop: insets.top + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.screenPadding,
          },
          filteredEstimates.length === 0 && styles.emptyContainer,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={BrandColors.azureBlue} />
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
  emptyContainer: {
    flexGrow: 1,
  },
  createOptionsContainer: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  aceCreateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  aceCardImage: {
    width: '100%',
    height: 140,
  },
  aceCardContent: {
    flex: 1,
  },
  aceCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
  aceCardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  manualCreateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.md,
  },
  manualIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,120,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualCardContent: {
    flex: 1,
  },
  manualCardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  manualCardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  filterTabsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  filterTabActive: {},
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
