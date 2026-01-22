import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { 
  inspectionChecklist, 
  mockQCInspections, 
  getTotalChecklistItems,
  ChecklistCategory,
} from '@/lib/inspectionChecklistData';
import type { SupervisorStackParamList } from '@/navigation/SupervisorStackNavigator';

type InspectionDetailRouteProp = RouteProp<SupervisorStackParamList, 'InspectionDetail'>;

type ItemStatus = 'unchecked' | 'pass' | 'fail';

interface CategorySectionProps {
  category: ChecklistCategory;
  itemStatuses: Map<string, ItemStatus>;
  expandedCategories: Set<string>;
  onToggleCategory: (categoryId: string) => void;
  onSetItemStatus: (itemId: string, status: ItemStatus) => void;
}

function CategorySection({ 
  category, 
  itemStatuses, 
  expandedCategories,
  onToggleCategory,
  onSetItemStatus,
}: CategorySectionProps) {
  const { theme } = useTheme();
  const isExpanded = expandedCategories.has(category.id);
  
  const passedCount = category.items.filter(item => itemStatuses.get(item.id) === 'pass').length;
  const failedCount = category.items.filter(item => itemStatuses.get(item.id) === 'fail').length;
  const checkedCount = passedCount + failedCount;
  const allChecked = checkedCount === category.items.length;
  const hasFails = failedCount > 0;

  return (
    <View style={[styles.categoryCard, { backgroundColor: theme.surface }]}>
      <Pressable 
        style={styles.categoryHeader}
        onPress={() => onToggleCategory(category.id)}
      >
        <View style={styles.categoryTitleRow}>
          <View style={[
            styles.categoryIcon,
            { backgroundColor: hasFails ? BrandColors.danger + '20' : allChecked ? BrandColors.emerald + '20' : BrandColors.azureBlue + '20' }
          ]}>
            <Feather 
              name={hasFails ? 'alert-circle' : allChecked ? 'check-circle' : 'clipboard'} 
              size={18} 
              color={hasFails ? BrandColors.danger : allChecked ? BrandColors.emerald : BrandColors.azureBlue} 
            />
          </View>
          <View style={styles.categoryInfo}>
            <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
            <View style={styles.categoryStatusRow}>
              {passedCount > 0 ? (
                <View style={[styles.statusBadge, { backgroundColor: BrandColors.emerald + '20' }]}>
                  <Feather name="check" size={10} color={BrandColors.emerald} />
                  <ThemedText style={[styles.statusBadgeText, { color: BrandColors.emerald }]}>
                    {passedCount} Pass
                  </ThemedText>
                </View>
              ) : null}
              {failedCount > 0 ? (
                <View style={[styles.statusBadge, { backgroundColor: BrandColors.danger + '20' }]}>
                  <Feather name="x" size={10} color={BrandColors.danger} />
                  <ThemedText style={[styles.statusBadgeText, { color: BrandColors.danger }]}>
                    {failedCount} Fail
                  </ThemedText>
                </View>
              ) : null}
              {checkedCount === 0 ? (
                <ThemedText style={[styles.categoryProgress, { color: theme.textSecondary }]}>
                  {category.items.length} items
                </ThemedText>
              ) : null}
            </View>
          </View>
        </View>
        <Feather 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={theme.textSecondary} 
        />
      </Pressable>

      {isExpanded ? (
        <View style={[styles.categoryItems, { borderTopColor: theme.border }]}>
          {category.items.map((item, index) => {
            const status = itemStatuses.get(item.id) || 'unchecked';
            return (
              <View 
                key={item.id}
                style={[
                  styles.checklistItem,
                  index < category.items.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }
                ]}
              >
                <ThemedText style={[
                  styles.itemLabel,
                  status === 'pass' && { color: BrandColors.emerald },
                  status === 'fail' && { color: BrandColors.danger },
                ]}>
                  {item.label}
                </ThemedText>
                <View style={styles.passFailButtons}>
                  <Pressable
                    style={[
                      styles.passButton,
                      status === 'pass' && styles.passButtonActive,
                      { borderColor: BrandColors.emerald },
                    ]}
                    onPress={() => onSetItemStatus(item.id, status === 'pass' ? 'unchecked' : 'pass')}
                  >
                    <Feather 
                      name="check" 
                      size={14} 
                      color={status === 'pass' ? '#FFFFFF' : BrandColors.emerald} 
                    />
                  </Pressable>
                  <Pressable
                    style={[
                      styles.failButton,
                      status === 'fail' && styles.failButtonActive,
                      { borderColor: BrandColors.danger },
                    ]}
                    onPress={() => onSetItemStatus(item.id, status === 'fail' ? 'unchecked' : 'fail')}
                  >
                    <Feather 
                      name="x" 
                      size={14} 
                      color={status === 'fail' ? '#FFFFFF' : BrandColors.danger} 
                    />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export default function InspectionDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const route = useRoute<InspectionDetailRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<SupervisorStackParamList>>();
  
  const { inspectionId, propertyId, propertyName } = route.params;
  const existingInspection = inspectionId 
    ? mockQCInspections.find(i => i.id === inspectionId) 
    : null;
  
  const displayPropertyName = existingInspection?.propertyName || propertyName || 'New Inspection';

  const [itemStatuses, setItemStatuses] = useState<Map<string, ItemStatus>>(new Map());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([inspectionChecklist[0].id])
  );

  const totalItems = getTotalChecklistItems();
  
  const stats = useMemo(() => {
    let passed = 0;
    let failed = 0;
    itemStatuses.forEach((status) => {
      if (status === 'pass') passed++;
      if (status === 'fail') failed++;
    });
    return { passed, failed, checked: passed + failed };
  }, [itemStatuses]);

  const handleToggleCategory = (categoryId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleSetItemStatus = (itemId: string, status: ItemStatus) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setItemStatuses(prev => {
      const next = new Map(prev);
      if (status === 'unchecked') {
        next.delete(itemId);
      } else {
        next.set(itemId, status);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setExpandedCategories(new Set(inspectionChecklist.map(c => c.id)));
  };

  const handleCollapseAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setExpandedCategories(new Set());
  };

  const handleSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    navigation.goBack();
  };

  const inspectionStatus = stats.failed > 0 ? 'failed' : stats.checked === totalItems ? 'passed' : 'in_progress';

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ 
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.screenPadding,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={[styles.progressCard, { backgroundColor: theme.surface }]}>
            <View style={styles.progressHeader}>
              <View style={{ flex: 1 }}>
                <ThemedText style={styles.progressTitle}>
                  {existingInspection ? existingInspection.title : 'New Inspection'}
                </ThemedText>
                <ThemedText style={[styles.progressSubtitle, { color: theme.textSecondary }]}>
                  {displayPropertyName}
                </ThemedText>
              </View>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: inspectionStatus === 'failed' ? BrandColors.danger : inspectionStatus === 'passed' ? BrandColors.emerald : BrandColors.azureBlue }
              ]}>
                <Feather 
                  name={inspectionStatus === 'failed' ? 'x-circle' : inspectionStatus === 'passed' ? 'check-circle' : 'clock'} 
                  size={14} 
                  color="#FFFFFF" 
                />
                <ThemedText style={styles.statusText}>
                  {inspectionStatus === 'failed' ? 'Failed' : inspectionStatus === 'passed' ? 'Passed' : 'In Progress'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: BrandColors.emerald + '15' }]}>
                <Feather name="check-circle" size={20} color={BrandColors.emerald} />
                <ThemedText style={[styles.statNumber, { color: BrandColors.emerald }]}>
                  {stats.passed}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: BrandColors.emerald }]}>
                  Passed
                </ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: BrandColors.danger + '15' }]}>
                <Feather name="x-circle" size={20} color={BrandColors.danger} />
                <ThemedText style={[styles.statNumber, { color: BrandColors.danger }]}>
                  {stats.failed}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: BrandColors.danger }]}>
                  Failed
                </ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.backgroundSecondary }]}>
                <Feather name="minus-circle" size={20} color={theme.textSecondary} />
                <ThemedText style={[styles.statNumber, { color: theme.text }]}>
                  {totalItems - stats.checked}
                </ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                  Unchecked
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={styles.actionsRow}>
            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.surface }]}
              onPress={handleExpandAll}
            >
              <Feather name="maximize-2" size={16} color={BrandColors.azureBlue} />
              <ThemedText style={[styles.actionText, { color: BrandColors.azureBlue }]}>
                Expand All
              </ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.actionButton, { backgroundColor: theme.surface }]}
              onPress={handleCollapseAll}
            >
              <Feather name="minimize-2" size={16} color={BrandColors.azureBlue} />
              <ThemedText style={[styles.actionText, { color: BrandColors.azureBlue }]}>
                Collapse All
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        <View style={styles.checklistSection}>
          <ThemedText style={styles.sectionTitle}>
            Breakpoint Commercial Pool Inspection Checklist
          </ThemedText>
          <ThemedText style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
            Tap Pass or Fail for each item you inspect
          </ThemedText>

          {inspectionChecklist.map((category, index) => (
            <Animated.View 
              key={category.id}
              entering={FadeInDown.delay(200 + index * 30).springify()}
            >
              <CategorySection
                category={category}
                itemStatuses={itemStatuses}
                expandedCategories={expandedCategories}
                onToggleCategory={handleToggleCategory}
                onSetItemStatus={handleSetItemStatus}
              />
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { 
        backgroundColor: theme.surface, 
        paddingBottom: insets.bottom + Spacing.md,
        borderTopColor: theme.border,
      }]}>
        <View style={styles.bottomStats}>
          <View style={styles.bottomStatsRow}>
            <View style={styles.bottomStatItem}>
              <Feather name="check" size={14} color={BrandColors.emerald} />
              <ThemedText style={[styles.bottomStatsText, { color: BrandColors.emerald }]}>
                {stats.passed} Pass
              </ThemedText>
            </View>
            <View style={styles.bottomStatItem}>
              <Feather name="x" size={14} color={BrandColors.danger} />
              <ThemedText style={[styles.bottomStatsText, { color: BrandColors.danger }]}>
                {stats.failed} Fail
              </ThemedText>
            </View>
            <ThemedText style={[styles.bottomStatsText, { color: theme.textSecondary }]}>
              {totalItems - stats.checked} remaining
            </ThemedText>
          </View>
        </View>
        <Pressable 
          style={[
            styles.submitButton, 
            { backgroundColor: stats.failed > 0 ? BrandColors.danger : stats.checked > 0 ? BrandColors.emerald : BrandColors.azureBlue }
          ]}
          onPress={handleSubmit}
        >
          <Feather 
            name={stats.failed > 0 ? 'alert-circle' : 'save'} 
            size={20} 
            color="#FFFFFF" 
          />
          <ThemedText style={styles.submitButtonText}>
            {stats.failed > 0 ? 'Submit Failed Inspection' : stats.checked > 0 ? 'Save Inspection' : 'Save Progress'}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  progressCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  checklistSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: Spacing.lg,
  },
  categoryCard: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.card,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoryProgress: {
    fontSize: 12,
  },
  categoryItems: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  itemLabel: {
    fontSize: 14,
    flex: 1,
  },
  passFailButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  passButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  passButtonActive: {
    backgroundColor: BrandColors.emerald,
    borderColor: BrandColors.emerald,
  },
  failButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  failButtonActive: {
    backgroundColor: BrandColors.danger,
    borderColor: BrandColors.danger,
  },
  bottomBar: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  bottomStats: {
    marginBottom: Spacing.sm,
  },
  bottomStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  bottomStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  bottomStatsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
