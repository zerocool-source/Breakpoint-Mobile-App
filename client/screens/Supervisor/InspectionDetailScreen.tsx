import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Checkbox from 'expo-checkbox';

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

interface CategorySectionProps {
  category: ChecklistCategory;
  checkedItems: Set<string>;
  expandedCategories: Set<string>;
  onToggleCategory: (categoryId: string) => void;
  onToggleItem: (itemId: string) => void;
}

function CategorySection({ 
  category, 
  checkedItems, 
  expandedCategories,
  onToggleCategory,
  onToggleItem,
}: CategorySectionProps) {
  const { theme } = useTheme();
  const isExpanded = expandedCategories.has(category.id);
  const completedCount = category.items.filter(item => checkedItems.has(item.id)).length;
  const allCompleted = completedCount === category.items.length;

  return (
    <View style={[styles.categoryCard, { backgroundColor: theme.surface }]}>
      <Pressable 
        style={styles.categoryHeader}
        onPress={() => onToggleCategory(category.id)}
      >
        <View style={styles.categoryTitleRow}>
          <View style={[
            styles.categoryIcon,
            { backgroundColor: allCompleted ? BrandColors.emerald + '20' : BrandColors.azureBlue + '20' }
          ]}>
            <Feather 
              name={allCompleted ? 'check-circle' : 'clipboard'} 
              size={18} 
              color={allCompleted ? BrandColors.emerald : BrandColors.azureBlue} 
            />
          </View>
          <View style={styles.categoryInfo}>
            <ThemedText style={styles.categoryName}>{category.name}</ThemedText>
            <ThemedText style={[styles.categoryProgress, { color: theme.textSecondary }]}>
              {completedCount}/{category.items.length} items
            </ThemedText>
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
            const isChecked = checkedItems.has(item.id);
            return (
              <Pressable 
                key={item.id}
                style={[
                  styles.checklistItem,
                  index < category.items.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }
                ]}
                onPress={() => onToggleItem(item.id)}
              >
                <View style={styles.checkboxContainer} pointerEvents="none">
                  <Checkbox
                    value={isChecked}
                    color={isChecked ? BrandColors.emerald : undefined}
                    style={styles.checkbox}
                  />
                </View>
                <ThemedText style={[
                  styles.itemLabel,
                  isChecked && styles.itemLabelChecked,
                  isChecked && { color: theme.textSecondary }
                ]}>
                  {item.label}
                </ThemedText>
              </Pressable>
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
  
  const { inspectionId } = route.params;
  const existingInspection = inspectionId 
    ? mockQCInspections.find(i => i.id === inspectionId) 
    : null;

  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set([inspectionChecklist[0].id])
  );

  const totalItems = getTotalChecklistItems();
  const completedItems = checkedItems.size;
  const progressPercent = Math.round((completedItems / totalItems) * 100);

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

  const handleToggleItem = (itemId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
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
              <View>
                <ThemedText style={styles.progressTitle}>
                  {existingInspection ? existingInspection.title : 'New Inspection'}
                </ThemedText>
                {existingInspection ? (
                  <ThemedText style={[styles.progressSubtitle, { color: theme.textSecondary }]}>
                    {existingInspection.propertyName}
                  </ThemedText>
                ) : null}
              </View>
              <View style={styles.progressStats}>
                <ThemedText style={[styles.progressPercent, { color: BrandColors.azureBlue }]}>
                  {progressPercent}%
                </ThemedText>
                <ThemedText style={[styles.progressCount, { color: theme.textSecondary }]}>
                  {completedItems}/{totalItems}
                </ThemedText>
              </View>
            </View>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${progressPercent}%`,
                    backgroundColor: progressPercent === 100 ? BrandColors.emerald : BrandColors.azureBlue,
                  }
                ]} 
              />
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
            {totalItems} items across {inspectionChecklist.length} categories
          </ThemedText>

          {inspectionChecklist.map((category, index) => (
            <Animated.View 
              key={category.id}
              entering={FadeInDown.delay(200 + index * 30).springify()}
            >
              <CategorySection
                category={category}
                checkedItems={checkedItems}
                expandedCategories={expandedCategories}
                onToggleCategory={handleToggleCategory}
                onToggleItem={handleToggleItem}
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
          <ThemedText style={[styles.bottomStatsText, { color: theme.textSecondary }]}>
            {completedItems} of {totalItems} items checked
          </ThemedText>
        </View>
        <Pressable 
          style={[
            styles.submitButton, 
            { backgroundColor: completedItems === totalItems ? BrandColors.emerald : BrandColors.azureBlue }
          ]}
          onPress={handleSubmit}
        >
          <Feather 
            name={completedItems === totalItems ? 'check-circle' : 'save'} 
            size={20} 
            color="#FFFFFF" 
          />
          <ThemedText style={styles.submitButtonText}>
            {completedItems === totalItems ? 'Complete Inspection' : 'Save Progress'}
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
    marginBottom: Spacing.md,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  progressStats: {
    alignItems: 'flex-end',
  },
  progressPercent: {
    fontSize: 24,
    fontWeight: '700',
  },
  progressCount: {
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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
  categoryProgress: {
    fontSize: 12,
    marginTop: 2,
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
  checkboxContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
  },
  itemLabel: {
    fontSize: 14,
    flex: 1,
  },
  itemLabelChecked: {
    textDecorationLine: 'line-through',
  },
  bottomBar: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  bottomStats: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bottomStatsText: {
    fontSize: 13,
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
