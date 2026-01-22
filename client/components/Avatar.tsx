import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { BrandColors, Spacing } from '@/constants/theme';

type AvatarSize = 'small' | 'medium' | 'large';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
  onPress?: () => void;
}

const sizeMap: Record<AvatarSize, number> = {
  small: Spacing.avatarSmall,
  medium: Spacing.avatarMedium,
  large: Spacing.avatarLarge,
};

const fontSizeMap: Record<AvatarSize, number> = {
  small: 12,
  medium: 16,
  large: 22,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Avatar({ uri, name, size = 'medium', onPress }: AvatarProps) {
  const scale = useSharedValue(1);
  const dimension = sizeMap[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.95, { damping: 15, stiffness: 150 });
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
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

  const content = uri ? (
    <Image
      source={{ uri }}
      style={[styles.image, { width: dimension, height: dimension, borderRadius: dimension / 2 }]}
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
        },
      ]}
    >
      <ThemedText style={[styles.initials, { fontSize: fontSizeMap[size] }]}>
        {getInitials()}
      </ThemedText>
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
  image: {
    backgroundColor: BrandColors.border,
  },
  placeholder: {
    backgroundColor: BrandColors.azureBlue + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
    color: BrandColors.azureBlue,
  },
});
