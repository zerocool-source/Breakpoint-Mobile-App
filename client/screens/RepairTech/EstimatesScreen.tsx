import React, { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Pressable, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { EstimateCard } from '@/components/EstimateCard';
import { EmptyState } from '@/components/EmptyState';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
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

  const renderHeader = () => (
    <View style={styles.createOptionsContainer}>
      <Pressable
        onPress={() => navigation.navigate('AceEstimateBuilder')}
        style={styles.aceCreateCard}
      >
        <Image
          source={require('../../../assets/images/ask-ace-button.png')}
          style={styles.aceCardImage}
          resizeMode="contain"
        />
        <View style={styles.aceCardContent}>
          <ThemedText style={styles.aceCardTitle}>Create with Ace AI</ThemedText>
          <ThemedText style={[styles.aceCardSubtitle, { color: theme.textSecondary }]}>
            Let AI help you find products
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={BrandColors.azureBlue} />
      </Pressable>

      <Pressable
        onPress={() => navigation.navigate('EstimateBuilder')}
        style={[styles.manualCreateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
      >
        <View style={styles.manualIconContainer}>
          <Feather name="file-plus" size={24} color={BrandColors.azureBlue} />
        </View>
        <View style={styles.manualCardContent}>
          <ThemedText style={styles.manualCardTitle}>Create Manually</ThemedText>
          <ThemedText style={[styles.manualCardSubtitle, { color: theme.textSecondary }]}>
            Build estimate from catalog
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={estimates}
        keyExtractor={(item) => item.id}
        renderItem={renderEstimate}
        ListHeaderComponent={renderHeader}
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
  createOptionsContainer: {
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  aceCreateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: BrandColors.azureBlue,
    gap: Spacing.md,
    ...Shadows.card,
  },
  aceCardImage: {
    width: 60,
    height: 48,
    borderRadius: BorderRadius.sm,
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
});
