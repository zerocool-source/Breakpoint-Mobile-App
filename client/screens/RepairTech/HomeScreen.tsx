import React, { useState, useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { NextStopCard } from '@/components/NextStopCard';
import { QuickActionButton } from '@/components/QuickActionButton';
import { JobCard } from '@/components/JobCard';
import { ChatFAB } from '@/components/ChatFAB';
import { OfflineBanner } from '@/components/OfflineBanner';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { useNetwork } from '@/context/NetworkContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, Spacing } from '@/constants/theme';
import { mockJobs, mockRouteStops } from '@/lib/mockData';
import type { Job } from '@/types';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const { isConnected } = useNetwork();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [refreshing, setRefreshing] = useState(false);

  const nextStop = mockRouteStops.find(stop => !stop.completed);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleDragEnd = ({ data }: { data: Job[] }) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setJobs(data.map((job, index) => ({ ...job, order: index + 1 })));
  };

  const handleQuickAction = (action: string) => {
    navigation.navigate(action as keyof RootStackParamList);
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      {!isConnected ? <OfflineBanner /> : null}

      <View style={styles.greetingSection}>
        <View style={styles.greetingText}>
          <ThemedText style={styles.greeting}>{getGreeting()},</ThemedText>
          <ThemedText style={styles.userName}>{user?.name || 'Technician'}</ThemedText>
        </View>
      </View>

      {nextStop ? (
        <View style={styles.section}>
          <NextStopCard routeStop={nextStop} onPress={() => {}} />
        </View>
      ) : null}

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
        <View style={styles.quickActionsGrid}>
          <View style={styles.quickActionsRow}>
            <QuickActionButton
              icon="alert-triangle"
              label="Emergency"
              color={BrandColors.danger}
              onPress={() => handleQuickAction('ReportIssue')}
            />
            <View style={styles.quickActionSpacer} />
            <QuickActionButton
              icon="file-text"
              label="New Estimate"
              color={BrandColors.emerald}
              onPress={() => handleQuickAction('CreateEstimate')}
            />
          </View>
          <View style={styles.quickActionsRow}>
            <QuickActionButton
              icon="package"
              label="Order Parts"
              color={BrandColors.vividTangerine}
              onPress={() => {}}
            />
            <View style={styles.quickActionSpacer} />
            <QuickActionButton
              icon="alert-circle"
              label="Report Issue"
              color={BrandColors.danger}
              onPress={() => handleQuickAction('ReportIssue')}
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Today's Jobs</ThemedText>
      </View>
    </View>
  );

  const renderJob = useCallback(
    ({ item, drag, isActive, getIndex }: RenderItemParams<Job>) => (
      <ScaleDecorator>
        <JobCard
          job={item}
          index={getIndex() ?? 0}
          drag={drag}
          isActive={isActive}
          onPress={() => {}}
        />
      </ScaleDecorator>
    ),
    []
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <DraggableFlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderJob}
        onDragEnd={handleDragEnd}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: tabBarHeight + Spacing.fabSize + Spacing['2xl'],
          paddingHorizontal: Spacing.screenPadding,
        }}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BrandColors.azureBlue} />
        }
        showsVerticalScrollIndicator={false}
      />
      <ChatFAB
        onPress={() => navigation.navigate('Chat')}
        bottom={tabBarHeight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContent: {
    marginBottom: Spacing.sm,
  },
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  greetingText: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: BrandColors.textSecondary,
  },
  userName: {
    fontSize: 26,
    fontWeight: '700',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  quickActionsGrid: {
    gap: Spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
  },
  quickActionSpacer: {
    width: Spacing.md,
  },
});
