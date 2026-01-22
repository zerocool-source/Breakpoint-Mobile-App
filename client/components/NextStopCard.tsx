import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { Badge } from '@/components/Badge';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import type { RouteStop } from '@/types';

interface NextStopCardProps {
  routeStop: RouteStop;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NextStopCard({ routeStop, onPress }: NextStopCardProps) {
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { backgroundColor: theme.surface },
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <Feather name="navigation" size={14} color={BrandColors.azureBlue} />
          <ThemedText style={styles.label}>Next Stop</ThemedText>
        </View>
        <Badge variant={routeStop.property.type as 'residential' | 'commercial' | 'municipal'} />
      </View>

      <ThemedText style={styles.propertyName} numberOfLines={1}>
        {routeStop.property.name}
      </ThemedText>

      <View style={styles.addressRow}>
        <Feather name="map-pin" size={14} color={theme.textSecondary} />
        <ThemedText style={[styles.address, { color: theme.textSecondary }]} numberOfLines={1}>
          {routeStop.property.address}
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <View style={styles.infoItem}>
          <Feather name="clock" size={14} color={BrandColors.azureBlue} />
          <ThemedText style={styles.infoText}>{routeStop.scheduledTime}</ThemedText>
        </View>
        <View style={styles.infoItem}>
          <Feather name="droplet" size={14} color={BrandColors.tropicalTeal} />
          <ThemedText style={[styles.infoText, { color: BrandColors.tropicalTeal }]}>
            {routeStop.property.poolCount} {routeStop.property.poolCount === 1 ? 'Pool' : 'Pools'}
          </ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.azureBlue,
    marginLeft: Spacing.xs,
    textTransform: 'uppercase',
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  address: {
    fontSize: 14,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: Spacing.xs,
    color: BrandColors.azureBlue,
  },
});
