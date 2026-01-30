import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { DualVoiceInput } from '@/components/DualVoiceInput';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { apiRequest, extractItems, type Page } from '@/lib/query-client';

type AssignmentPriority = 'LOW' | 'MEDIUM' | 'HIGH';

interface Property {
  id: number;
  name: string;
  address: string;
}

interface Technician {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CreateAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateAssignmentModal({ visible, onClose }: CreateAssignmentModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [priority, setPriority] = useState<AssignmentPriority>('MEDIUM');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isAssistAssignment, setIsAssistAssignment] = useState(false);
  const [techNeedingHelp, setTechNeedingHelp] = useState('');

  const { data: propertiesData, isLoading: propertiesLoading, error: propertiesError } = useQuery<Page<Property>>({
    queryKey: ['/api/properties'],
    enabled: visible,
  });

  const { data: techniciansData, isLoading: techniciansLoading, error: techniciansError } = useQuery<Page<Technician>>({
    queryKey: ['/api/technicians'],
    enabled: visible,
  });

  const properties = useMemo(() => extractItems(propertiesData, 'create-modal-properties'), [propertiesData]);
  const technicians = useMemo(() => extractItems(techniciansData, 'create-modal-technicians'), [techniciansData]);

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: {
      propertyId: number;
      technicianId: number;
      title: string;
      type: string;
      priority: AssignmentPriority;
      scheduledDate?: string;
      notes?: string;
    }) => {
      const response = await apiRequest('POST', '/api/assignments', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments/created'] });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      resetForm();
      onClose();
    },
  });

  const resetForm = () => {
    setTitle('');
    setSelectedTechnician('');
    setSelectedProperty('');
    setPriority('MEDIUM');
    setScheduledDate('');
    setNotes('');
    setIsAssistAssignment(false);
    setTechNeedingHelp('');
  };

  const handleSubmit = () => {
    if (!selectedProperty || !selectedTechnician || !title.trim()) return;

    createAssignmentMutation.mutate({
      propertyId: parseInt(selectedProperty, 10),
      technicianId: parseInt(selectedTechnician, 10),
      title: title.trim(),
      type: 'assignment',
      priority,
      scheduledDate: scheduledDate.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const handleAssistToggle = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsAssistAssignment(!isAssistAssignment);
    if (isAssistAssignment) {
      setTechNeedingHelp('');
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

  const isFormValid = title.trim() && selectedTechnician && selectedProperty && 
    (!isAssistAssignment || (isAssistAssignment && techNeedingHelp && techNeedingHelp !== selectedTechnician));
  
  const availableTechsToHelp = technicians.filter(tech => String(tech.id) !== selectedTechnician);
  const selectedHelperName = technicians.find(t => String(t.id) === selectedTechnician)?.name || '';
  const selectedNeedingHelpName = technicians.find(t => String(t.id) === techNeedingHelp)?.name || '';

  const isLoading = propertiesLoading || techniciansLoading;
  const hasError = propertiesError || techniciansError;

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
            { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.lg, maxHeight: windowHeight * 0.9 },
          ]}
        >
          <View style={[styles.header, { backgroundColor: BrandColors.azureBlue }]}>
            <ThemedText style={styles.headerTitle}>Create Assignment</ThemedText>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BrandColors.azureBlue} />
              <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
                Loading...
              </ThemedText>
            </View>
          ) : hasError ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={48} color={BrandColors.danger} />
              <ThemedText style={[styles.errorText, { color: theme.text }]}>
                Failed to load data
              </ThemedText>
              <ThemedText style={[styles.errorSubtext, { color: theme.textSecondary }]}>
                Please try again later
              </ThemedText>
            </View>
          ) : (
            <>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Title *</ThemedText>
                  <View style={[styles.textInputContainer, { borderColor: theme.border }]}>
                    <TextInput
                      style={[styles.textInput, { color: theme.text }]}
                      placeholder="Enter assignment title..."
                      placeholderTextColor={theme.textSecondary}
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>
                </View>

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>
                    {isAssistAssignment ? 'Helper Technician *' : 'Technician *'}
                  </ThemedText>
                  <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                    <Picker
                      selectedValue={selectedTechnician}
                      onValueChange={(value: string) => {
                        setSelectedTechnician(value);
                        if (value === techNeedingHelp) {
                          setTechNeedingHelp('');
                        }
                      }}
                      style={styles.picker}
                      itemStyle={{ color: '#000000', fontSize: 16 }}
                    >
                      <Picker.Item label="Select technician..." value="" color="#666666" />
                      {technicians.map((tech) => (
                        <Picker.Item key={tech.id} label={tech.name} value={String(tech.id)} color="#000000" />
                      ))}
                    </Picker>
                  </View>
                </View>

                <Pressable
                  style={[
                    styles.assistToggle,
                    {
                      backgroundColor: isAssistAssignment ? BrandColors.vividTangerine : theme.backgroundSecondary,
                      borderColor: BrandColors.vividTangerine,
                    },
                  ]}
                  onPress={handleAssistToggle}
                >
                  <Feather
                    name="users"
                    size={20}
                    color={isAssistAssignment ? '#FFFFFF' : BrandColors.vividTangerine}
                  />
                  <ThemedText
                    style={[
                      styles.assistToggleText,
                      { color: isAssistAssignment ? '#FFFFFF' : BrandColors.vividTangerine },
                    ]}
                  >
                    Assign to Help Another Tech
                  </ThemedText>
                  <Feather
                    name={isAssistAssignment ? 'check-circle' : 'circle'}
                    size={20}
                    color={isAssistAssignment ? '#FFFFFF' : BrandColors.vividTangerine}
                  />
                </Pressable>

                {isAssistAssignment ? (
                  <View style={styles.inputSection}>
                    <ThemedText style={styles.inputLabel}>Technician Needing Help *</ThemedText>
                    <View style={[styles.pickerContainer, { borderColor: BrandColors.vividTangerine }]}>
                      <Picker
                        selectedValue={techNeedingHelp}
                        onValueChange={(value: string) => setTechNeedingHelp(value)}
                        style={styles.picker}
                        itemStyle={{ color: '#000000', fontSize: 16 }}
                      >
                        <Picker.Item label="Select technician to assist..." value="" color="#666666" />
                        {availableTechsToHelp.map((tech) => (
                          <Picker.Item key={tech.id} label={tech.name} value={String(tech.id)} color="#000000" />
                        ))}
                      </Picker>
                    </View>
                    {selectedTechnician && techNeedingHelp ? (
                      <View style={[styles.assistSummary, { backgroundColor: `${BrandColors.vividTangerine}15` }]}>
                        <Feather name="arrow-right" size={16} color={BrandColors.vividTangerine} />
                        <ThemedText style={[styles.assistSummaryText, { color: theme.text }]}>
                          <ThemedText style={{ fontWeight: '600' }}>{selectedHelperName}</ThemedText>
                          {' will assist '}
                          <ThemedText style={{ fontWeight: '600' }}>{selectedNeedingHelpName}</ThemedText>
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.inputSection}>
                  <ThemedText style={styles.inputLabel}>Property *</ThemedText>
                  <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                    <Picker
                      selectedValue={selectedProperty}
                      onValueChange={(value: string) => setSelectedProperty(value)}
                      style={styles.picker}
                      itemStyle={{ color: '#000000', fontSize: 16 }}
                    >
                      <Picker.Item label="Select property..." value="" color="#666666" />
                      {properties.map((prop) => (
                        <Picker.Item key={prop.id} label={prop.name} value={String(prop.id)} color="#000000" />
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
                  <ThemedText style={styles.inputLabel}>Scheduled Date</ThemedText>
                  <View style={[styles.textInputContainer, { borderColor: theme.border }]}>
                    <TextInput
                      style={[styles.textInput, { color: theme.text }]}
                      placeholder="YYYY-MM-DD (e.g., 2026-01-27)"
                      placeholderTextColor={theme.textSecondary}
                      value={scheduledDate}
                      onChangeText={setScheduledDate}
                    />
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

                {createAssignmentMutation.error ? (
                  <View style={[styles.mutationError, { backgroundColor: `${BrandColors.danger}15` }]}>
                    <Feather name="alert-triangle" size={16} color={BrandColors.danger} />
                    <ThemedText style={[styles.mutationErrorText, { color: BrandColors.danger }]}>
                      Failed to create assignment. Please try again.
                    </ThemedText>
                  </View>
                ) : null}
              </ScrollView>

              <View style={styles.footer}>
                <BPButton
                  variant="primary"
                  onPress={handleSubmit}
                  fullWidth
                  disabled={!isFormValid || createAssignmentMutation.isPending}
                >
                  {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                </BPButton>
              </View>
            </>
          )}
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
    overflow: 'hidden',
    minHeight: '70%',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: 17,
    fontWeight: '600',
  },
  errorSubtext: {
    marginTop: Spacing.sm,
    fontSize: 14,
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
  assistToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
  },
  assistToggleText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  assistSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  assistSummaryText: {
    fontSize: 14,
    flex: 1,
  },
  mutationError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  mutationErrorText: {
    fontSize: 14,
    flex: 1,
  },
});
