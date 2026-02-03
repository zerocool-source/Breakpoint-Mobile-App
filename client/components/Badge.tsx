import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { BrandColors, BorderRadius, Spacing, Typography, Shadows } from '@/constants/theme';

type BadgeVariant = 'urgent' | 'high' | 'normal' | 'low' | 'completed' | 'draft' | 'sent' | 'approved' | 'declined' | 'residential' | 'commercial' | 'municipal' | 'info' | 'success' | 'warning' | 'error' | 'needs_review' | 'pending_approval' | 'scheduled' | 'in_progress' | 'pending';
type BadgeSize = 'small' | 'medium' | 'large';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  style?: ViewStyle;
  size?: BadgeSize;
  outlined?: boolean;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  urgent: { bg: BrandColors.urgent, text: '#FFFFFF' },
  high: { bg: BrandColors.high, text: '#FFFFFF' },
  normal: { bg: BrandColors.azureBlue, text: '#FFFFFF' },
  low: { bg: BrandColors.platinum, text: '#FFFFFF' },
  completed: { bg: BrandColors.completed, text: '#FFFFFF' },
  draft: { bg: '#E2E8F0', text: '#64748B' },
  sent: { bg: BrandColors.azureBlue, text: '#FFFFFF' },
  approved: { bg: BrandColors.emerald, text: '#FFFFFF' },
  declined: { bg: BrandColors.danger, text: '#FFFFFF' },
  residential: { bg: '#DBEAFE', text: '#1D4ED8' },
  commercial: { bg: '#FEF3C7', text: '#D97706' },
  municipal: { bg: '#D1FAE5', text: '#059669' },
  info: { bg: BrandColors.azureBlue, text: '#FFFFFF' },
  success: { bg: BrandColors.emerald, text: '#FFFFFF' },
  warning: { bg: BrandColors.vividTangerine, text: '#FFFFFF' },
  error: { bg: BrandColors.danger, text: '#FFFFFF' },
  needs_review: { bg: BrandColors.vividTangerine, text: '#FFFFFF' },
  pending_approval: { bg: BrandColors.vividTangerine, text: '#FFFFFF' },
  scheduled: { bg: BrandColors.azureBlue, text: '#FFFFFF' },
  in_progress: { bg: BrandColors.tropicalTeal, text: '#FFFFFF' },
  pending: { bg: '#FEF3C7', text: '#D97706' },
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
  info: 'Info',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  needs_review: 'Needs Review',
  pending_approval: 'Pending',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  pending: 'Pending',
};

const sizePadding: Record<BadgeSize, { h: number; v: number }> = {
  small: { h: Spacing.sm, v: 4 },
  medium: { h: Spacing.md, v: Spacing.xs },
  large: { h: Spacing.lg, v: Spacing.sm },
};

const sizeFontSize: Record<BadgeSize, number> = {
  small: 10,
  medium: 11,
  large: 13,
};

export function Badge({ variant, label, style, size = 'medium', outlined = false }: BadgeProps) {
  const colors = variantColors[variant] || variantColors.info;
  const displayLabel = label || defaultLabels[variant] || variant;
  const padding = sizePadding[size];
  const fontSize = sizeFontSize[size];

  if (outlined) {
    return (
      <View 
        style={[
          styles.badge, 
          styles.outlined,
          { 
            borderColor: colors.bg,
            paddingHorizontal: padding.h,
            paddingVertical: padding.v,
          }, 
          style
        ]}
      >
        <ThemedText style={[styles.text, { color: colors.bg, fontSize }]}>
          {displayLabel}
        </ThemedText>
      </View>
    );
  }

  return (
    <View 
      style={[
        styles.badge, 
        { 
          backgroundColor: colors.bg,
          paddingHorizontal: padding.h,
          paddingVertical: padding.v,
        }, 
        style
      ]}
    >
      <ThemedText style={[styles.text, { color: colors.text, fontSize }]}>
        {displayLabel}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    ...Shadows.subtle,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
