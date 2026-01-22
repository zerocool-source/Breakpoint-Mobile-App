import React, { ReactNode } from 'react';
import { StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { BrandColors, BorderRadius, Spacing, Shadows, SpringConfigs } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline' | 'ghost';

interface BPButtonProps {
  onPress?: () => void;
  children: ReactNode;
  variant?: ButtonVariant;
  icon?: keyof typeof Feather.glyphMap;
  iconPosition?: 'left' | 'right';
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string; shadow?: boolean }> = {
  primary: { bg: BrandColors.azureBlue, text: '#FFFFFF', shadow: true },
  secondary: { bg: '#F1F5F9', text: BrandColors.azureBlue },
  danger: { bg: BrandColors.danger, text: '#FFFFFF', shadow: true },
  success: { bg: BrandColors.emerald, text: '#FFFFFF', shadow: true },
  warning: { bg: BrandColors.vividTangerine, text: '#FFFFFF', shadow: true },
  outline: { bg: 'transparent', text: BrandColors.azureBlue, border: BrandColors.azureBlue },
  ghost: { bg: 'transparent', text: BrandColors.azureBlue },
};

const sizeStyles = {
  small: { height: 42, paddingHorizontal: Spacing.lg, fontSize: 14, iconSize: 18, borderRadius: BorderRadius.md },
  medium: { height: Spacing.buttonHeight, paddingHorizontal: Spacing.xl, fontSize: 16, iconSize: 20, borderRadius: BorderRadius.lg },
  large: { height: Spacing.buttonHeightLarge, paddingHorizontal: Spacing['2xl'], fontSize: 18, iconSize: 24, borderRadius: BorderRadius.xl },
};

export function BPButton({
  onPress,
  children,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  style,
  disabled = false,
  loading = false,
  fullWidth = false,
  size = 'medium',
}: BPButtonProps) {
  const scale = useSharedValue(1);
  const colors = variantStyles[variant];
  const sizeConfig = sizeStyles[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97, SpringConfigs.snappy);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, SpringConfigs.snappy);
    }
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onPress();
    }
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={colors.text} size="small" />;
    }

    const iconElement = icon ? (
      <Feather
        name={icon}
        size={sizeConfig.iconSize}
        color={colors.text}
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    ) : null;

    return (
      <>
        {iconPosition === 'left' && iconElement}
        <ThemedText
          style={[
            styles.buttonText,
            { color: colors.text, fontSize: sizeConfig.fontSize },
          ]}
        >
          {children}
        </ThemedText>
        {iconPosition === 'right' && iconElement}
      </>
    );
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: colors.bg,
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          borderRadius: sizeConfig.borderRadius,
          borderWidth: colors.border ? 2 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        colors.shadow && Shadows.button,
        fullWidth && styles.fullWidth,
        style,
        animatedStyle,
      ]}
    >
      {renderContent()}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  buttonText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
