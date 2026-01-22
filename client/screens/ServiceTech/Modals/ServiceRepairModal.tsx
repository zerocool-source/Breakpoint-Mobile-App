import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

interface ServiceRepairModalProps {
  visible: boolean;
  onClose: () => void;
  propertyName: string;
  propertyAddress: string;
}

const REPAIR_TYPES = [
  'Replaced O-ring',
  'Adjusted valve',
  'Tightened fitting',
  'Replaced gauge',
  'Cleaned strainer',
  'Minor plumbing',
  'Other',
];

const PARTS_USED = ['O-rings', 'Gaskets', 'Fittings', 'Clips', 'Screws', 'None'];

const PART_SOURCES = ['From truck', 'Property supply', 'None needed'];

export function ServiceRepairModal({
  visible,
  onClose,
  propertyName,
  propertyAddress,
}: ServiceRepairModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [repairType, setRepairType] = useState('');
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [partSource, setPartSource] = useState('From truck');
  const [timeSpent, setTimeSpent] = useState(15);
  const [issueDescription, setIssueDescription] = useState('');
  const [billable, setBillable] = useState(false);
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);

  const handleTogglePart = (part: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (part === 'None') {
      setSelectedParts((prev) => (prev.includes('None') ? [] : ['None']));
    } else {
      setSelectedParts((prev) => {
        const withoutNone = prev.filter((p) => p !== 'None');
        return withoutNone.includes(part)
          ? withoutNone.filter((p) => p !== part)
          : [...withoutNone, part];
      });
    }
  };

  const handleTimeChange = (delta: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTimeSpent((prev) => Math.max(0, prev + delta));
  };

  const handleSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onClose();
  };

  const handleVoiceInput = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddBeforePhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddAfterPhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['#FFFFFF', '#E3F2FD', '#FFF3E0', '#FFFFFF']}
          locations={[0, 0.3, 0.7, 1]}
          style={[styles.modalContainer, { paddingBottom: insets.bottom + Spacing.lg }]}
        >
          <View style={[styles.header, { backgroundColor: BrandColors.azureBlue }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Feather name="tool" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextContainer}>
                <ThemedText style={styles.headerTitle}>Service Repair</ThemedText>
                <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
                  {propertyName}
                </ThemedText>
                <ThemedText style={styles.headerAddress} numberOfLines={1}>
                  {propertyAddress}
                </ThemedText>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Repair Type *</ThemedText>
              <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                <Picker
                  selectedValue={repairType}
                  onValueChange={(value: string) => setRepairType(value)}
                  style={[styles.picker, { color: theme.text }]}
                >
                  <Picker.Item label="Select Repair Type" value="" color={theme.textSecondary} />
                  {REPAIR_TYPES.map((type) => (
                    <Picker.Item key={type} label={type} value={type} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Parts Used</ThemedText>
              <View style={styles.checklistContainer}>
                {PARTS_USED.map((part) => {
                  const isSelected = selectedParts.includes(part);
                  return (
                    <Pressable
                      key={part}
                      style={styles.checklistItem}
                      onPress={() => handleTogglePart(part)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: isSelected ? BrandColors.azureBlue : theme.border },
                          isSelected && { backgroundColor: BrandColors.azureBlue },
                        ]}
                      >
                        {isSelected ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
                      </View>
                      <ThemedText style={styles.checklistLabel}>{part}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Part Source</ThemedText>
              <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                <Picker
                  selectedValue={partSource}
                  onValueChange={(value: string) => setPartSource(value)}
                  style={[styles.picker, { color: theme.text }]}
                >
                  {PART_SOURCES.map((source) => (
                    <Picker.Item key={source} label={source} value={source} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Time Spent (minutes)</ThemedText>
              <View style={styles.timeControls}>
                <Pressable
                  style={[styles.timeButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => handleTimeChange(-5)}
                >
                  <Feather name="minus" size={20} color={theme.text} />
                </Pressable>
                <ThemedText style={styles.timeValue}>{timeSpent}</ThemedText>
                <Pressable
                  style={[styles.timeButton, { backgroundColor: theme.backgroundSecondary }]}
                  onPress={() => handleTimeChange(5)}
                >
                  <Feather name="plus" size={20} color={theme.text} />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Description</ThemedText>
              <View style={[styles.textAreaContainer, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.textArea, { color: theme.text }]}
                  placeholder="Describe the issue and repair work..."
                  placeholderTextColor={theme.textSecondary}
                  value={issueDescription}
                  onChangeText={setIssueDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                <Pressable style={styles.voiceButton} onPress={handleVoiceInput}>
                  <Feather name="mic" size={20} color={BrandColors.azureBlue} />
                </Pressable>
              </View>
            </View>

            <View style={styles.photosSection}>
              <ThemedText style={styles.inputLabel}>Before Photos</ThemedText>
              <View style={styles.photoPreviewRow}>
                {beforePhotos.length === 0 ? (
                  <ThemedText style={[styles.noPhotosText, { color: theme.textSecondary }]}>
                    No photos added
                  </ThemedText>
                ) : null}
              </View>
              <Pressable
                style={[styles.addPhotoButton, { backgroundColor: BrandColors.vividTangerine }]}
                onPress={handleAddBeforePhoto}
              >
                <Feather name="camera" size={18} color="#FFFFFF" />
                <ThemedText style={styles.addPhotoButtonText}>Add Before</ThemedText>
              </Pressable>
            </View>

            <View style={styles.photosSection}>
              <ThemedText style={styles.inputLabel}>After Photos</ThemedText>
              <View style={styles.photoPreviewRow}>
                {afterPhotos.length === 0 ? (
                  <ThemedText style={[styles.noPhotosText, { color: theme.textSecondary }]}>
                    No photos added
                  </ThemedText>
                ) : null}
              </View>
              <Pressable
                style={[styles.addPhotoButton, { backgroundColor: BrandColors.vividTangerine }]}
                onPress={handleAddAfterPhoto}
              >
                <Feather name="camera" size={18} color="#FFFFFF" />
                <ThemedText style={styles.addPhotoButtonText}>Add After</ThemedText>
              </Pressable>
            </View>

            <View style={styles.billableSection}>
              <View style={styles.billableRow}>
                <ThemedText style={styles.inputLabel}>Billable</ThemedText>
                <View style={styles.billableToggle}>
                  <ThemedText style={[styles.billableLabel, { color: theme.textSecondary }]}>
                    {billable ? 'Yes' : 'No'}
                  </ThemedText>
                  <Switch
                    value={billable}
                    onValueChange={(value) => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setBillable(value);
                    }}
                    trackColor={{ false: theme.border, true: BrandColors.success }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <BPButton
              variant="primary"
              onPress={handleSubmit}
              fullWidth
              disabled={!repairType}
            >
              Submit Service Repair
            </BPButton>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: Spacing.sm,
  },
  headerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  headerAddress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  checklistContainer: {
    gap: Spacing.sm,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
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
    fontSize: 15,
  },
  timeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  timeButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    fontSize: 24,
    fontWeight: '600',
    minWidth: 60,
    textAlign: 'center',
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  textArea: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 100,
  },
  voiceButton: {
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photosSection: {
    marginBottom: Spacing.lg,
  },
  photoPreviewRow: {
    marginBottom: Spacing.sm,
  },
  noPhotosText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addPhotoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  billableSection: {
    marginBottom: Spacing.lg,
  },
  billableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billableToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  billableLabel: {
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
