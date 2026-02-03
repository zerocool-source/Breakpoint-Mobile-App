import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface AssignedJob {
  id: string;
  jobNumber: string;
  propertyName: string;
  propertyAddress: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  scheduledTime: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'dismissed';
  estimatedDuration: string;
  contactName?: string;
  contactPhone?: string;
}

type JobDetailsRouteProp = RouteProp<{ JobDetails: { job: AssignedJob } }, 'JobDetails'>;

const priorityConfig = {
  high: { label: 'High Priority', color: '#FF3B30', bg: 'rgba(255,59,48,0.15)' },
  medium: { label: 'Medium Priority', color: BrandColors.vividTangerine, bg: 'rgba(255,128,0,0.15)' },
  low: { label: 'Low Priority', color: BrandColors.azureBlue, bg: 'rgba(0,120,212,0.15)' },
};

export default function JobDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<JobDetailsRouteProp>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { job } = route.params;

  const priority = priorityConfig[job.priority];
  const scheduledTime = new Date(job.scheduledTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleCallContact = () => {
    if (job.contactPhone) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Linking.openURL(`tel:${job.contactPhone.replace(/\D/g, '')}`);
    }
  };

  const handleOpenMaps = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const address = encodeURIComponent(job.propertyAddress);
    const url = Platform.OS === 'ios'
      ? `maps:?address=${address}`
      : `https://www.google.com/maps/search/?api=1&query=${address}`;
    Linking.openURL(url);
  };

  const handleCreateEstimate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AceEstimateBuilder', {
      propertyId: job.id,
      propertyName: job.propertyName,
      jobNumber: job.jobNumber,
      jobDescription: job.description,
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable style={styles.backButton} onPress={handleGoBack}>
          <Feather name="arrow-left" size={24} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>Job Details</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={true}
      >
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.jobHeaderRow}>
            <View>
              <ThemedText style={styles.jobNumber}>{job.jobNumber}</ThemedText>
              <View style={[styles.priorityBadge, { backgroundColor: priority.bg }]}>
                <ThemedText style={[styles.priorityText, { color: priority.color }]}>
                  {priority.label}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: BrandColors.emerald + '20' }]}>
              <Feather name="check-circle" size={14} color={BrandColors.emerald} />
              <ThemedText style={[styles.statusText, { color: BrandColors.emerald }]}>
                Accepted
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Property</ThemedText>
          <ThemedText style={styles.propertyName}>{job.propertyName}</ThemedText>
          <Pressable style={styles.addressRow} onPress={handleOpenMaps}>
            <Feather name="map-pin" size={16} color={BrandColors.azureBlue} />
            <ThemedText style={[styles.addressText, { color: BrandColors.azureBlue }]}>
              {job.propertyAddress}
            </ThemedText>
            <Feather name="external-link" size={14} color={BrandColors.azureBlue} />
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Job Description</ThemedText>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            {job.description}
          </ThemedText>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Schedule</ThemedText>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Feather name="calendar" size={18} color={theme.textSecondary} />
              <View>
                <ThemedText style={[styles.scheduleLabel, { color: theme.textSecondary }]}>
                  Scheduled
                </ThemedText>
                <ThemedText style={styles.scheduleValue}>{scheduledTime}</ThemedText>
              </View>
            </View>
            <View style={styles.scheduleItem}>
              <Feather name="clock" size={18} color={theme.textSecondary} />
              <View>
                <ThemedText style={[styles.scheduleLabel, { color: theme.textSecondary }]}>
                  Duration
                </ThemedText>
                <ThemedText style={styles.scheduleValue}>{job.estimatedDuration}</ThemedText>
              </View>
            </View>
          </View>
        </View>

        {(job.contactName || job.contactPhone) && (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.sectionTitle}>Contact</ThemedText>
            {job.contactName && (
              <ThemedText style={styles.contactName}>{job.contactName}</ThemedText>
            )}
            {job.contactPhone && (
              <Pressable style={styles.phoneRow} onPress={handleCallContact}>
                <Feather name="phone" size={16} color={BrandColors.emerald} />
                <ThemedText style={[styles.phoneText, { color: BrandColors.emerald }]}>
                  {job.contactPhone}
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.surface }]}>
        <BPButton
          variant="primary"
          onPress={handleCreateEstimate}
          fullWidth
          icon="file-plus"
          style={{ backgroundColor: BrandColors.vividTangerine }}
        >
          Create Estimate
        </BPButton>
        <ThemedText style={[styles.footerHint, { color: theme.textSecondary }]}>
          After on-site assessment, create an estimate for this job
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  jobHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: BrandColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  propertyName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addressText: {
    fontSize: 14,
    flex: 1,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scheduleLabel: {
    fontSize: 12,
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    gap: Spacing.sm,
  },
  footerHint: {
    fontSize: 13,
    textAlign: 'center',
  },
});
