import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { ThemedText } from '@/components/ThemedText';
import { BubbleBackground } from '@/components/BubbleBackground';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockSupportiveActions, SupportiveAction } from '@/lib/mockData';
import { mockTechnicians } from '@/lib/supervisorMockData';

type FilterStatus = 'all' | 'active' | 'completed';
type Category = 'performance' | 'behavior' | 'safety' | 'attendance' | 'quality';
type Severity = 'low' | 'medium' | 'high';
type ActionStatus = 'pending' | 'in_progress' | 'completed';

const categoryConfig: Record<Category, { label: string; color: string; bgColor: string }> = {
  performance: { label: 'Performance', color: BrandColors.azureBlue, bgColor: BrandColors.azureBlue + '20' },
  behavior: { label: 'Behavior', color: '#9C27B0', bgColor: '#9C27B020' },
  safety: { label: 'Safety', color: BrandColors.danger, bgColor: BrandColors.danger + '20' },
  attendance: { label: 'Attendance', color: BrandColors.vividTangerine, bgColor: BrandColors.vividTangerine + '20' },
  quality: { label: 'Quality', color: BrandColors.tropicalTeal, bgColor: BrandColors.tropicalTeal + '20' },
};

const severityConfig: Record<Severity, { label: string; color: string; bgColor: string }> = {
  low: { label: 'Low', color: BrandColors.emerald, bgColor: BrandColors.emerald + '20' },
  medium: { label: 'Medium', color: BrandColors.vividTangerine, bgColor: BrandColors.vividTangerine + '20' },
  high: { label: 'High', color: BrandColors.danger, bgColor: BrandColors.danger + '20' },
};

const statusConfig: Record<ActionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: '#666666', bgColor: '#F0F0F0' },
  in_progress: { label: 'Active', color: BrandColors.azureBlue, bgColor: BrandColors.azureBlue + '20' },
  completed: { label: 'Completed', color: BrandColors.emerald, bgColor: BrandColors.emerald + '20' },
};

const categoryOptions: { value: Category; label: string }[] = [
  { value: 'performance', label: 'Performance' },
  { value: 'behavior', label: 'Behavior' },
  { value: 'safety', label: 'Safety' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'quality', label: 'Quality' },
];

const severityOptions: { value: Severity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface SupportiveActionCardProps {
  action: SupportiveAction;
  index: number;
}

function SupportiveActionCard({ action, index }: SupportiveActionCardProps) {
  const { theme } = useTheme();
  const catConfig = categoryConfig[action.category];
  const statConfig = statusConfig[action.status];
  const sevConfig = severityConfig[action.severity];

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={styles.techInfo}>
              <Feather name="user" size={18} color={BrandColors.azureBlue} />
              <ThemedText style={styles.cardTitle}>{action.technicianName}</ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statConfig.bgColor }]}>
              <ThemedText style={[styles.statusText, { color: statConfig.color }]}>
                {statConfig.label}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: catConfig.bgColor }]}>
            <ThemedText style={[styles.categoryText, { color: catConfig.color }]}>
              {catConfig.label}
            </ThemedText>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: sevConfig.bgColor }]}>
            <ThemedText style={[styles.categoryText, { color: sevConfig.color }]}>
              {sevConfig.label}
            </ThemedText>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {new Date(action.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.issueSection, { borderTopColor: theme.border }]}>
          <ThemedText style={[styles.issueLabelText, { color: theme.textSecondary }]}>Issue:</ThemedText>
          <ThemedText style={[styles.issueText, { color: theme.text }]} numberOfLines={2}>
            {action.issueDescription}
          </ThemedText>
        </View>

        <View style={styles.planSection}>
          <ThemedText style={[styles.issueLabelText, { color: theme.textSecondary }]}>Action Plan:</ThemedText>
          <ThemedText style={[styles.issueText, { color: theme.text }]} numberOfLines={2}>
            {action.actionPlan}
          </ThemedText>
        </View>

        <View style={styles.followUpRow}>
          <Feather name="clock" size={14} color={BrandColors.vividTangerine} />
          <ThemedText style={[styles.followUpText, { color: BrandColors.vividTangerine }]}>
            Follow-up: {new Date(action.followUpDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

interface NewSupportiveActionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (action: Partial<SupportiveAction>) => void;
}

function NewSupportiveActionModal({ visible, onClose, onSubmit }: NewSupportiveActionModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [actionDate, setActionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState<Category>('performance');
  const [severity, setSeverity] = useState<Severity>('low');
  const [issueDescription, setIssueDescription] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [followUpDate, setFollowUpDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showFollowUpDatePicker, setShowFollowUpDatePicker] = useState(false);

  const handleSubmit = () => {
    if (!selectedTechnician || !issueDescription || !actionPlan) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const technician = mockTechnicians.find(t => t.id === selectedTechnician);
    onSubmit({
      technicianId: selectedTechnician,
      technicianName: technician?.name || '',
      date: actionDate.toISOString().split('T')[0],
      category,
      severity,
      issueDescription,
      actionPlan,
      followUpDate: followUpDate.toISOString().split('T')[0],
      status: 'pending',
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setSelectedTechnician('');
    setActionDate(new Date());
    setCategory('performance');
    setSeverity('low');
    setIssueDescription('');
    setActionPlan('');
    setFollowUpDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.lg, maxHeight: windowHeight * 0.95 },
          ]}
        >
          <View style={[styles.modalHeader, { backgroundColor: BrandColors.azureBlue }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Feather name="heart" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.headerText}>
                <ThemedText style={styles.headerTitle}>New Supportive Action</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Document performance coaching</ThemedText>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Technician *</ThemedText>
                <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                  <Picker
                    selectedValue={selectedTechnician}
                    onValueChange={setSelectedTechnician}
                    style={styles.picker}
                    dropdownIconColor={theme.textSecondary}
                  >
                    <Picker.Item label="Select technician..." value="" color={theme.textSecondary} />
                    {mockTechnicians.map((tech) => (
                      <Picker.Item key={tech.id} label={tech.name} value={tech.id} color={theme.text} />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Date *</ThemedText>
                <Pressable
                  style={[styles.dateButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Feather name="calendar" size={18} color={theme.textSecondary} />
                  <ThemedText style={[styles.dateText, { color: theme.text }]}>
                    {actionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </ThemedText>
                </Pressable>
                {showDatePicker ? (
                  <DateTimePicker
                    value={actionDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (date) setActionDate(date);
                    }}
                  />
                ) : null}
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Category *</ThemedText>
                  <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <Picker
                      selectedValue={category}
                      onValueChange={setCategory}
                      style={styles.picker}
                      dropdownIconColor={theme.textSecondary}
                    >
                      {categoryOptions.map((option) => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} color={theme.text} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Severity *</ThemedText>
                  <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <Picker
                      selectedValue={severity}
                      onValueChange={setSeverity}
                      style={styles.picker}
                      dropdownIconColor={theme.textSecondary}
                    >
                      {severityOptions.map((option) => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} color={theme.text} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Issue Description *</ThemedText>
                <TextInput
                  style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  value={issueDescription}
                  onChangeText={setIssueDescription}
                  placeholder="Describe the issue or behavior observed..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Action Plan *</ThemedText>
                <TextInput
                  style={[styles.textArea, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  value={actionPlan}
                  onChangeText={setActionPlan}
                  placeholder="Outline the steps to address this issue..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Follow-Up Date *</ThemedText>
                <Pressable
                  style={[styles.dateButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                  onPress={() => setShowFollowUpDatePicker(true)}
                >
                  <Feather name="clock" size={18} color={theme.textSecondary} />
                  <ThemedText style={[styles.dateText, { color: theme.text }]}>
                    {followUpDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </ThemedText>
                </Pressable>
                {showFollowUpDatePicker ? (
                  <DateTimePicker
                    value={followUpDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                      setShowFollowUpDatePicker(Platform.OS === 'ios');
                      if (date) setFollowUpDate(date);
                    }}
                  />
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Photo Attachment</ThemedText>
                <Pressable
                  style={[styles.photoButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                  }}
                >
                  <Feather name="camera" size={20} color={BrandColors.azureBlue} />
                  <ThemedText style={[styles.photoButtonText, { color: BrandColors.azureBlue }]}>
                    Add Photo
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <Pressable
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={handleClose}
            >
              <ThemedText style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.submitButton, { backgroundColor: BrandColors.azureBlue }]}
              onPress={handleSubmit}
            >
              <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SupportiveActionsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [showNewActionModal, setShowNewActionModal] = useState(false);
  const [actions, setActions] = useState<SupportiveAction[]>(mockSupportiveActions);

  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
  ];

  const filteredActions = filter === 'all'
    ? actions
    : filter === 'active'
      ? actions.filter(a => a.status === 'pending' || a.status === 'in_progress')
      : actions.filter(a => a.status === 'completed');

  const totalCount = actions.length;
  const activeCount = actions.filter(a => a.status === 'pending' || a.status === 'in_progress').length;
  const completedCount = actions.filter(a => a.status === 'completed').length;

  const handleNewAction = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowNewActionModal(true);
  };

  const handleSubmitAction = (newAction: Partial<SupportiveAction>) => {
    const action: SupportiveAction = {
      id: Date.now().toString(),
      technicianId: newAction.technicianId || '',
      technicianName: newAction.technicianName || '',
      date: newAction.date || new Date().toISOString().split('T')[0],
      category: newAction.category || 'performance',
      severity: newAction.severity || 'low',
      issueDescription: newAction.issueDescription || '',
      actionPlan: newAction.actionPlan || '',
      followUpDate: newAction.followUpDate || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setActions([action, ...actions]);
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
              <ThemedText style={styles.title}>Supportive Actions</ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                Performance coaching documentation
              </ThemedText>
            </View>
            <Pressable
              style={[styles.newButton, { backgroundColor: BrandColors.azureBlue }]}
              onPress={handleNewAction}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.newButtonText}>New</ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <ThemedText style={[styles.statValue, { color: BrandColors.azureBlue }]}>
                {totalCount}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total
              </ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <ThemedText style={[styles.statValue, { color: BrandColors.vividTangerine }]}>
                {activeCount}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Active
              </ThemedText>
            </View>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <ThemedText style={[styles.statValue, { color: BrandColors.emerald }]}>
                {completedCount}
              </ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Completed
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
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

        <View style={styles.listSection}>
          <ThemedText style={styles.sectionTitle}>
            {filter === 'all' ? 'All Actions' : filter === 'active' ? 'Active Actions' : 'Completed Actions'} ({filteredActions.length})
          </ThemedText>
          {filteredActions.map((action, index) => (
            <SupportiveActionCard
              key={action.id}
              action={action}
              index={index}
            />
          ))}
          {filteredActions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
              <Feather name="heart" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No supportive actions found
              </ThemedText>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <NewSupportiveActionModal
        visible={showNewActionModal}
        onClose={() => setShowNewActionModal(false)}
        onSubmit={handleSubmitAction}
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
    marginBottom: Spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  techInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
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
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: 13,
  },
  issueSection: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    marginBottom: Spacing.sm,
  },
  planSection: {
    marginBottom: Spacing.sm,
  },
  issueLabelText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  issueText: {
    fontSize: 13,
    lineHeight: 18,
  },
  followUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  followUpText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.card,
  },
  emptyText: {
    fontSize: 15,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  section: {
    gap: Spacing.md,
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  pickerContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  dateText: {
    fontSize: 15,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  textArea: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 100,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
