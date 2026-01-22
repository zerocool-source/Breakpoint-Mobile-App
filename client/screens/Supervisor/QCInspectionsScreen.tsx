import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ThemedText } from '@/components/ThemedText';
import { BubbleBackground } from '@/components/BubbleBackground';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockQCInspections, QCInspection, InspectionStatus } from '@/lib/inspectionChecklistData';
import { NewInspectionModal } from '@/screens/Supervisor/Modals/NewInspectionModal';
import type { SupervisorStackParamList } from '@/navigation/SupervisorStackNavigator';

type FilterStatus = 'all' | InspectionStatus;

const statusConfig: Record<InspectionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: '#666666', bgColor: '#F0F0F0' },
  in_progress: { label: 'In Progress', color: BrandColors.azureBlue, bgColor: BrandColors.azureBlue + '20' },
  completed: { label: 'Completed', color: BrandColors.emerald, bgColor: BrandColors.emerald + '20' },
  failed: { label: 'Failed', color: BrandColors.danger, bgColor: BrandColors.danger + '20' },
};

interface InspectionCardProps {
  inspection: QCInspection;
  index: number;
  onPress: () => void;
}

function InspectionCard({ inspection, index, onPress }: InspectionCardProps) {
  const { theme } = useTheme();
  const config = statusConfig[inspection.status];
  const progressPercent = Math.round((inspection.completedItems / inspection.totalItems) * 100);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        style={[styles.card, { backgroundColor: theme.surface }]}
        onPress={onPress}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <ThemedText style={styles.cardTitle}>{inspection.title}</ThemedText>
            <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
              <ThemedText style={[styles.statusText, { color: config.color }]}>
                {config.label}
              </ThemedText>
            </View>
          </View>
          <ThemedText style={[styles.cardId, { color: theme.textSecondary }]}>
            {inspection.id.toUpperCase()}
          </ThemedText>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {inspection.propertyName}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="user" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {inspection.inspector}
            </ThemedText>
            <View style={[styles.roleBadge, { 
              backgroundColor: inspection.inspectorRole === 'supervisor' 
                ? BrandColors.vividTangerine + '20' 
                : BrandColors.azureBlue + '20' 
            }]}>
              <ThemedText style={[styles.roleText, { 
                color: inspection.inspectorRole === 'supervisor' 
                  ? BrandColors.vividTangerine 
                  : BrandColors.azureBlue 
              }]}>
                {inspection.inspectorRole === 'supervisor' ? 'Supervisor' : 'Technician'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {new Date(inspection.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </ThemedText>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <ThemedText style={[styles.progressLabel, { color: theme.textSecondary }]}>
              Checklist Progress
            </ThemedText>
            <ThemedText style={[styles.progressValue, { color: config.color }]}>
              {inspection.completedItems}/{inspection.totalItems} ({progressPercent}%)
            </ThemedText>
          </View>
          <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${progressPercent}%`,
                  backgroundColor: config.color,
                }
              ]} 
            />
          </View>
        </View>

        {inspection.notes ? (
          <View style={[styles.notesSection, { borderTopColor: theme.border }]}>
            <Feather name="alert-circle" size={14} color={BrandColors.danger} />
            <ThemedText style={[styles.notesText, { color: BrandColors.danger }]}>
              {inspection.notes}
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <ThemedText style={[styles.viewDetails, { color: BrandColors.azureBlue }]}>
            View Details
          </ThemedText>
          <Feather name="chevron-right" size={16} color={BrandColors.azureBlue} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function QCInspectionsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<SupervisorStackParamList>>();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showNewInspectionModal, setShowNewInspectionModal] = useState(false);

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'failed', label: 'Failed' },
  ];

  const filteredInspections = filter === 'all' 
    ? mockQCInspections 
    : mockQCInspections.filter(i => i.status === filter);

  const handleNewInspection = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowNewInspectionModal(true);
  };

  const handleStartInspection = (propertyId: string, propertyName: string) => {
    navigation.navigate('InspectionDetail', { 
      inspectionId: undefined,
      propertyId,
      propertyName,
    });
  };

  const handleInspectionPress = (inspection: QCInspection) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate('InspectionDetail', { inspectionId: inspection.id });
  };

  return (
    <BubbleBackground>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ 
          paddingTop: insets.top + Spacing.lg,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.screenPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.header}>
            <View>
              <ThemedText style={styles.title}>QC Inspections</ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                Pool inspection checklists
              </ThemedText>
            </View>
            <Pressable 
              style={[styles.newButton, { backgroundColor: BrandColors.azureBlue }]}
              onPress={handleNewInspection}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.newButtonText}>New</ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContainer}
          >
            {filters.map((f) => (
              <Pressable
                key={f.key}
                style={[
                  styles.filterButton,
                  { 
                    backgroundColor: filter === f.key ? BrandColors.azureBlue : theme.surface,
                    borderColor: filter === f.key ? BrandColors.azureBlue : theme.border,
                  }
                ]}
                onPress={() => setFilter(f.key)}
              >
                <ThemedText style={[
                  styles.filterText,
                  { color: filter === f.key ? '#FFFFFF' : theme.textSecondary }
                ]}>
                  {f.label}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.statValue, { color: BrandColors.azureBlue }]}>
              {mockQCInspections.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Total
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.statValue, { color: BrandColors.emerald }]}>
              {mockQCInspections.filter(i => i.status === 'completed').length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Passed
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.statValue, { color: BrandColors.danger }]}>
              {mockQCInspections.filter(i => i.status === 'failed').length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Failed
            </ThemedText>
          </View>
        </View>

        <View style={styles.listSection}>
          <ThemedText style={styles.sectionTitle}>
            All Inspections ({filteredInspections.length})
          </ThemedText>
          {filteredInspections.map((inspection, index) => (
            <InspectionCard
              key={inspection.id}
              inspection={inspection}
              index={index}
              onPress={() => handleInspectionPress(inspection)}
            />
          ))}
        </View>
      </ScrollView>

      <NewInspectionModal
        visible={showNewInspectionModal}
        onClose={() => setShowNewInspectionModal(false)}
        onStartInspection={handleStartInspection}
      />
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  newButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  filterScroll: {
    marginBottom: Spacing.lg,
  },
  filterContainer: {
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.card,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  listSection: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  cardId: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 13,
  },
  roleBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  progressLabel: {
    fontSize: 12,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    marginBottom: Spacing.md,
  },
  notesText: {
    fontSize: 12,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewDetails: {
    fontSize: 13,
    fontWeight: '600',
  },
});
