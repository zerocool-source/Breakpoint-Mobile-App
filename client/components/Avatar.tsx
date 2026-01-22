import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { BrandColors, Spacing, Shadows, SpringConfigs, BorderRadius } from '@/constants/theme';

type AvatarSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  onPress?: () => void;
  showBorder?: boolean;
  borderColor?: string;
  statusColor?: string;
}

const sizeMap: Record<AvatarSize, number> = {
  xsmall: Spacing.avatarXSmall,
  small: Spacing.avatarSmall,
  medium: Spacing.avatarMedium,
  large: Spacing.avatarLarge,
  xlarge: Spacing.avatarXLarge,
};

const fontSizeMap: Record<AvatarSize, number> = {
  xsmall: 11,
  small: 14,
  medium: 20,
  large: 26,
  xlarge: 34,
};

const statusSizeMap: Record<AvatarSize, number> = {
  xsmall: 8,
  small: 10,
  medium: 14,
  large: 18,
  xlarge: 22,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Avatar({ 
  uri, 
  name, 
  size = 'medium', 
  onPress,
  showBorder = false,
  borderColor = BrandColors.white,
  statusColor,
}: AvatarProps) {
  const scale = useSharedValue(1);
  const dimension = sizeMap[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.95, SpringConfigs.responsive);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, SpringConfigs.responsive);
    }
  };

  const getInitials = () => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  const avatarContent = uri ? (
    <Image
      source={{ uri }}
      style={[
        styles.image, 
        { 
          width: dimension, 
          height: dimension, 
          borderRadius: dimension / 2,
          borderWidth: showBorder ? 3 : 0,
          borderColor: borderColor,
        }
      ]}
      contentFit="cover"
    />
  ) : (
    <View
      style={[
        styles.placeholder,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          borderWidth: showBorder ? 3 : 0,
          borderColor: borderColor,
        },
      ]}
    >
      <ThemedText style={[styles.initials, { fontSize: fontSizeMap[size] }]}>
        {getInitials()}
      </ThemedText>
    </View>
  );

  const content = (
    <View style={styles.container}>
      {avatarContent}
      {statusColor ? (
        <View 
          style={[
            styles.statusDot, 
            { 
              width: statusSizeMap[size], 
              height: statusSizeMap[size],
              borderRadius: statusSizeMap[size] / 2,
              backgroundColor: statusColor,
              borderWidth: 2,
              borderColor: BrandColors.white,
            }
          ]} 
        />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: BrandColors.border,
  },
  placeholder: {
    backgroundColor: BrandColors.azureBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  initials: {
    fontWeight: '700',
    color: BrandColors.azureBlue,
    letterSpacing: 0.5,
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    ...Shadows.subtle,
  },
});
