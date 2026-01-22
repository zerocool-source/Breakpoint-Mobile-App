import React from 'react';
import { StyleSheet, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface MetricCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number;
  color: string;
  onPress?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MetricCard({ icon, label, value, color, onPress }: MetricCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 150 });
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
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <ThemedText style={[styles.value, { color }]}>{value}</ThemedText>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]} numberOfLines={2}>
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.card,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
});
