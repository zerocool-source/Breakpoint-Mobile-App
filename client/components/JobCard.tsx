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
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
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
      scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
    }
  };

  const handlePressOut = () => {
    if (!isActive) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
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
        animatedStyle,
      ]}
    >
      <Pressable onPressIn={drag} style={styles.dragHandle}>
        <Feather name="menu" size={20} color={BrandColors.dragHandle} />
      </Pressable>

      <View style={styles.indexContainer}>
        <ThemedText style={styles.indexText}>{index + 1}</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {job.property.name}
          </ThemedText>
          <Badge variant={job.priority} />
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Feather name="clock" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {job.scheduledTime}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
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
            <Feather name="droplet" size={12} color={BrandColors.tropicalTeal} />
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
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  dragHandle: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  indexContainer: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.azureBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  indexText: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  details: {
    marginBottom: Spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 13,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jobTitle: {
    fontSize: 13,
    color: BrandColors.azureBlue,
    fontWeight: '500',
    flex: 1,
  },
  poolCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  poolCountText: {
    fontSize: 12,
    marginLeft: 4,
    color: BrandColors.tropicalTeal,
    fontWeight: '600',
  },
});
