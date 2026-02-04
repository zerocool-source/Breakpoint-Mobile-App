import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

interface EarningsTimerProps {
  hourlyRate: number;
  isRunning: boolean;
  startTime?: Date | null;
  compact?: boolean;
}

export function EarningsTimer({ hourlyRate, isRunning, startTime, compact = false }: EarningsTimerProps) {
  const { theme } = useTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && startTime) {
      const start = new Date(startTime).getTime();
      
      const updateTimer = () => {
        const now = Date.now();
        const elapsed = Math.floor((now - start) / 1000);
        setElapsedSeconds(elapsed);
      };

      updateTimer();
      intervalRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      setElapsedSeconds(0);
    }
  }, [isRunning, startTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateEarnings = (seconds: number) => {
    const hours = seconds / 3600;
    return (hours * hourlyRate).toFixed(2);
  };

  if (!isRunning) {
    return null;
  }

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: 'rgba(34,214,154,0.15)' }]}>
        <Feather name="clock" size={14} color={BrandColors.emerald} />
        <ThemedText style={[styles.compactTime, { color: BrandColors.emerald }]}>
          {formatTime(elapsedSeconds)}
        </ThemedText>
        <ThemedText style={[styles.compactEarnings, { color: BrandColors.emerald }]}>
          ${calculateEarnings(elapsedSeconds)}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.pulseIndicator, { backgroundColor: BrandColors.emerald }]} />
          <ThemedText style={styles.title}>Time on Job</ThemedText>
        </View>
        <ThemedText style={[styles.rate, { color: theme.textSecondary }]}>
          ${hourlyRate}/hr
        </ThemedText>
      </View>
      
      <View style={styles.timerDisplay}>
        <View style={styles.timeSection}>
          <Feather name="clock" size={24} color={BrandColors.azureBlue} />
          <ThemedText style={styles.timeValue}>{formatTime(elapsedSeconds)}</ThemedText>
        </View>
        
        <View style={[styles.earningsSection, { backgroundColor: 'rgba(34,214,154,0.15)' }]}>
          <Feather name="dollar-sign" size={20} color={BrandColors.emerald} />
          <ThemedText style={[styles.earningsValue, { color: BrandColors.emerald }]}>
            ${calculateEarnings(elapsedSeconds)}
          </ThemedText>
          <ThemedText style={[styles.earningsLabel, { color: BrandColors.emerald }]}>
            earned
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  rate: {
    fontSize: 13,
  },
  timerDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timeValue: {
    fontSize: 28,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  earningsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  earningsValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  earningsLabel: {
    fontSize: 13,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  compactTime: {
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  compactEarnings: {
    fontSize: 13,
    fontWeight: '700',
  },
});
