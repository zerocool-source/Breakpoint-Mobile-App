import React from 'react';
import { StyleSheet, Pressable, View, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Shadows, SpringConfigs } from '@/constants/theme';

interface MetricCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: number;
  color: string;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const sizeConfigs = {
  small: { 
    iconContainer: 40, 
    iconSize: 20, 
    padding: Spacing.md, 
    valueSize: 26, 
    labelSize: 11,
    borderRadius: BorderRadius.lg,
  },
  medium: { 
    iconContainer: 48, 
    iconSize: 24, 
    padding: Spacing.lg, 
    valueSize: 32, 
    labelSize: 12,
    borderRadius: BorderRadius.xl,
  },
  large: { 
    iconContainer: 56, 
    iconSize: 28, 
    padding: Spacing.xl, 
    valueSize: 40, 
    labelSize: 14,
    borderRadius: BorderRadius['2xl'],
  },
};

export function MetricCard({ icon, label, value, color, onPress, size = 'medium' }: MetricCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const config = sizeConfigs[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, SpringConfigs.responsive);
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
        { 
          backgroundColor: theme.surface,
          padding: config.padding,
          borderRadius: config.borderRadius,
        },
        Shadows.card,
        animatedStyle,
      ]}
    >
      <View 
        style={[
          styles.iconContainer, 
          { 
            backgroundColor: color + '12',
            width: config.iconContainer,
            height: config.iconContainer,
            borderRadius: config.iconContainer / 2.5,
          }
        ]}
      >
        <Feather name={icon} size={config.iconSize} color={color} />
      </View>
      <ThemedText 
        style={[
          styles.value, 
          { 
            color,
            fontSize: config.valueSize,
          }
        ]}
      >
        {value}
      </ThemedText>
      <ThemedText 
        style={[
          styles.label, 
          { 
            color: theme.textSecondary,
            fontSize: config.labelSize,
          }
        ]} 
        numberOfLines={2}
      >
        {label}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  value: {
    fontWeight: '700',
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
