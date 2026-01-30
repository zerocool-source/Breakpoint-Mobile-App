import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

interface TrainingModule {
  id: string;
  name: string;
  category: 'chemical' | 'electrical' | 'safety' | 'heater' | 'general';
  status: 'completed' | 'in_progress' | 'required' | 'upcoming';
  completedDate?: string;
  scheduledDate?: string;
  description?: string;
}

const TRAINING_MODULES: TrainingModule[] = [
  { id: '1', name: 'BCPO', category: 'general', status: 'completed', completedDate: '2025-08-15', description: 'Basic Commercial Pool Operator certification' },
  { id: '2', name: 'Chemical Controller', category: 'chemical', status: 'completed', completedDate: '2025-09-01', description: 'Automated chemical controller operation' },
  { id: '3', name: 'RWI', category: 'safety', status: 'completed', completedDate: '2025-09-10', description: 'Recreational Water Illness prevention' },
  { id: '4', name: 'Safety Chems', category: 'chemical', status: 'completed', completedDate: '2025-10-05', description: 'Chemical safety handling procedures' },
  { id: '5', name: 'C.F.S', category: 'safety', status: 'in_progress', description: 'Commercial Facility Safety' },
  { id: '6', name: 'Safety Elec.', category: 'electrical', status: 'in_progress', description: 'Electrical safety fundamentals' },
  { id: '7', name: 'Electrical 101', category: 'electrical', status: 'required', description: 'Basic electrical concepts for pool equipment' },
  { id: '8', name: 'Electrical 102', category: 'electrical', status: 'required', description: 'Advanced electrical troubleshooting' },
  { id: '9', name: 'Heater Safety PPE', category: 'heater', status: 'required', description: 'Personal protective equipment for heater work' },
  { id: '10', name: 'Heater 101/Codes', category: 'heater', status: 'required', description: 'Heater operation and code compliance' },
  { id: '11', name: 'Pool Electric Safety & Bonding', category: 'electrical', status: 'upcoming', scheduledDate: '2026-02-15', description: 'Bonding requirements for pool electrical systems' },
  { id: '12', name: 'Electric 102: 1&3 Phase', category: 'electrical', status: 'upcoming', scheduledDate: '2026-02-28', description: 'Single and three phase motor systems' },
  { id: '13', name: 'Bonding Pool & Spa', category: 'electrical', status: 'upcoming', scheduledDate: '2026-03-10', description: 'Pool and spa bonding techniques' },
  { id: '14', name: 'Lockout/Tagout', category: 'safety', status: 'upcoming', scheduledDate: '2026-03-20', description: 'LOTO procedures for equipment maintenance' },
  { id: '15', name: 'Pool & Spa Equip Bonding', category: 'electrical', status: 'upcoming', scheduledDate: '2026-04-01', description: 'Equipment bonding requirements' },
  { id: '16', name: 'Pool vs Regular Electric', category: 'electrical', status: 'upcoming', scheduledDate: '2026-04-15', description: 'Differences between pool and standard electrical' },
];

const CATEGORY_COLORS: Record<string, string> = {
  chemical: BrandColors.tropicalTeal,
  electrical: BrandColors.azureBlue,
  safety: BrandColors.vividTangerine,
  heater: '#FF6B6B',
  general: BrandColors.emerald,
};

const CATEGORY_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  chemical: 'droplet',
  electrical: 'zap',
  safety: 'shield',
  heater: 'thermometer',
  general: 'award',
};

type FilterType = 'all' | 'completed' | 'in_progress' | 'required' | 'upcoming';

export default function RoadToSuccessScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const completedCount = TRAINING_MODULES.filter(m => m.status === 'completed').length;
  const totalCount = TRAINING_MODULES.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  const filteredModules = filter === 'all' 
    ? TRAINING_MODULES 
    : TRAINING_MODULES.filter(m => m.status === filter);

  const handleFilterPress = (newFilter: FilterType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFilter(newFilter);
  };

  const handleModulePress = (moduleId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const getStatusIcon = (status: TrainingModule['status']) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'in_progress':
        return 'clock';
      case 'required':
        return 'alert-circle';
      case 'upcoming':
        return 'calendar';
      default:
        return 'circle';
    }
  };

  const getStatusColor = (status: TrainingModule['status']) => {
    switch (status) {
      case 'completed':
        return BrandColors.emerald;
      case 'in_progress':
        return BrandColors.azureBlue;
      case 'required':
        return BrandColors.vividTangerine;
      case 'upcoming':
        return theme.textSecondary;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusLabel = (status: TrainingModule['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'required':
        return 'Required';
      case 'upcoming':
        return 'Upcoming';
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerContent}>
          <View style={[styles.headerIconContainer, { backgroundColor: BrandColors.azureBlue }]}>
            <Feather name="award" size={24} color="#FFFFFF" />
          </View>
          <View>
            <ThemedText style={styles.headerTitle}>Road to Success</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Your training journey
            </ThemedText>
          </View>
        </View>
      </View>

      <KeyboardAwareScrollViewCompat
        style={styles.scrollView}
        contentContainerStyle={{
          paddingHorizontal: Spacing.screenPadding,
          paddingBottom: tabBarHeight + Spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.progressCard, { backgroundColor: theme.surface }]}
        >
          <View style={styles.progressHeader}>
            <ThemedText style={styles.progressTitle}>Overall Progress</ThemedText>
            <ThemedText style={[styles.progressCount, { color: BrandColors.azureBlue }]}>
              {completedCount}/{totalCount}
            </ThemedText>
          </View>
          
          <View style={[styles.progressBarContainer, { backgroundColor: theme.backgroundSecondary }]}>
            <View 
              style={[
                styles.progressBar, 
                { 
                  width: `${progressPercentage}%`,
                  backgroundColor: BrandColors.emerald 
                }
              ]} 
            />
          </View>
          
          <View style={styles.progressStats}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: BrandColors.emerald }]} />
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                {completedCount} Completed
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: BrandColors.azureBlue }]} />
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                {TRAINING_MODULES.filter(m => m.status === 'in_progress').length} In Progress
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: BrandColors.vividTangerine }]} />
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                {TRAINING_MODULES.filter(m => m.status === 'required').length} Required
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.filterContainer}
        >
          {(['all', 'completed', 'in_progress', 'required', 'upcoming'] as FilterType[]).map((filterOption) => (
            <Pressable
              key={filterOption}
              style={[
                styles.filterButton,
                { 
                  backgroundColor: filter === filterOption ? BrandColors.azureBlue : theme.surface,
                  borderColor: filter === filterOption ? BrandColors.azureBlue : theme.border,
                }
              ]}
              onPress={() => handleFilterPress(filterOption)}
            >
              <ThemedText
                style={[
                  styles.filterText,
                  { color: filter === filterOption ? '#FFFFFF' : theme.text }
                ]}
              >
                {filterOption === 'all' ? 'All' : getStatusLabel(filterOption as TrainingModule['status'])}
              </ThemedText>
            </Pressable>
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <ThemedText style={styles.sectionTitle}>Training Modules</ThemedText>
          
          {filteredModules.map((module, index) => (
            <Pressable
              key={module.id}
              style={[styles.moduleCard, { backgroundColor: theme.surface }]}
              onPress={() => handleModulePress(module.id)}
            >
              <View style={styles.moduleHeader}>
                <View style={[styles.categoryIcon, { backgroundColor: CATEGORY_COLORS[module.category] + '20' }]}>
                  <Feather 
                    name={CATEGORY_ICONS[module.category]} 
                    size={20} 
                    color={CATEGORY_COLORS[module.category]} 
                  />
                </View>
                
                <View style={styles.moduleInfo}>
                  <ThemedText style={styles.moduleName}>{module.name}</ThemedText>
                  <View style={styles.statusRow}>
                    <Feather 
                      name={getStatusIcon(module.status)} 
                      size={14} 
                      color={getStatusColor(module.status)} 
                    />
                    <ThemedText style={[styles.statusText, { color: getStatusColor(module.status) }]}>
                      {getStatusLabel(module.status)}
                    </ThemedText>
                    {module.completedDate && module.status === 'completed' ? (
                      <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
                        {formatDate(module.completedDate)}
                      </ThemedText>
                    ) : null}
                    {module.scheduledDate && module.status === 'upcoming' ? (
                      <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
                        {formatDate(module.scheduledDate)}
                      </ThemedText>
                    ) : null}
                  </View>
                </View>

                <Feather 
                  name={expandedModule === module.id ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={theme.textSecondary} 
                />
              </View>

              {expandedModule === module.id ? (
                <View style={[styles.moduleDetails, { borderTopColor: theme.border }]}>
                  <ThemedText style={[styles.moduleDescription, { color: theme.textSecondary }]}>
                    {module.description}
                  </ThemedText>
                  <View style={styles.categoryBadge}>
                    <View style={[styles.categoryDot, { backgroundColor: CATEGORY_COLORS[module.category] }]} />
                    <ThemedText style={[styles.categoryText, { color: theme.textSecondary }]}>
                      {module.category.charAt(0).toUpperCase() + module.category.slice(1)} Training
                    </ThemedText>
                  </View>
                </View>
              ) : null}
            </Pressable>
          ))}
        </Animated.View>

        <View style={styles.legendSection}>
          <ThemedText style={[styles.legendTitle, { color: theme.textSecondary }]}>Categories</ThemedText>
          <View style={styles.legendGrid}>
            {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
              <View key={category} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: color }]} />
                <ThemedText style={[styles.legendText, { color: theme.textSecondary }]}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  progressCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: '100%',
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  moduleCard: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleInfo: {
    flex: 1,
  },
  moduleName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    marginLeft: Spacing.xs,
  },
  moduleDetails: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  moduleDescription: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  legendSection: {
    marginTop: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
  },
});
