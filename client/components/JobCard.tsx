import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Badge } from '@/components/Badge';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows, SpringConfigs } from '@/constants/theme';
import type { Job } from '@/types';

interface JobCardProps {
  job: Job;
  index: number;
  onPress?: () => void;
  drag?: () => void;
  isActive?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function JobCard({ job, index, onPress, drag, isActive }: JobCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!isActive) {
      scale.value = withSpring(0.98, SpringConfigs.responsive);
    }
  };

  const handlePressOut = () => {
    if (!isActive) {
      scale.value = withSpring(1, SpringConfigs.responsive);
    }
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={drag}
      delayLongPress={150}
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: isActive ? BrandColors.azureBlue : 'transparent',
          borderWidth: isActive ? 2 : 0,
        },
        Shadows.card,
        animatedStyle,
      ]}
    >
      <Pressable onPressIn={drag} style={styles.dragHandle}>
        <Feather name="menu" size={22} color={BrandColors.dragHandle} />
      </Pressable>

      <View style={styles.indexContainer}>
        <ThemedText style={styles.indexText}>{index + 1}</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {job.property.name}
          </ThemedText>
          <Badge variant={job.priority} size="small" />
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Feather name="clock" size={15} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {job.scheduledTime}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={15} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]} numberOfLines={1}>
              {job.property.address}
            </ThemedText>
          </View>
        </View>

        <View style={styles.footer}>
          <ThemedText style={styles.jobTitle} numberOfLines={1}>
            {job.title}
          </ThemedText>
          <View style={styles.poolCount}>
            <View style={styles.poolIcon}>
              <Feather name="droplet" size={14} color={BrandColors.tropicalTeal} />
            </View>
            <ThemedText style={styles.poolCountText}>
              {job.property.poolCount}
            </ThemedText>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  dragHandle: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  indexContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.azureBlue + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  indexText: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.azureBlue,
    fontVariant: ['tabular-nums'],
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.md,
    letterSpacing: -0.2,
  },
  details: {
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginLeft: Spacing.sm,
    flex: 1,
    letterSpacing: 0.1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobTitle: {
    fontSize: 14,
    color: BrandColors.azureBlue,
    fontWeight: '600',
    flex: 1,
    letterSpacing: 0.1,
  },
  poolCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poolIcon: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.tropicalTeal + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xs,
  },
  poolCountText: {
    fontSize: 14,
    color: BrandColors.tropicalTeal,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
