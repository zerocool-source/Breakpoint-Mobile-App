import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { BubbleBackground } from '@/components/BubbleBackground';
import { useTheme } from '@/hooks/useTheme';
import { usePropertyChannels } from '@/context/PropertyChannelsContext';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { extractItems, type Page } from '@/lib/query-client';
import type { Property } from '@shared/schema';

interface PropertyCardProps {
  property: Property;
  isSubscribed: boolean;
  onToggle: (propertyId: string, subscribed: boolean) => void;
  index: number;
  isLoading: boolean;
}

function PropertyCard({ property, isSubscribed, onToggle, index, isLoading }: PropertyCardProps) {
  const { theme } = useTheme();
  const [toggling, setToggling] = useState(false);

  const handleToggle = async (value: boolean) => {
    setToggling(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await onToggle(property.id, value);
    setToggling(false);
  };

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
      <View style={[styles.propertyCard, { backgroundColor: theme.surface }]}>
        <View style={styles.propertyIcon}>
          <View style={[styles.iconCircle, { backgroundColor: BrandColors.tropicalTeal + '20' }]}>
            <Feather name="map-pin" size={20} color={BrandColors.tropicalTeal} />
          </View>
        </View>
        
        <View style={styles.propertyInfo}>
          <ThemedText style={styles.propertyName}>{property?.name ?? 'Unknown Property'}</ThemedText>
          <ThemedText style={[styles.propertyAddress, { color: theme.textSecondary }]}>
            {property?.address ?? 'Address unavailable'}
          </ThemedText>
          <View style={styles.propertyMeta}>
            <View style={styles.metaItem}>
              <Feather name="droplet" size={12} color={BrandColors.azureBlue} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {property.poolCount} {property.poolCount === 1 ? 'pool' : 'pools'}
              </ThemedText>
            </View>
            <View style={styles.metaItem}>
              <Feather name="tag" size={12} color={BrandColors.vividTangerine} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {property.type}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.switchContainer}>
          {toggling || isLoading ? (
            <ActivityIndicator size="small" color={BrandColors.azureBlue} />
          ) : (
            <Switch
              value={isSubscribed}
              onValueChange={handleToggle}
              trackColor={{ false: theme.border, true: BrandColors.tropicalTeal }}
              thumbColor={isSubscribed ? '#fff' : '#f4f3f4'}
              ios_backgroundColor={theme.border}
            />
          )}
        </View>
      </View>
    </Animated.View>
  );
}

export default function PropertyChannelsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { channels, addChannel, removeChannel, isPropertyInChannels, isLoading: channelsLoading } = usePropertyChannels();
  const [refreshing, setRefreshing] = useState(false);

  const { data: propertiesData, isLoading: propertiesLoading, refetch } = useQuery<Page<Property>>({
    queryKey: ['/api/properties'],
  });

  const allProperties = useMemo(() => extractItems(propertiesData), [propertiesData]);

  const handleToggle = async (propertyId: string, subscribed: boolean) => {
    if (subscribed) {
      await addChannel(propertyId);
    } else {
      await removeChannel(propertyId);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const subscribedCount = channels.length;
  const totalCount = allProperties.length;

  const isLoading = propertiesLoading || channelsLoading;

  return (
    <BubbleBackground bubbleCount={12}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerContent}>
          <ThemedText style={styles.headerTitle}>Property Channels</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Select properties to add to your channels
          </ThemedText>
        </View>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: BrandColors.tropicalTeal }]}>
            {subscribedCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Subscribed
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: BrandColors.azureBlue }]}>
            {totalCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
            Available
          </ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={BrandColors.azureBlue}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BrandColors.azureBlue} />
            <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
              Loading properties...
            </ThemedText>
          </View>
        ) : allProperties.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surface }]}>
              <Feather name="map" size={48} color={theme.textSecondary} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              No Properties Yet
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Properties will appear here once they are added to the system.
            </ThemedText>
          </View>
        ) : (
          <>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              AVAILABLE PROPERTIES
            </ThemedText>
            {allProperties.map((property, index) => (
              <PropertyCard
                key={property.id}
                property={property}
                isSubscribed={isPropertyInChannels(property.id)}
                onToggle={handleToggle}
                index={index}
                isLoading={channelsLoading}
              />
            ))}
          </>
        )}
      </ScrollView>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    marginTop: 4,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  statsContainer: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  propertyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.subtle,
  },
  propertyIcon: {
    marginRight: Spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  propertyAddress: {
    fontSize: 13,
    marginBottom: 6,
  },
  propertyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontWeight: '500',
  },
  switchContainer: {
    marginLeft: Spacing.sm,
    width: 60,
    alignItems: 'flex-end',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
