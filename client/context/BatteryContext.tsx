import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as Battery from 'expo-battery';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BATTERY_SAVER_KEY = '@breakpoint_battery_saver';
const BATTERY_THRESHOLD = 0.5;

interface BatteryContextType {
  batteryLevel: number;
  isCharging: boolean;
  isBatterySaverEnabled: boolean;
  isAutoBatterySaver: boolean;
  toggleBatterySaver: (enabled: boolean) => void;
  reducedAnimations: boolean;
  reducedSyncFrequency: boolean;
  lowPowerMode: boolean;
}

const BatteryContext = createContext<BatteryContextType>({
  batteryLevel: 1,
  isCharging: false,
  isBatterySaverEnabled: false,
  isAutoBatterySaver: false,
  toggleBatterySaver: () => {},
  reducedAnimations: false,
  reducedSyncFrequency: false,
  lowPowerMode: false,
});

export function BatteryProvider({ children }: { children: ReactNode }) {
  const [batteryLevel, setBatteryLevel] = useState(1);
  const [isCharging, setIsCharging] = useState(false);
  const [manualBatterySaver, setManualBatterySaver] = useState(false);
  const [isAutoBatterySaver, setIsAutoBatterySaver] = useState(false);

  const isBatterySaverEnabled = manualBatterySaver || isAutoBatterySaver;
  const reducedAnimations = isBatterySaverEnabled;
  const reducedSyncFrequency = isBatterySaverEnabled;
  const lowPowerMode = batteryLevel <= 0.2;

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(BATTERY_SAVER_KEY);
        if (saved !== null) {
          setManualBatterySaver(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Failed to load battery settings:', error);
      }
    };

    loadSettings();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      return;
    }

    const initBattery = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        const state = await Battery.getBatteryStateAsync();
        
        setBatteryLevel(level);
        setIsCharging(
          state === Battery.BatteryState.CHARGING || 
          state === Battery.BatteryState.FULL
        );

        if (level <= BATTERY_THRESHOLD && !isCharging) {
          setIsAutoBatterySaver(true);
        }
      } catch (error) {
        console.error('Failed to get battery info:', error);
      }
    };

    initBattery();

    const levelSubscription = Battery.addBatteryLevelListener((event: Battery.BatteryLevelEvent) => {
      setBatteryLevel(event.batteryLevel);
      
      if (event.batteryLevel <= BATTERY_THRESHOLD && !isCharging) {
        setIsAutoBatterySaver(true);
      } else if (event.batteryLevel > BATTERY_THRESHOLD + 0.1) {
        setIsAutoBatterySaver(false);
      }
    });

    const stateSubscription = Battery.addBatteryStateListener((event: Battery.BatteryStateEvent) => {
      const batteryState = event.batteryState;
      const charging = 
        batteryState === Battery.BatteryState.CHARGING || 
        batteryState === Battery.BatteryState.FULL;
      
      setIsCharging(charging);
      
      if (charging) {
        setIsAutoBatterySaver(false);
      } else if (batteryLevel <= BATTERY_THRESHOLD) {
        setIsAutoBatterySaver(true);
      }
    });

    return () => {
      levelSubscription.remove();
      stateSubscription.remove();
    };
  }, [isCharging, batteryLevel]);

  const toggleBatterySaver = useCallback(async (enabled: boolean) => {
    setManualBatterySaver(enabled);
    try {
      await AsyncStorage.setItem(BATTERY_SAVER_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error('Failed to save battery settings:', error);
    }
  }, []);

  return (
    <BatteryContext.Provider 
      value={{ 
        batteryLevel,
        isCharging,
        isBatterySaverEnabled,
        isAutoBatterySaver,
        toggleBatterySaver,
        reducedAnimations,
        reducedSyncFrequency,
        lowPowerMode,
      }}
    >
      {children}
    </BatteryContext.Provider>
  );
}

export function useBattery() {
  return useContext(BatteryContext);
}

export function getBatteryIcon(level: number, isCharging: boolean): string {
  if (isCharging) return 'battery-charging';
  if (level >= 0.75) return 'battery';
  if (level >= 0.5) return 'battery';
  if (level >= 0.25) return 'battery';
  return 'battery';
}

export function getBatteryColor(level: number): string {
  if (level >= 0.5) return '#22D69A';
  if (level >= 0.25) return '#FF8000';
  return '#FF3B30';
}
