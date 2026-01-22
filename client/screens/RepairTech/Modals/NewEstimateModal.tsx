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

interface NewEstimateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function NewEstimateModal({ visible, onClose, onSubmit }: NewEstimateModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [status, setStatus] = useState('Draft');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

  const estimateNumber = `EST-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSubmit({ estimateNumber, status, location, description, photos });
    onClose();
  };

  const handleSaveDraft = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSubmit({ estimateNumber, status: 'Draft', location, description, photos });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface, maxHeight: windowHeight * 0.95 }]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Feather name="chevron-left" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={styles.title}>New Estimate</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <View style={[styles.estimateNumberBadge, { backgroundColor: BrandColors.azureBlue + '15' }]}>
            <ThemedText style={[styles.estimateNumberText, { color: BrandColors.azureBlue }]}>
              {estimateNumber}
            </ThemedText>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.row}>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>STATUS</ThemedText>
                <View style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                  <ThemedText>{status}</ThemedText>
                  <Feather name="chevron-down" size={18} color={theme.textSecondary} />
                </View>
              </View>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>REPAIR TECH</ThemedText>
                <View style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                  <ThemedText>Rick Jacobs</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>SERVICE TECH</ThemedText>
                <View style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                  <ThemedText style={{ color: theme.textSecondary }}></ThemedText>
                </View>
              </View>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>REPORTED DATE</ThemedText>
                <View style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                  <ThemedText>{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</ThemedText>
                  <Feather name="calendar" size={18} color={theme.textSecondary} />
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>LOCATION</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                placeholder="Property name"
                placeholderTextColor={theme.textSecondary}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>QUOTE DESCRIPTION</ThemedText>
                <Pressable style={styles.voiceButton}>
                  <Feather name="mic" size={16} color={BrandColors.vividTangerine} />
                  <ThemedText style={[styles.voiceText, { color: BrandColors.vividTangerine }]}>Voice</ThemedText>
                </Pressable>
              </View>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                placeholder="Describe the job, what needs to be done, findings from inspection..."
                placeholderTextColor={theme.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>PHOTOS</ThemedText>
                <Pressable style={styles.addPhotoButton}>
                  <Feather name="camera" size={16} color={BrandColors.vividTangerine} />
                  <ThemedText style={[styles.addPhotoText, { color: BrandColors.vividTangerine }]}>Add Photo</ThemedText>
                </Pressable>
              </View>
              <View style={[styles.photoArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <Feather name="camera" size={32} color={theme.textSecondary} />
                <ThemedText style={[styles.noPhotosText, { color: theme.textSecondary }]}>No photos attached</ThemedText>
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.lineItemsTitle}>Product or Service</ThemedText>
                <Pressable>
                  <ThemedText style={[styles.addLineText, { color: BrandColors.azureBlue }]}>+ Add Line</ThemedText>
                </Pressable>
              </View>
              <View style={[styles.lineItemsHeader, { borderBottomColor: theme.border }]}>
                <ThemedText style={[styles.lineItemCol, { color: theme.textSecondary, flex: 0.5 }]}>#</ThemedText>
                <ThemedText style={[styles.lineItemCol, { color: theme.textSecondary, flex: 2 }]}>PRODUCT/SKU</ThemedText>
                <ThemedText style={[styles.lineItemCol, { color: theme.textSecondary, flex: 1 }]}>QTY</ThemedText>
                <ThemedText style={[styles.lineItemCol, { color: theme.textSecondary, flex: 1 }]}>RATE</ThemedText>
                <ThemedText style={[styles.lineItemCol, { color: theme.textSecondary, flex: 1 }]}>AMOUNT</ThemedText>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.surface }]}>
            <Pressable
              style={[styles.sendButton, { backgroundColor: BrandColors.vividTangerine }]}
              onPress={handleSubmit}
            >
              <ThemedText style={styles.sendButtonText}>Send Estimate</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.draftButton, { borderColor: theme.border }]}
              onPress={handleSaveDraft}
            >
              <View style={[styles.draftHandle, { backgroundColor: theme.textSecondary }]} />
              <ThemedText style={styles.draftButtonText}>Save Draft</ThemedText>
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
    paddingVertical: Spacing.md,
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
  estimateNumberBadge: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  estimateNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
  field: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    letterSpacing: 0.5,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
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
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 15,
  },
  textArea: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 100,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voiceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  photoArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  noPhotosText: {
    marginTop: Spacing.sm,
    fontSize: 14,
  },
  lineItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addLineText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lineItemsHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    marginTop: Spacing.sm,
  },
  lineItemCol: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sendButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  draftButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  draftHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
