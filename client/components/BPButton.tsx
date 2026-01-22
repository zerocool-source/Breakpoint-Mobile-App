import React, { ReactNode } from 'react';
import { StyleSheet, Pressable, ViewStyle, StyleProp, ActivityIndicator } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'warning' | 'outline';

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

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: BrandColors.azureBlue, text: '#FFFFFF' },
  secondary: { bg: '#F5F5F5', text: BrandColors.azureBlue },
  danger: { bg: BrandColors.danger, text: '#FFFFFF' },
  success: { bg: BrandColors.emerald, text: '#FFFFFF' },
  warning: { bg: BrandColors.vividTangerine, text: '#FFFFFF' },
  outline: { bg: 'transparent', text: BrandColors.azureBlue, border: BrandColors.azureBlue },
};

const sizeStyles = {
  small: { height: 36, paddingHorizontal: Spacing.md, fontSize: 13, iconSize: 16 },
  medium: { height: 44, paddingHorizontal: Spacing.lg, fontSize: 15, iconSize: 18 },
  large: { height: 52, paddingHorizontal: Spacing.xl, fontSize: 17, iconSize: 20 },
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
      scale.value = withSpring(0.96, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          borderWidth: colors.border ? 1.5 : 0,
          borderColor: colors.border,
          opacity: disabled ? 0.5 : 1,
        },
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
    borderRadius: BorderRadius.sm,
  },
  fullWidth: {
    width: '100%',
  },
  buttonText: {
    fontWeight: '600',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
