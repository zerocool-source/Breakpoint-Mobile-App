import React from "react";
import { StyleSheet, Pressable, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Shadows, SpringConfigs } from "@/constants/theme";

interface CardProps {
  elevation?: number;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
}

const springConfig: WithSpringConfig = {
  damping: SpringConfigs.responsive.damping,
  mass: SpringConfigs.responsive.mass,
  stiffness: SpringConfigs.responsive.stiffness,
  overshootClamping: true,
};

const getBackgroundColorForElevation = (
  elevation: number,
  theme: any,
): string => {
  switch (elevation) {
    case 1:
      return theme.backgroundDefault;
    case 2:
      return theme.backgroundSecondary;
    case 3:
      return theme.backgroundTertiary;
    default:
      return theme.backgroundRoot;
  }
};

const getShadowForVariant = (variant: string) => {
  switch (variant) {
    case 'elevated':
      return Shadows.cardElevated;
    case 'outlined':
      return Shadows.none;
    default:
      return Shadows.card;
  }
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  elevation = 1,
  title,
  description,
  children,
  onPress,
  style,
  variant = 'default',
}: CardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const cardBackgroundColor = getBackgroundColorForElevation(elevation, theme);
  const shadow = getShadowForVariant(variant);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        {
          backgroundColor: cardBackgroundColor,
          borderColor: variant === 'outlined' ? theme.border : 'transparent',
          borderWidth: variant === 'outlined' ? 1.5 : 0,
        },
        shadow,
        animatedStyle,
        style,
      ]}
    >
      {title ? (
        <ThemedText type="h4" style={styles.cardTitle}>
          {title}
        </ThemedText>
      ) : null}
      {description ? (
        <ThemedText type="small" style={styles.cardDescription}>
          {description}
        </ThemedText>
      ) : null}
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius["2xl"],
  },
  cardTitle: {
    marginBottom: Spacing.sm,
  },
  cardDescription: {
    opacity: 0.7,
  },
});
