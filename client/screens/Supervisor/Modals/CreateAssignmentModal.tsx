import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { DualVoiceInput } from '@/components/DualVoiceInput';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { mockTechnicians, mockProperties, type AssignmentPriority } from '@/lib/supervisorMockData';

interface CreateAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateAssignmentModal({ visible, onClose }: CreateAssignmentModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [assignmentType, setAssignmentType] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [priority, setPriority] = useState<AssignmentPriority>('MEDIUM');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setAssignmentType('');
    setSelectedTechnician('');
    setSelectedProperty('');
    setPriority('MEDIUM');
    setNotes('');
    onClose();
  };

  const handleTakePhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleFromGallery = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePrioritySelect = (p: AssignmentPriority) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPriority(p);
  };

  const getPriorityColor = (p: AssignmentPriority) => {
    switch (p) {
      case 'HIGH':
        return BrandColors.danger;
      case 'MEDIUM':
        return BrandColors.vividTangerine;
      case 'LOW':
        return BrandColors.azureBlue;
      default:
        return theme.textSecondary;
    }
  };

  const isFormValid = assignmentType.trim() && selectedTechnician && selectedProperty;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.lg },
          ]}
        >
          <View style={[styles.header, { backgroundColor: BrandColors.azureBlue }]}>
            <ThemedText style={styles.headerTitle}>Create Assignment</ThemedText>
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
              <ThemedText style={styles.inputLabel}>Assignment Type *</ThemedText>
              <View style={[styles.textInputContainer, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.textInput, { color: theme.text }]}
                  placeholder="Enter assignment type..."
                  placeholderTextColor={theme.textSecondary}
                  value={assignmentType}
                  onChangeText={setAssignmentType}
                />
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Technician *</ThemedText>
              <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                <Picker
                  selectedValue={selectedTechnician}
                  onValueChange={(value: string) => setSelectedTechnician(value)}
                  style={[styles.picker, { color: theme.text }]}
                >
                  <Picker.Item label="Select technician..." value="" color={theme.textSecondary} />
                  {mockTechnicians.map((tech) => (
                    <Picker.Item key={tech.id} label={tech.name} value={tech.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Property *</ThemedText>
              <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                <Picker
                  selectedValue={selectedProperty}
                  onValueChange={(value: string) => setSelectedProperty(value)}
                  style={[styles.picker, { color: theme.text }]}
                >
                  <Picker.Item label="Select property..." value="" color={theme.textSecondary} />
                  {mockProperties.map((prop) => (
                    <Picker.Item key={prop.id} label={prop.name} value={prop.id} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Priority</ThemedText>
              <View style={styles.priorityButtons}>
                {(['LOW', 'MEDIUM', 'HIGH'] as AssignmentPriority[]).map((p) => (
                  <Pressable
                    key={p}
                    style={[
                      styles.priorityButton,
                      {
                        backgroundColor: priority === p ? getPriorityColor(p) : theme.backgroundSecondary,
                        borderColor: getPriorityColor(p),
                      },
                    ]}
                    onPress={() => handlePrioritySelect(p)}
                  >
                    <ThemedText
                      style={[
                        styles.priorityButtonText,
                        { color: priority === p ? '#FFFFFF' : getPriorityColor(p) },
                      ]}
                    >
                      {p}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Notes</ThemedText>
              <DualVoiceInput
                value={notes}
                onTextChange={setNotes}
                placeholder="Add any notes or instructions..."
              />
            </View>

            <View style={styles.photosSection}>
              <ThemedText style={styles.inputLabel}>Photos</ThemedText>
              <View style={styles.photoButtons}>
                <Pressable
                  style={[styles.photoButton, { borderColor: theme.border }]}
                  onPress={handleTakePhoto}
                >
                  <Feather name="camera" size={24} color={theme.textSecondary} />
                  <ThemedText style={[styles.photoButtonText, { color: theme.textSecondary }]}>
                    Take Photo
                  </ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.photoButton, { borderColor: theme.border }]}
                  onPress={handleFromGallery}
                >
                  <Feather name="image" size={24} color={theme.textSecondary} />
                  <ThemedText style={[styles.photoButtonText, { color: theme.textSecondary }]}>
                    Gallery
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <BPButton
              variant="primary"
              onPress={handleSubmit}
              fullWidth
              disabled={!isFormValid}
            >
              Create Assignment
            </BPButton>
          </View>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
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
  textInputContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  textInput: {
    padding: Spacing.md,
    fontSize: 15,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  textArea: {
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 100,
  },
  photosSection: {
    marginBottom: Spacing.lg,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoButton: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  photoButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
