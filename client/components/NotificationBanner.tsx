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
import { BrandColors, BorderRadius, Spacing, Shadows, SpringConfigs } from '@/constants/theme';

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
      translateY.value = withSpring(0, SpringConfigs.responsive);
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, SpringConfigs.responsive);

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
      testID="notification-banner"
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
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
    elevation: 9999,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.cardElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 12,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  content: {
    flex: 1,
    marginRight: Spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    opacity: 0.95,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  closeButton: {
    padding: Spacing.sm,
  },
});
