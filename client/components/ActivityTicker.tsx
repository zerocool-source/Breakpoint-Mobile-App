import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

interface ActivityNotification {
  id: string;
  type: 'active' | 'help' | 'emergency' | 'update' | 'complete';
  message: string;
  timestamp: Date;
}

const mockNotifications: ActivityNotification[] = [
  { id: '1', type: 'active', message: 'Marcus Chen is now on-site at Sunnymead Ranch', timestamp: new Date() },
  { id: '2', type: 'complete', message: 'Sarah Johnson completed service at Canyon Springs', timestamp: new Date() },
  { id: '3', type: 'help', message: 'David Martinez needs assistance at Oak Hills', timestamp: new Date() },
  { id: '4', type: 'update', message: 'Mike Torres started route in Corona area', timestamp: new Date() },
  { id: '5', type: 'active', message: 'Jennifer Lee checked in at Moreno Valley Rec', timestamp: new Date() },
  { id: '6', type: 'emergency', message: 'Equipment failure reported at Riverside YMCA', timestamp: new Date() },
  { id: '7', type: 'complete', message: 'Marcus Chen completed 3 stops this morning', timestamp: new Date() },
  { id: '8', type: 'help', message: 'Sarah Johnson requesting chemical restock', timestamp: new Date() },
];

const getNotificationStyle = (type: ActivityNotification['type']) => {
  switch (type) {
    case 'active':
      return { icon: 'user-check' as const, color: BrandColors.emerald };
    case 'help':
      return { icon: 'alert-circle' as const, color: BrandColors.vividTangerine };
    case 'emergency':
      return { icon: 'alert-triangle' as const, color: BrandColors.danger };
    case 'update':
      return { icon: 'activity' as const, color: BrandColors.azureBlue };
    case 'complete':
      return { icon: 'check-circle' as const, color: BrandColors.tropicalTeal };
    default:
      return { icon: 'info' as const, color: BrandColors.azureBlue };
  }
};

interface ActivityTickerProps {
  autoPlay?: boolean;
  interval?: number;
}

export function ActivityTicker({ autoPlay = true, interval = 4000 }: ActivityTickerProps) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentNotification, setCurrentNotification] = useState(mockNotifications[0]);
  
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  const showNextNotification = useCallback(() => {
    const nextIndex = (currentIndex + 1) % mockNotifications.length;
    setCurrentIndex(nextIndex);
    setCurrentNotification(mockNotifications[nextIndex]);
  }, [currentIndex]);

  const animateTransition = useCallback(() => {
    opacity.value = withSequence(
      withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 300, easing: Easing.in(Easing.ease) })
    );
    translateY.value = withSequence(
      withTiming(-10, { duration: 300, easing: Easing.out(Easing.ease) }),
      withTiming(10, { duration: 0 }),
      withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) })
    );
    
    setTimeout(() => {
      runOnJS(showNextNotification)();
    }, 300);
  }, [opacity, translateY, showNextNotification]);

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      animateTransition();
    }, interval);

    return () => clearInterval(timer);
  }, [autoPlay, interval, animateTransition]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const notificationStyle = getNotificationStyle(currentNotification.type);

  return (
    <View style={[styles.container, { backgroundColor: theme.surface + 'E6' }]}>
      <View style={[styles.iconContainer, { backgroundColor: notificationStyle.color + '20' }]}>
        <Feather name={notificationStyle.icon} size={14} color={notificationStyle.color} />
      </View>
      <Animated.View style={[styles.messageContainer, animatedStyle]}>
        <ThemedText style={styles.message} numberOfLines={1} ellipsizeMode="tail">
          {currentNotification.message}
        </ThemedText>
      </Animated.View>
      <View style={[styles.liveIndicator, { backgroundColor: BrandColors.emerald }]}>
        <View style={styles.liveDot} />
        <ThemedText style={styles.liveText}>LIVE</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  iconContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    flex: 1,
  },
  message: {
    fontSize: 12,
    fontWeight: '500',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
