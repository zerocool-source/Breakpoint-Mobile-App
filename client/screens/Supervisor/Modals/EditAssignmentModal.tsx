import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { DualVoiceInput } from '@/components/DualVoiceInput';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { apiRequest } from '@/lib/query-client';

type AssignmentStatus = 'pending' | 'in_progress' | 'completed' | 'need_assistance';

interface EditAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  assignment: {
    id: string;
    title: string;
    status: string;
    priority: string;
    notes: string | null;
    scheduledDate: string | null;
    property: { name: string };
    technician: { name: string };
  } | null;
}

const STATUS_OPTIONS: { value: AssignmentStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'need_assistance', label: 'Need Assistance' },
];

export function EditAssignmentModal({ visible, onClose, assignment }: EditAssignmentModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<AssignmentStatus>('pending');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (assignment) {
      setStatus(assignment.status as AssignmentStatus);
      setNotes(assignment.notes ?? '');
    }
  }, [assignment]);

  const updateAssignmentMutation = useMutation({
    mutationFn: async (data: { status: AssignmentStatus; notes: string | null }) => {
      if (!assignment) throw new Error('No assignment selected');
      const response = await apiRequest('PATCH', `/api/assignments/${assignment.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments/created'] });
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!assignment) return;

    updateAssignmentMutation.mutate({
      status,
      notes: notes.trim() || null,
    });
  };

  const getStatusColor = (s: AssignmentStatus) => {
    switch (s) {
      case 'completed':
        return BrandColors.emerald;
      case 'pending':
        return BrandColors.vividTangerine;
      case 'in_progress':
        return BrandColors.azureBlue;
      case 'need_assistance':
        return BrandColors.danger;
      default:
        return theme.textSecondary;
    }
  };

  if (!assignment) return null;

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
            <ThemedText style={styles.headerTitle}>Edit Assignment</ThemedText>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.readOnlySection, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={[styles.assignmentTitle, { color: theme.text }]}>
                {assignment.title}
              </ThemedText>
              
              <View style={styles.infoRow}>
                <Feather name="user" size={14} color={BrandColors.azureBlue} />
                <ThemedText style={[styles.infoText, { color: BrandColors.azureBlue }]}>
                  {assignment.technician.name}
                </ThemedText>
              </View>
              
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={14} color={theme.textSecondary} />
                <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
                  {assignment.property.name}
                </ThemedText>
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Status</ThemedText>
              <View style={[styles.pickerContainer, { borderColor: getStatusColor(status) }]}>
                <Picker
                  selectedValue={status}
                  onValueChange={(value: AssignmentStatus) => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setStatus(value);
                  }}
                  style={styles.picker}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <Picker.Item
                      key={option.value}
                      label={option.label}
                      value={option.value}
                    />
                  ))}
                </Picker>
              </View>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                <ThemedText style={[styles.statusText, { color: getStatusColor(status) }]}>
                  {STATUS_OPTIONS.find(o => o.value === status)?.label}
                </ThemedText>
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

            {updateAssignmentMutation.error ? (
              <View style={[styles.mutationError, { backgroundColor: `${BrandColors.danger}15` }]}>
                <Feather name="alert-triangle" size={16} color={BrandColors.danger} />
                <ThemedText style={[styles.mutationErrorText, { color: BrandColors.danger }]}>
                  Failed to update assignment. Please try again.
                </ThemedText>
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <BPButton
              variant="primary"
              onPress={handleSubmit}
              fullWidth
              disabled={updateAssignmentMutation.isPending}
            >
              {updateAssignmentMutation.isPending ? 'Saving...' : 'Save Changes'}
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
    overflow: 'hidden',
    minHeight: '50%',
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
  readOnlySection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: 14,
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
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
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
