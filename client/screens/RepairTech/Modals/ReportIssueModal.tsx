import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface ReportIssueModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function ReportIssueModal({ visible, onClose, onSubmit }: ReportIssueModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [property, setProperty] = useState('');
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Normal');

  const handleSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSubmit({ property, issueType, description, priority });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface, maxHeight: windowHeight * 0.9 }]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Feather name="chevron-left" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={styles.title}>Report Issue</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                Property <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <Pressable style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <ThemedText style={{ color: property ? theme.text : theme.textSecondary }}>
                  {property || 'Select property...'}
                </ThemedText>
                <Feather name="chevron-down" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                Issue Type <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <Pressable style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <ThemedText style={{ color: issueType ? theme.text : theme.textSecondary }}>
                  {issueType || 'Select issue type...'}
                </ThemedText>
                <Feather name="chevron-down" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                Description <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                placeholder="Describe the issue in detail..."
                placeholderTextColor={theme.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Priority Level</ThemedText>
              <Pressable style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <ThemedText style={{ color: theme.text }}>{priority}</ThemedText>
                <Feather name="chevron-down" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Photos (optional)</ThemedText>
              <Pressable style={[styles.photoArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <Feather name="camera" size={24} color={theme.textSecondary} />
                <ThemedText style={[styles.addPhotosText, { color: theme.textSecondary }]}>Add Photos</ThemedText>
              </Pressable>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.surface }]}>
            <Pressable
              style={[styles.submitButton, { backgroundColor: BrandColors.danger }]}
              onPress={handleSubmit}
            >
              <Feather name="flag" size={18} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              <ThemedText style={styles.submitButtonText}>Submit Issue Report</ThemedText>
            </Pressable>
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
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.large,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cancelText: {
    color: BrandColors.azureBlue,
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  placeholder: {
    width: 70,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  required: {
    color: BrandColors.danger,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  textArea: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 120,
  },
  photoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: Spacing.sm,
  },
  addPhotosText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
