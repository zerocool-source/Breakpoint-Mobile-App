import React from 'react';
import { View, StyleSheet, Image, ImageSourcePropType } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';

interface EmptyStateProps {
  image: ImageSourcePropType;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ image, title, message, actionLabel, onAction }: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Image source={image} style={styles.image} resizeMode="contain" />
      <ThemedText style={styles.title}>{title}</ThemedText>
      <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
        {message}
      </ThemedText>
      {actionLabel && onAction ? (
        <BPButton onPress={onAction} style={styles.button}>
          {actionLabel}
        </BPButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  image: {
    width: 160,
    height: 160,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  button: {
    minWidth: 160,
  },
});
