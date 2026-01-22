import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import {
  mockQCInspections,
  type QCInspection,
  type QCCategory,
} from '@/lib/supervisorMockData';

const defaultCategories: QCCategory[] = [
  {
    id: 'c1',
    name: 'Water Quality',
    items: [
      { id: 'i1', label: 'pH levels within range', checked: false },
      { id: 'i2', label: 'Chlorine levels adequate', checked: false },
      { id: 'i3', label: 'Water clarity acceptable', checked: false },
    ],
  },
  {
    id: 'c2',
    name: 'Equipment',
    items: [
      { id: 'i4', label: 'Pump operating correctly', checked: false },
      { id: 'i5', label: 'Filter pressure normal', checked: false },
      { id: 'i6', label: 'Skimmer baskets clean', checked: false },
    ],
  },
  {
    id: 'c3',
    name: 'Safety',
    items: [
      { id: 'i7', label: 'Safety equipment present', checked: false },
      { id: 'i8', label: 'Signage visible', checked: false },
      { id: 'i9', label: 'Barriers intact', checked: false },
    ],
  },
  {
    id: 'c4',
    name: 'Cleanliness',
    items: [
      { id: 'i10', label: 'Deck area clean', checked: false },
      { id: 'i11', label: 'Restrooms stocked', checked: false },
      { id: 'i12', label: 'Trash removed', checked: false },
    ],
  },
  {
    id: 'c5',
    name: 'Documentation',
    items: [
      { id: 'i13', label: 'Log book updated', checked: false },
      { id: 'i14', label: 'Photos taken', checked: false },
      { id: 'i15', label: 'Notes added', checked: false },
    ],
  },
];

interface InspectionItemProps {
  inspection: QCInspection;
  onPress: () => void;
}

function InspectionItem({ inspection, onPress }: InspectionItemProps) {
  const { theme } = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return BrandColors.vividTangerine;
      case 'SCHEDULED':
        return '#9C27B0';
      case 'COMPLETED':
        return BrandColors.emerald;
      case 'IN_PROGRESS':
        return BrandColors.azureBlue;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <Pressable style={[styles.inspectionItem, { backgroundColor: theme.surface }]} onPress={onPress}>
      <View style={styles.inspectionContent}>
        <ThemedText style={styles.inspectionProperty}>{inspection.propertyName}</ThemedText>
        {inspection.poolName ? (
          <ThemedText style={[styles.poolName, { color: theme.textSecondary }]}>
            {inspection.poolName}
          </ThemedText>
        ) : null}
        <View style={styles.inspectionMeta}>
          <View style={styles.inspectionRow}>
            <Feather name="user" size={12} color={theme.textSecondary} />
            <ThemedText style={[styles.inspectionTech, { color: theme.textSecondary }]}>
              {inspection.technicianName}
            </ThemedText>
          </View>
          <View style={styles.inspectionRow}>
            <Feather name="clock" size={12} color={theme.textSecondary} />
            <ThemedText style={[styles.inspectionTime, { color: theme.textSecondary }]}>
              {inspection.time} - {inspection.date}
            </ThemedText>
          </View>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(inspection.status) + '20' }]}>
        <ThemedText style={[styles.statusText, { color: getStatusColor(inspection.status) }]}>
          {inspection.status}
        </ThemedText>
      </View>
    </Pressable>
  );
}

interface QCChecklistModalProps {
  visible: boolean;
  onClose: () => void;
  inspection: QCInspection | null;
}

function QCChecklistModal({ visible, onClose, inspection }: QCChecklistModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [categories, setCategories] = useState<QCCategory[]>(
    inspection?.categories || defaultCategories
  );
  const [expandedCategory, setExpandedCategory] = useState<string | null>('c1');

  const toggleItem = (categoryId: string, itemId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, checked: !item.checked } : item
              ),
            }
          : cat
      )
    );
  };

  const getCategoryProgress = (category: QCCategory) => {
    const checked = category.items.filter((item) => item.checked).length;
    return `${checked}/${category.items.length}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={[styles.modalHeader, { backgroundColor: BrandColors.azureBlue }]}>
            <View style={styles.modalHeaderContent}>
              <Feather name="check-square" size={24} color="#FFFFFF" />
              <ThemedText style={styles.modalHeaderTitle}>QC Checklist</ThemedText>
            </View>
            <Pressable style={styles.modalCloseButton} onPress={onClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {inspection ? (
            <View style={[styles.propertyInfo, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.propertyInfoName}>{inspection.propertyName}</ThemedText>
              <ThemedText style={[styles.propertyInfoPool, { color: theme.textSecondary }]}>
                {inspection.poolName || 'Main Pool'}
              </ThemedText>
            </View>
          ) : null}

          <ScrollView
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {categories.map((category) => (
              <View key={category.id} style={styles.categoryContainer}>
                <Pressable
                  style={[styles.categoryHeader, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => setExpandedCategory(
                    expandedCategory === category.id ? null : category.id
                  )}
                >
                  <View style={styles.categoryHeaderLeft}>
                    <Feather
                      name={expandedCategory === category.id ? 'chevron-down' : 'chevron-right'}
                      size={18}
                      color={theme.textSecondary}
                    />
                    <ThemedText style={styles.categoryTitle}>{category.name}</ThemedText>
                  </View>
                  <ThemedText style={[styles.categoryProgress, { color: BrandColors.azureBlue }]}>
                    {getCategoryProgress(category)}
                  </ThemedText>
                </Pressable>
                {expandedCategory === category.id ? (
                  <View style={styles.categoryItems}>
                    {category.items.map((item) => (
                      <Pressable
                        key={item.id}
                        style={styles.checklistItem}
                        onPress={() => toggleItem(category.id, item.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            { borderColor: theme.border },
                            item.checked && { backgroundColor: BrandColors.emerald, borderColor: BrandColors.emerald },
                          ]}
                        >
                          {item.checked ? (
                            <Feather name="check" size={14} color="#FFFFFF" />
                          ) : null}
                        </View>
                        <ThemedText
                          style={[
                            styles.checklistLabel,
                            item.checked && { color: theme.textSecondary, textDecorationLine: 'line-through' },
                          ]}
                        >
                          {item.label}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalFooter}>
            <BPButton variant="primary" onPress={onClose} fullWidth>
              Save Checklist
            </BPButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SupervisorActivityScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  
  const [selectedInspection, setSelectedInspection] = useState<QCInspection | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleInspectionPress = (inspection: QCInspection) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedInspection(inspection);
    setModalVisible(true);
  };

  const todayInspections = mockQCInspections.filter((i) => i.date === 'Today');
  const tomorrowInspections = mockQCInspections.filter((i) => i.date === 'Tomorrow');

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md, backgroundColor: theme.surface }]}>
        <ThemedText style={styles.headerTitle}>Activity</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {todayInspections.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBullet, { backgroundColor: BrandColors.azureBlue }]} />
              <ThemedText style={styles.sectionTitle}>Today's Inspections</ThemedText>
              <View style={[styles.countBadge, { backgroundColor: BrandColors.azureBlue }]}>
                <ThemedText style={styles.countBadgeText}>{todayInspections.length}</ThemedText>
              </View>
            </View>
            <View style={styles.inspectionsList}>
              {todayInspections.map((inspection) => (
                <InspectionItem
                  key={inspection.id}
                  inspection={inspection}
                  onPress={() => handleInspectionPress(inspection)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {tomorrowInspections.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionBullet, { backgroundColor: '#9C27B0' }]} />
              <ThemedText style={styles.sectionTitle}>Tomorrow's Inspections</ThemedText>
              <View style={[styles.countBadge, { backgroundColor: '#9C27B0' }]}>
                <ThemedText style={styles.countBadgeText}>{tomorrowInspections.length}</ThemedText>
              </View>
            </View>
            <View style={styles.inspectionsList}>
              {tomorrowInspections.map((inspection) => (
                <InspectionItem
                  key={inspection.id}
                  inspection={inspection}
                  onPress={() => handleInspectionPress(inspection)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <QCChecklistModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        inspection={selectedInspection}
      />
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
    ...Shadows.header,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionBullet: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inspectionsList: {
    gap: Spacing.sm,
  },
  inspectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  inspectionContent: {
    flex: 1,
  },
  inspectionProperty: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  poolName: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  inspectionMeta: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  inspectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  inspectionTech: {
    fontSize: 12,
  },
  inspectionTime: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  propertyInfoName: {
    fontSize: 16,
    fontWeight: '600',
  },
  propertyInfoPool: {
    fontSize: 13,
    marginTop: 2,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  categoryContainer: {
    marginBottom: Spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryItems: {
    paddingLeft: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistLabel: {
    fontSize: 14,
    flex: 1,
  },
  modalFooter: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
