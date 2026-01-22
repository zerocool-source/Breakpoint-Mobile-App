import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { JobCard } from '@/components/JobCard';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, Spacing } from '@/constants/theme';
import { mockJobs } from '@/lib/mockData';
import type { Job } from '@/types';

export default function JobsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [jobs] = useState<Job[]>(mockJobs);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderJob = useCallback(
    ({ item, index }: { item: Job; index: number }) => (
      <Animated.View entering={FadeInUp.delay(index * 100).springify()}>
        <JobCard job={item} index={index} onPress={() => {}} />
      </Animated.View>
    ),
    []
  );

  const renderEmpty = () => (
    <EmptyState
      image={require('../../../assets/images/empty-jobs.png')}
      title="No Jobs Assigned"
      message="You don't have any jobs assigned for today"
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={[
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.screenPadding,
          },
          jobs.length === 0 && styles.emptyContainer,
        ]}
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
  emptyContainer: {
    flexGrow: 1,
  },
});
