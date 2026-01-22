import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { useNetwork } from '@/context/NetworkContext';
import { BrandColors, Spacing } from '@/constants/theme';

export function OfflineBanner() {
  const { isConnected } = useNetwork();

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    ),
  }));

  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, pulseStyle]}>
        <Feather name="cloud-off" size={16} color="#FFFFFF" />
      </Animated.View>
      <ThemedText style={styles.text}>
        Offline Mode - Changes will sync when connected
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.vividTangerine,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    height: 40,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
});
