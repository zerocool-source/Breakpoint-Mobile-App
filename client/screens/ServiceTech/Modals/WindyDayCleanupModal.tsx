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
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

interface WindyDayCleanupModalProps {
  visible: boolean;
  onClose: () => void;
  propertyName: string;
  propertyAddress: string;
  technicianName?: string;
}

const CLEANUP_TASKS = [
  'Extra debris removal',
  'Extended vacuuming',
  'Filter cleaning',
  'Surface skimming',
  'Deck cleaning',
  'Furniture reset',
];

const CONDITION_OPTIONS = ['Light wind', 'Moderate wind', 'Heavy wind', 'Storm debris'];

export function WindyDayCleanupModal({
  visible,
  onClose,
  propertyName,
  propertyAddress,
  technicianName = 'John Smith',
}: WindyDayCleanupModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [timeSpent, setTimeSpent] = useState(15);
  const [condition, setCondition] = useState('Moderate wind');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const handleToggleTask = (task: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTasks((prev) =>
      prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]
    );
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

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

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
          <View style={[styles.header, { backgroundColor: BrandColors.tropicalTeal }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Feather name="wind" size={24} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.headerTitle}>Windy Day Clean Up</ThemedText>
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
            <View style={[styles.propertyCard, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.propertyName}>{propertyName}</ThemedText>
              <View style={styles.propertyRow}>
                <Feather name="map-pin" size={14} color={theme.textSecondary} />
                <ThemedText style={[styles.propertyAddress, { color: theme.textSecondary }]}>
                  {propertyAddress}
                </ThemedText>
              </View>
              <View style={styles.propertyMetaRow}>
                <View style={styles.propertyMetaItem}>
                  <Feather name="user" size={14} color={theme.textSecondary} />
                  <ThemedText style={[styles.propertyMetaText, { color: theme.textSecondary }]}>
                    {technicianName}
                  </ThemedText>
                </View>
                <View style={styles.propertyMetaItem}>
                  <Feather name="clock" size={14} color={theme.textSecondary} />
                  <ThemedText style={[styles.propertyMetaText, { color: theme.textSecondary }]}>
                    {currentTime}
                  </ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Conditions</ThemedText>
              <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                <Picker
                  selectedValue={condition}
                  onValueChange={(value: string) => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setCondition(value);
                  }}
                  style={[styles.picker, { color: theme.text }]}
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Cleanup Tasks</ThemedText>
              <View style={styles.checklistContainer}>
                {CLEANUP_TASKS.map((task) => {
                  const isSelected = selectedTasks.includes(task);
                  return (
                    <Pressable
                      key={task}
                      style={styles.checklistItem}
                      onPress={() => handleToggleTask(task)}
                    >
                      <View
                        style={[
                          styles.checkbox,
                          { borderColor: isSelected ? BrandColors.tropicalTeal : theme.border },
                          isSelected && { backgroundColor: BrandColors.tropicalTeal },
                        ]}
                      >
                        {isSelected ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
                      </View>
                      <ThemedText style={styles.checklistLabel}>{task}</ThemedText>
                    </Pressable>
                  );
                })}
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
              <ThemedText style={styles.inputLabel}>Notes (Optional)</ThemedText>
              <View style={[styles.textAreaContainer, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.textArea, { color: theme.text }]}
                  placeholder="Add any notes about the cleanup..."
                  placeholderTextColor={theme.textSecondary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <Pressable style={styles.voiceButton} onPress={handleVoiceInput}>
                  <Feather name="mic" size={20} color={BrandColors.azureBlue} />
                </Pressable>
              </View>
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
                    From Gallery
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
            >
              Log Cleanup
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  propertyCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  propertyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  propertyAddress: {
    fontSize: 14,
  },
  propertyMetaRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  propertyMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  propertyMetaText: {
    fontSize: 13,
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
    minHeight: 80,
  },
  voiceButton: {
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
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
