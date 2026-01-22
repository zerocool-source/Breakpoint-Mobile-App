import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Modal,
  TextInput,
  Image,
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
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import {
  mockTruckInspections,
  truckChecklistItems,
  TruckInspection,
  DamageMark,
  TruckChecklistItem,
} from '@/lib/mockData';
import { mockTechnicians } from '@/lib/supervisorMockData';

import truckFrontImage from '../../assets/images/truck-front.png';
import truckRearImage from '../../assets/images/truck-rear.png';
import truckSideImage from '../../assets/images/truck-side.png';

type InspectionStatus = 'pending' | 'completed';
type DamageView = 'front' | 'rear' | 'driver_side' | 'cargo';
type DamageType = 'dent' | 'scratch' | 'crack' | 'missing' | 'rust' | 'other';
type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full';
type OverallCondition = 'excellent' | 'good' | 'fair' | 'poor';

const statusConfig: Record<InspectionStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Pending', color: BrandColors.vividTangerine, bgColor: BrandColors.vividTangerine + '20' },
  completed: { label: 'Completed', color: BrandColors.emerald, bgColor: BrandColors.emerald + '20' },
};

const damageTypeConfig: Record<DamageType, { label: string; color: string }> = {
  dent: { label: 'Dent', color: '#FF3B30' },
  scratch: { label: 'Scratch', color: '#FF8000' },
  crack: { label: 'Crack', color: '#0078D4' },
  missing: { label: 'Missing', color: '#9C27B0' },
  rust: { label: 'Rust', color: '#8E8E93' },
  other: { label: 'Other', color: '#FFD700' },
};

const fuelLevelOptions: { value: FuelLevel; label: string }[] = [
  { value: 'empty', label: 'Empty' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'half', label: 'Half' },
  { value: 'three_quarter', label: 'Three Quarter' },
  { value: 'full', label: 'Full' },
];

const conditionOptions: { value: OverallCondition; label: string }[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

const viewTabs: { key: DamageView; label: string }[] = [
  { key: 'front', label: 'Front View' },
  { key: 'rear', label: 'Rear View' },
  { key: 'driver_side', label: 'Driver Side' },
  { key: 'cargo', label: 'Cargo Area' },
];

interface InspectionCardProps {
  inspection: TruckInspection;
  index: number;
}

function InspectionCard({ inspection, index }: InspectionCardProps) {
  const { theme } = useTheme();
  const config = statusConfig[inspection.status];
  const fuelLabel = fuelLevelOptions.find(f => f.value === inspection.fuelLevel)?.label || inspection.fuelLevel;
  const conditionLabel = conditionOptions.find(c => c.value === inspection.overallCondition)?.label || inspection.overallCondition;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <View style={styles.truckInfo}>
              <Feather name="truck" size={18} color={BrandColors.azureBlue} />
              <ThemedText style={styles.cardTitle}>{inspection.truckNumber}</ThemedText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
              <ThemedText style={[styles.statusText, { color: config.color }]}>
                {config.label}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Feather name="user" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {inspection.technicianName}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="calendar" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {new Date(inspection.inspectionDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </ThemedText>
          </View>
          <View style={styles.detailRow}>
            <Feather name="activity" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.detailText, { color: theme.textSecondary }]}>
              {inspection.mileage.toLocaleString()} miles
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricBadge, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="droplet" size={12} color={BrandColors.tropicalTeal} />
            <ThemedText style={[styles.metricText, { color: theme.text }]}>{fuelLabel}</ThemedText>
          </View>
          <View style={[styles.metricBadge, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="shield" size={12} color={BrandColors.azureBlue} />
            <ThemedText style={[styles.metricText, { color: theme.text }]}>{conditionLabel}</ThemedText>
          </View>
          {inspection.damageMarks.length > 0 ? (
            <View style={[styles.metricBadge, { backgroundColor: BrandColors.danger + '20' }]}>
              <Feather name="alert-triangle" size={12} color={BrandColors.danger} />
              <ThemedText style={[styles.metricText, { color: BrandColors.danger }]}>
                {inspection.damageMarks.length} damage
              </ThemedText>
            </View>
          ) : null}
        </View>

        {inspection.notes ? (
          <View style={[styles.notesSection, { borderTopColor: theme.border }]}>
            <Feather name="file-text" size={14} color={theme.textSecondary} />
            <ThemedText style={[styles.notesText, { color: theme.textSecondary }]} numberOfLines={2}>
              {inspection.notes}
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

interface TruckInspectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (inspection: Partial<TruckInspection>) => void;
}

function TruckInspectionModal({ visible, onClose, onSubmit }: TruckInspectionModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [truckNumber, setTruckNumber] = useState('');
  const [inspectionDate, setInspectionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [mileage, setMileage] = useState('');
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>('full');
  const [overallCondition, setOverallCondition] = useState<OverallCondition>('good');
  const [activeView, setActiveView] = useState<DamageView>('front');
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([]);
  const [selectedDamageType, setSelectedDamageType] = useState<DamageType>('dent');
  const [checklist, setChecklist] = useState<TruckChecklistItem[]>(
    truckChecklistItems.map(item => ({ ...item, checked: false }))
  );
  const [notes, setNotes] = useState('');

  const getImageForView = (view: DamageView) => {
    switch (view) {
      case 'front':
        return truckFrontImage;
      case 'rear':
        return truckRearImage;
      case 'driver_side':
      case 'cargo':
        return truckSideImage;
      default:
        return truckFrontImage;
    }
  };

  const handleImagePress = (event: { nativeEvent: { locationX: number; locationY: number } }) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const { locationX, locationY } = event.nativeEvent;
    const newMark: DamageMark = {
      id: Date.now().toString(),
      view: activeView,
      x: locationX,
      y: locationY,
      type: selectedDamageType,
    };
    setDamageMarks([...damageMarks, newMark]);
  };

  const handleRemoveDamageMark = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setDamageMarks(damageMarks.filter(mark => mark.id !== id));
  };

  const handleChecklistToggle = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setChecklist(checklist.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleSubmit = () => {
    if (!truckNumber || !selectedTechnician || !mileage) {
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
      truckNumber,
      inspectionDate: inspectionDate.toISOString().split('T')[0],
      technicianId: selectedTechnician,
      technicianName: technician?.name || '',
      mileage: parseInt(mileage, 10),
      fuelLevel,
      overallCondition,
      damageMarks,
      checklist,
      notes,
      status: 'completed',
    });

    resetForm();
    onClose();
  };

  const resetForm = () => {
    setTruckNumber('');
    setInspectionDate(new Date());
    setSelectedTechnician('');
    setMileage('');
    setFuelLevel('full');
    setOverallCondition('good');
    setActiveView('front');
    setDamageMarks([]);
    setSelectedDamageType('dent');
    setChecklist(truckChecklistItems.map(item => ({ ...item, checked: false })));
    setNotes('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const currentViewMarks = damageMarks.filter(mark => mark.view === activeView);
  const checkedCount = checklist.filter(item => item.checked).length;

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
                <Feather name="truck" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.headerText}>
                <ThemedText style={styles.headerTitle}>New Truck Inspection</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Complete inspection checklist</ThemedText>
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
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Vehicle Information</ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Truck Number *</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  value={truckNumber}
                  onChangeText={setTruckNumber}
                  placeholder="e.g., T-101"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Inspection Date *</ThemedText>
                <Pressable
                  style={[styles.dateButton, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Feather name="calendar" size={18} color={theme.textSecondary} />
                  <ThemedText style={[styles.dateText, { color: theme.text }]}>
                    {inspectionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </ThemedText>
                </Pressable>
                {showDatePicker ? (
                  <DateTimePicker
                    value={inspectionDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event: DateTimePickerEvent, date?: Date) => {
                      setShowDatePicker(Platform.OS === 'ios');
                      if (date) setInspectionDate(date);
                    }}
                  />
                ) : null}
              </View>

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
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Current Mileage *</ThemedText>
                <TextInput
                  style={[styles.textInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                  value={mileage}
                  onChangeText={setMileage}
                  placeholder="e.g., 45230"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Fuel Level</ThemedText>
                  <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <Picker
                      selectedValue={fuelLevel}
                      onValueChange={setFuelLevel}
                      style={styles.picker}
                      dropdownIconColor={theme.textSecondary}
                    >
                      {fuelLevelOptions.map((option) => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} color={theme.text} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Overall Condition</ThemedText>
                  <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                    <Picker
                      selectedValue={overallCondition}
                      onValueChange={setOverallCondition}
                      style={styles.picker}
                      dropdownIconColor={theme.textSecondary}
                    >
                      {conditionOptions.map((option) => (
                        <Picker.Item key={option.value} label={option.label} value={option.value} color={theme.text} />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Damage Inspection</ThemedText>
              <ThemedText style={[styles.sectionHint, { color: theme.textSecondary }]}>
                Tap on the image to mark damage locations
              </ThemedText>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
                <View style={styles.tabContainer}>
                  {viewTabs.map((tab) => (
                    <Pressable
                      key={tab.key}
                      style={[
                        styles.tabButton,
                        {
                          backgroundColor: activeView === tab.key ? BrandColors.azureBlue : theme.backgroundSecondary,
                          borderColor: activeView === tab.key ? BrandColors.azureBlue : theme.border,
                        },
                      ]}
                      onPress={() => setActiveView(tab.key)}
                    >
                      <ThemedText
                        style={[styles.tabText, { color: activeView === tab.key ? '#FFFFFF' : theme.textSecondary }]}
                      >
                        {tab.label}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.damageTypeSelector}>
                <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Damage Type:</ThemedText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.damageTypeContainer}>
                    {(Object.keys(damageTypeConfig) as DamageType[]).map((type) => (
                      <Pressable
                        key={type}
                        style={[
                          styles.damageTypeButton,
                          {
                            backgroundColor: selectedDamageType === type ? damageTypeConfig[type].color : theme.backgroundSecondary,
                            borderColor: damageTypeConfig[type].color,
                          },
                        ]}
                        onPress={() => setSelectedDamageType(type)}
                      >
                        <ThemedText
                          style={[
                            styles.damageTypeText,
                            { color: selectedDamageType === type ? '#FFFFFF' : damageTypeConfig[type].color },
                          ]}
                        >
                          {damageTypeConfig[type].label}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <Pressable onPress={handleImagePress} style={[styles.imageContainer, { backgroundColor: theme.backgroundSecondary }]}>
                <Image source={getImageForView(activeView)} style={styles.truckImage} resizeMode="contain" />
                {currentViewMarks.map((mark) => (
                  <Pressable
                    key={mark.id}
                    style={[
                      styles.damageMark,
                      {
                        left: mark.x - 12,
                        top: mark.y - 12,
                        backgroundColor: damageTypeConfig[mark.type].color,
                      },
                    ]}
                    onPress={() => handleRemoveDamageMark(mark.id)}
                  >
                    <Feather name="x" size={14} color="#FFFFFF" />
                  </Pressable>
                ))}
              </Pressable>

              {damageMarks.length > 0 ? (
                <View style={[styles.damageListCard, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText style={[styles.damageListTitle, { color: theme.text }]}>
                    Marked Damage ({damageMarks.length})
                  </ThemedText>
                  {damageMarks.map((mark) => (
                    <View key={mark.id} style={styles.damageListItem}>
                      <View style={[styles.damageListDot, { backgroundColor: damageTypeConfig[mark.type].color }]} />
                      <ThemedText style={[styles.damageListText, { color: theme.text }]}>
                        {damageTypeConfig[mark.type].label} - {viewTabs.find(v => v.key === mark.view)?.label}
                      </ThemedText>
                      <Pressable onPress={() => handleRemoveDamageMark(mark.id)}>
                        <Feather name="trash-2" size={16} color={BrandColors.danger} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Inspection Checklist</ThemedText>
                <ThemedText style={[styles.checklistProgress, { color: BrandColors.azureBlue }]}>
                  {checkedCount}/{checklist.length}
                </ThemedText>
              </View>

              <View style={[styles.checklistCard, { backgroundColor: theme.backgroundSecondary }]}>
                {checklist.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.checklistItem, { borderBottomColor: theme.border }]}
                    onPress={() => handleChecklistToggle(item.id)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        {
                          backgroundColor: item.checked ? BrandColors.emerald : 'transparent',
                          borderColor: item.checked ? BrandColors.emerald : theme.border,
                        },
                      ]}
                    >
                      {item.checked ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
                    </View>
                    <ThemedText
                      style={[
                        styles.checklistLabel,
                        { color: item.checked ? theme.text : theme.textSecondary },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Notes</ThemedText>
              <TextInput
                style={[styles.notesInput, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border, color: theme.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Add any additional notes..."
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <BPButton variant="outline" onPress={handleClose} style={styles.cancelButton}>
              Cancel
            </BPButton>
            <BPButton
              onPress={handleSubmit}
              disabled={!truckNumber || !selectedTechnician || !mileage}
              style={styles.submitButton}
            >
              <Feather name="check" size={18} color="#FFFFFF" style={{ marginRight: Spacing.xs }} />
              Submit Inspection
            </BPButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function TruckInspectionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [inspections, setInspections] = useState<TruckInspection[]>(mockTruckInspections);

  const handleNewInspection = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowModal(true);
  };

  const handleSubmitInspection = (inspection: Partial<TruckInspection>) => {
    const newInspection: TruckInspection = {
      id: Date.now().toString(),
      truckNumber: inspection.truckNumber || '',
      inspectionDate: inspection.inspectionDate || new Date().toISOString().split('T')[0],
      technicianId: inspection.technicianId || '',
      technicianName: inspection.technicianName || '',
      mileage: inspection.mileage || 0,
      fuelLevel: inspection.fuelLevel || 'full',
      overallCondition: inspection.overallCondition || 'good',
      damageMarks: inspection.damageMarks || [],
      checklist: inspection.checklist || [],
      notes: inspection.notes || '',
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    setInspections([newInspection, ...inspections]);
  };

  const completedCount = inspections.filter(i => i.status === 'completed').length;
  const pendingCount = inspections.filter(i => i.status === 'pending').length;

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
              <ThemedText style={styles.title}>Truck Inspection</ThemedText>
              <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                Vehicle condition reports
              </ThemedText>
            </View>
            <Pressable
              style={[styles.newButton, { backgroundColor: BrandColors.azureBlue }]}
              onPress={handleNewInspection}
            >
              <Feather name="plus" size={20} color="#FFFFFF" />
              <ThemedText style={styles.newButtonText}>Start New Inspection</ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.statValue, { color: BrandColors.azureBlue }]}>
              {inspections.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.statValue, { color: BrandColors.emerald }]}>
              {completedCount}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Completed</ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.statValue, { color: BrandColors.vividTangerine }]}>
              {pendingCount}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Pending</ThemedText>
          </View>
        </View>

        <View style={styles.listSection}>
          <ThemedText style={styles.sectionHeader}>Recent Inspections ({inspections.length})</ThemedText>
          {inspections.length > 0 ? (
            inspections.map((inspection, index) => (
              <InspectionCard key={inspection.id} inspection={inspection} index={index} />
            ))
          ) : (
            <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
              <Feather name="truck" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                No truck inspections yet
              </ThemedText>
              <ThemedText style={[styles.emptyHint, { color: theme.textSecondary }]}>
                Start a new inspection to track vehicle conditions
              </ThemedText>
            </View>
          )}
        </View>
      </ScrollView>

      <TruckInspectionModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmitInspection}
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
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
  listSection: {
    gap: Spacing.md,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardHeader: {
    marginBottom: Spacing.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  truckInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
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
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  metricText: {
    fontSize: 11,
    fontWeight: '500',
  },
  notesSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
    borderTopWidth: 1,
  },
  notesText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing['3xl'],
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyHint: {
    fontSize: 13,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
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
    flex: 1,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing['2xl'],
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHint: {
    fontSize: 12,
    marginTop: -Spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputGroup: {
    gap: Spacing.xs,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  textInput: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  dateButton: {
    height: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dateText: {
    fontSize: 15,
  },
  pickerContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tabScroll: {
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  tabContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  tabButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
  },
  damageTypeSelector: {
    gap: Spacing.sm,
  },
  damageTypeContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  damageTypeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
  },
  damageTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  imageContainer: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  truckImage: {
    width: '100%',
    height: 200,
  },
  damageMark: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  damageListCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  damageListTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  damageListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  damageListDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  damageListText: {
    fontSize: 13,
    flex: 1,
  },
  checklistProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  checklistCard: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistLabel: {
    fontSize: 14,
    flex: 1,
  },
  notesInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 100,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
});
