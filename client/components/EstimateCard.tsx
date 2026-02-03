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
import type { Estimate } from '@/types';

interface EstimateCardProps {
  estimate: Estimate;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function EstimateCard({ estimate, onPress }: EstimateCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.surface },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.estimateNumber}>{estimate.estimateNumber}</ThemedText>
          <ThemedText style={styles.propertyName} numberOfLines={1}>
            {estimate.propertyName || estimate.property?.name || 'Unknown Property'}
          </ThemedText>
        </View>
        <Badge variant={estimate.status as any} />
      </View>

      <View style={styles.footer}>
        <View style={styles.dateContainer}>
          <Feather name="calendar" size={14} color={theme.textSecondary} />
          <ThemedText style={[styles.date, { color: theme.textSecondary }]}>
            {formatDate(estimate.createdAt)}
          </ThemedText>
        </View>
        <ThemedText style={styles.total}>{formatCurrency((estimate.totalAmount || estimate.total || 0) / 100)}</ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  estimateNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.azureBlue,
    marginBottom: 2,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 13,
    marginLeft: Spacing.xs,
  },
  total: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.emerald,
  },
});
