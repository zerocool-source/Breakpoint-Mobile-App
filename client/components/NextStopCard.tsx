import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
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
import { BrandColors, BorderRadius, Spacing, Shadows, SpringConfigs } from '@/constants/theme';
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
    scale.value = withSpring(0.98, SpringConfigs.responsive);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfigs.responsive);
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
        Shadows.card,
        animatedStyle,
      ]}
    >
      <View style={styles.header}>
        <View style={styles.labelContainer}>
          <View style={styles.labelIconBg}>
            <Feather name="navigation" size={16} color={BrandColors.azureBlue} />
          </View>
          <ThemedText style={styles.label}>Next Stop</ThemedText>
        </View>
        <Badge variant={routeStop.property.type as 'residential' | 'commercial' | 'municipal'} size="medium" />
      </View>

      <ThemedText style={styles.propertyName} numberOfLines={1}>
        {routeStop.property.name}
      </ThemedText>

      <View style={styles.addressRow}>
        <Feather name="map-pin" size={16} color={theme.textSecondary} />
        <ThemedText style={[styles.address, { color: theme.textSecondary }]} numberOfLines={1}>
          {routeStop.property.address}
        </ThemedText>
      </View>

      <View style={styles.footer}>
        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: BrandColors.azureBlue + '12' }]}>
            <Feather name="clock" size={16} color={BrandColors.azureBlue} />
          </View>
          <ThemedText style={styles.infoText}>{routeStop.scheduledTime}</ThemedText>
        </View>
        <View style={styles.infoItem}>
          <View style={[styles.infoIcon, { backgroundColor: BrandColors.tropicalTeal + '12' }]}>
            <Feather name="droplet" size={16} color={BrandColors.tropicalTeal} />
          </View>
          <ThemedText style={[styles.infoText, { color: BrandColors.tropicalTeal }]}>
            {routeStop.property.poolCount} {routeStop.property.poolCount === 1 ? 'Pool' : 'Pools'}
          </ThemedText>
        </View>
        <View style={styles.chevronContainer}>
          <Feather name="chevron-right" size={24} color={theme.textSecondary} />
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelIconBg: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.azureBlue + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: BrandColors.azureBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  propertyName: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  address: {
    fontSize: 15,
    marginLeft: Spacing.sm,
    flex: 1,
    letterSpacing: 0.1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Spacing.xl,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '600',
    color: BrandColors.azureBlue,
  },
  chevronContainer: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
