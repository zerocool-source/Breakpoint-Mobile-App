import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { EstimateCard } from '@/components/EstimateCard';
import { EmptyState } from '@/components/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, Spacing } from '@/constants/theme';
import { mockEstimates } from '@/lib/mockData';
import type { Estimate } from '@/types';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function EstimatesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [estimates] = useState<Estimate[]>(mockEstimates);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

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

  const renderEmpty = () => (
    <EmptyState
      image={require('../../../assets/images/empty-estimates.png')}
      title="No Estimates Yet"
      message="Create your first estimate to get started"
      actionLabel="Create Estimate"
      onAction={() => navigation.navigate('EstimateBuilder')}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={estimates}
        keyExtractor={(item) => item.id}
        renderItem={renderEstimate}
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: tabBarHeight + Spacing.xl,
            paddingHorizontal: Spacing.screenPadding,
          },
          estimates.length === 0 && styles.emptyContainer,
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
