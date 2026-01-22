import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { BrandColors, BorderRadius, Spacing, Typography } from '@/constants/theme';

type BadgeVariant = 'urgent' | 'high' | 'normal' | 'low' | 'completed' | 'draft' | 'sent' | 'approved' | 'declined' | 'residential' | 'commercial' | 'municipal';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  urgent: { bg: BrandColors.urgent, text: '#FFFFFF' },
  high: { bg: BrandColors.high, text: '#FFFFFF' },
  normal: { bg: BrandColors.azureBlue, text: '#FFFFFF' },
  low: { bg: BrandColors.low, text: '#FFFFFF' },
  completed: { bg: BrandColors.completed, text: '#FFFFFF' },
  draft: { bg: '#E0E0E0', text: '#666666' },
  sent: { bg: BrandColors.azureBlue, text: '#FFFFFF' },
  approved: { bg: BrandColors.emerald, text: '#FFFFFF' },
  declined: { bg: BrandColors.danger, text: '#FFFFFF' },
  residential: { bg: '#E3F2FD', text: BrandColors.azureBlue },
  commercial: { bg: '#FFF3E0', text: BrandColors.vividTangerine },
  municipal: { bg: '#E8F5E9', text: BrandColors.emerald },
};

const defaultLabels: Record<BadgeVariant, string> = {
  urgent: 'Urgent',
  high: 'High',
  normal: 'Normal',
  low: 'Low',
  completed: 'Completed',
  draft: 'Draft',
  sent: 'Sent',
  approved: 'Approved',
  declined: 'Declined',
  residential: 'Residential',
  commercial: 'Commercial',
  municipal: 'Municipal',
};

export function Badge({ variant, label, style }: BadgeProps) {
  const colors = variantColors[variant];
  const displayLabel = label || defaultLabels[variant];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <ThemedText style={[styles.text, { color: colors.text }]}>
        {displayLabel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.badge,
  },
});
