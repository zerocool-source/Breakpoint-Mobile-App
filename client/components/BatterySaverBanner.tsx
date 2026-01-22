import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useBattery, getBatteryColor } from '@/context/BatteryContext';
import { BrandColors, Spacing } from '@/constants/theme';

export function BatterySaverBanner() {
  const { 
    batteryLevel, 
    isBatterySaverEnabled, 
    isAutoBatterySaver,
    lowPowerMode,
  } = useBattery();

  if (!isBatterySaverEnabled) {
    return null;
  }

  const percentage = Math.round(batteryLevel * 100);
  const batteryColor = getBatteryColor(batteryLevel);

  return (
    <View style={[styles.container, lowPowerMode && styles.lowPowerContainer]}>
      <View style={styles.iconContainer}>
        <Feather 
          name="battery" 
          size={16} 
          color="#FFFFFF" 
        />
        <View style={[styles.batteryIndicator, { backgroundColor: batteryColor }]} />
      </View>
      <ThemedText style={styles.text}>
        Battery Saver {isAutoBatterySaver ? '(Auto)' : ''} - {percentage}%
        {lowPowerMode ? ' - Critical' : ''}
      </ThemedText>
    </View>
  );
}

export function BatteryStatusRow() {
  const { 
    batteryLevel, 
    isCharging,
    isBatterySaverEnabled,
    isAutoBatterySaver,
    toggleBatterySaver,
  } = useBattery();

  const percentage = Math.round(batteryLevel * 100);
  const batteryColor = getBatteryColor(batteryLevel);

  return (
    <View style={styles.statusContainer}>
      <View style={styles.batteryRow}>
        <View style={styles.batteryInfo}>
          <Feather 
            name={isCharging ? "battery-charging" : "battery"} 
            size={20} 
            color={batteryColor} 
          />
          <ThemedText style={[styles.batteryText, { color: batteryColor }]}>
            {percentage}%
          </ThemedText>
          {isCharging ? (
            <View style={styles.chargingBadge}>
              <ThemedText style={styles.chargingText}>Charging</ThemedText>
            </View>
          ) : null}
        </View>
        {isBatterySaverEnabled ? (
          <View style={styles.saverBadge}>
            <Feather name="zap" size={12} color="#FFFFFF" />
            <ThemedText style={styles.saverText}>
              {isAutoBatterySaver ? 'Auto Saver' : 'Saver On'}
            </ThemedText>
          </View>
        ) : null}
      </View>
      {batteryLevel <= 0.5 && !isCharging ? (
        <ThemedText style={styles.warningText}>
          Battery saver activates at 50% to extend field time
        </ThemedText>
      ) : null}
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
  lowPowerContainer: {
    backgroundColor: BrandColors.danger,
  },
  iconContainer: {
    marginRight: Spacing.sm,
    position: 'relative',
  },
  batteryIndicator: {
    position: 'absolute',
    left: 3,
    top: 5,
    width: 8,
    height: 6,
    borderRadius: 1,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  statusContainer: {
    paddingVertical: Spacing.sm,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  batteryText: {
    fontSize: 16,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  chargingBadge: {
    backgroundColor: BrandColors.emerald,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 4,
  },
  chargingText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  saverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BrandColors.vividTangerine,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saverText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  warningText: {
    fontSize: 11,
    color: BrandColors.vividTangerine,
    marginTop: Spacing.xs,
  },
});
