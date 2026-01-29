import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { DualVoiceInput } from '@/components/DualVoiceInput';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { submitWindyDayCleanup } from '@/lib/techOpsService';

interface WindyDayCleanupModalProps {
  visible: boolean;
  onClose: () => void;
  propertyName: string;
  propertyAddress: string;
  technicianName?: string;
}

export function WindyDayCleanupModal({
  visible,
  onClose,
  propertyName,
  propertyAddress,
  technicianName = 'Service Technician',
}: WindyDayCleanupModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await submitWindyDayCleanup({
        propertyName,
        propertyAddress,
        technicianName,
        description: notes.trim() || 'Windy day cleanup performed',
        photos: [], // TODO: Add photo support
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Success', 'Windy day cleanup submitted!', [
        { text: 'OK', onPress: onClose }
      ]);

      setNotes('');
    } catch (error) {
      console.error('Failed to submit windy day cleanup:', error);
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceRecordingComplete = (uri: string, duration: number) => {
    console.log('Voice recording saved:', uri, 'duration:', duration);
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
        <View style={[styles.modalContainer, { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.lg, maxHeight: windowHeight * 0.95 }]}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={[styles.headerIconContainer, { backgroundColor: BrandColors.tropicalTeal + '15' }]}>
                <Feather name="wind" size={24} color={BrandColors.tropicalTeal} />
              </View>
              <View>
                <ThemedText style={styles.headerTitle}>Windy Day Clean Up</ThemedText>
                <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                  Log debris removal work
                </ThemedText>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.propertyCard, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={[styles.propertyLabel, { color: BrandColors.azureBlue }]}>PROPERTY</ThemedText>
              <ThemedText style={styles.propertyName}>{propertyName}</ThemedText>
              <ThemedText style={[styles.propertyAddress, { color: theme.textSecondary }]}>
                {propertyAddress}
              </ThemedText>
              
              <View style={styles.propertyMetaRow}>
                <View style={styles.propertyMetaItem}>
                  <ThemedText style={[styles.metaLabel, { color: BrandColors.azureBlue }]}>Technician</ThemedText>
                  <ThemedText style={styles.metaValue}>{technicianName}</ThemedText>
                </View>
                <View style={styles.propertyMetaItem}>
                  <ThemedText style={[styles.metaLabel, { color: BrandColors.azureBlue }]}>Time</ThemedText>
                  <ThemedText style={styles.metaValue}>{currentTime}</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Notes (Optional)</ThemedText>
              <DualVoiceInput
                value={notes}
                onTextChange={setNotes}
                onAudioRecorded={handleVoiceRecordingComplete}
                placeholder="Describe the cleanup work done (e.g., leaves removed, debris cleared, skimmed pool)..."
              />
            </View>

            <View style={styles.photosSection}>
              <ThemedText style={styles.inputLabel}>Photos (Optional)</ThemedText>
              <View style={styles.photoButtons}>
                <Pressable
                  style={[styles.photoButton, { borderColor: BrandColors.azureBlue }]}
                  onPress={handleTakePhoto}
                >
                  <Feather name="camera" size={24} color={BrandColors.azureBlue} />
                  <ThemedText style={[styles.photoButtonText, { color: BrandColors.azureBlue }]}>
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
            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: BrandColors.azureBlue },
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="wind" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.submitButtonText}>Log Cleanup</ThemedText>
                </>
              )}
            </Pressable>
              onPress={handleSubmit}
            >
              <Feather name="wind" size={20} color="#FFFFFF" />
              <ThemedText style={styles.submitButtonText}>Log Cleanup</ThemedText>
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
  modalContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    minHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
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
  propertyCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  propertyLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  propertyAddress: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  propertyMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  propertyMetaItem: {},
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.vividTangerine,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  voiceButtonText: {
    color: '#FFFFFF',
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
    minHeight: 120,
  },
  photosSection: {
    marginBottom: Spacing.lg,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
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
  },
  submitButton: {
  },
  submitButtonDisabled: {
    opacity: 0.6,
    flexDirection: 'row',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    paddingVertical: Spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    borderRadius: BorderRadius.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
