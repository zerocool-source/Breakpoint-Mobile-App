import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface NotificationBannerProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'urgent' | 'warning' | 'info';
  icon?: string;
  onDismiss: () => void;
  onPress?: () => void;
  autoDismissMs?: number;
}

export function NotificationBanner({
  visible,
  title,
  message,
  type = 'info',
  icon = 'bell',
  onDismiss,
  onPress,
  autoDismissMs = 8000,
}: NotificationBannerProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-200);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  const getTypeColors = () => {
    switch (type) {
      case 'urgent':
        return { bg: '#FF3B30', text: '#FFFFFF', iconBg: 'rgba(255,255,255,0.2)' };
      case 'warning':
        return { bg: BrandColors.vividTangerine, text: '#FFFFFF', iconBg: 'rgba(255,255,255,0.2)' };
      case 'info':
      default:
        return { bg: BrandColors.azureBlue, text: '#FFFFFF', iconBg: 'rgba(255,255,255,0.2)' };
    }
  };

  const colors = getTypeColors();

  useEffect(() => {
    if (visible) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });

      const timer = setTimeout(() => {
        handleDismiss();
      }, autoDismissMs);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    translateY.value = withTiming(-200, { duration: 300 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onDismiss)();
    });
    scale.value = withTiming(0.9, { duration: 200 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + Spacing.sm },
        animatedStyle,
      ]}
    >
      <Pressable
        style={[styles.banner, { backgroundColor: colors.bg }]}
        onPress={onPress || handleDismiss}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.iconBg }]}>
          <Feather name={icon as any} size={24} color={colors.text} />
        </View>
        <View style={styles.content}>
          <ThemedText style={[styles.title, { color: colors.text }]}>{title}</ThemedText>
          <ThemedText style={[styles.message, { color: colors.text }]} numberOfLines={2}>
            {message}
          </ThemedText>
        </View>
        <Pressable onPress={handleDismiss} style={styles.closeButton} hitSlop={10}>
          <Feather name="x" size={20} color={colors.text} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    opacity: 0.9,
    lineHeight: 18,
  },
  closeButton: {
    padding: Spacing.xs,
  },
});
