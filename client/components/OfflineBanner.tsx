import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
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
  const { isConnected, isSyncing, pendingActions, syncNow } = useNetwork();

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: withRepeat(
      withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    ),
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{
      rotate: withRepeat(
        withTiming('360deg', { duration: 1000, easing: Easing.linear }),
        -1,
        false
      ),
    }],
  }));

  if (isConnected && !isSyncing) {
    return null;
  }

  if (isSyncing) {
    return (
      <View style={[styles.container, styles.syncingContainer]}>
        <Animated.View style={[styles.iconContainer, spinStyle]}>
          <Feather name="refresh-cw" size={16} color="#FFFFFF" />
        </Animated.View>
        <ThemedText style={styles.text}>
          Syncing {pendingActions} pending {pendingActions === 1 ? 'change' : 'changes'}...
        </ThemedText>
      </View>
    );
  }

  return (
    <Pressable style={styles.container} onPress={syncNow}>
      <Animated.View style={[styles.iconContainer, pulseStyle]}>
        <Feather name="cloud-off" size={16} color="#FFFFFF" />
      </Animated.View>
      <ThemedText style={styles.text}>
        Offline Mode
        {pendingActions > 0 ? ` • ${pendingActions} pending` : ' • Changes will sync when connected'}
      </ThemedText>
    </Pressable>
  );
}

export function SyncStatusBanner() {
  const { isConnected, lastSyncDisplay, pendingActions, syncNow, isSyncing } = useNetwork();

  if (!isConnected) return null;

  return (
    <Pressable 
      style={styles.syncStatusContainer} 
      onPress={syncNow}
      disabled={isSyncing}
    >
      <View style={styles.syncStatusRow}>
        <Feather 
          name={isSyncing ? "refresh-cw" : "cloud"} 
          size={14} 
          color={BrandColors.azureBlue} 
        />
        <ThemedText style={styles.syncStatusText}>
          {isSyncing ? 'Syncing...' : `Last sync: ${lastSyncDisplay}`}
        </ThemedText>
        {pendingActions > 0 && !isSyncing ? (
          <View style={styles.pendingBadge}>
            <ThemedText style={styles.pendingText}>{pendingActions}</ThemedText>
          </View>
        ) : null}
      </View>
    </Pressable>
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
  syncingContainer: {
    backgroundColor: BrandColors.azureBlue,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 120, 212, 0.08)',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  syncStatusText: {
    fontSize: 12,
    color: BrandColors.azureBlue,
    fontWeight: '500',
  },
  pendingBadge: {
    backgroundColor: BrandColors.vividTangerine,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  pendingText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
