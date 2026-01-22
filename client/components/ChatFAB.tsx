import React from 'react';
import { StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { BrandColors, Shadows, Spacing } from '@/constants/theme';

interface ChatFABProps {
  onPress: () => void;
  bottom?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ChatFAB({ onPress, bottom = 0 }: ChatFABProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        { bottom: bottom + Spacing.fabOffset },
        animatedStyle,
      ]}
    >
      <Feather name="message-circle" size={24} color="#FFFFFF" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: Spacing.fabOffset,
    width: Spacing.fabSize,
    height: Spacing.fabSize,
    borderRadius: Spacing.fabSize / 2,
    backgroundColor: BrandColors.vividTangerine,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.fab,
  },
});
