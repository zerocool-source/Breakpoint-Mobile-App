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
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface RepairsNeededModalProps {
  visible: boolean;
  onClose: () => void;
  propertyName: string;
  propertyAddress: string;
  technicianName?: string;
}

export function RepairsNeededModal({
  visible,
  onClose,
  propertyName,
  propertyAddress,
  technicianName = 'John Smith',
}: RepairsNeededModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [isUrgent, setIsUrgent] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);

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
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={[styles.header, { backgroundColor: BrandColors.vividTangerine }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Feather name="alert-triangle" size={24} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.headerTitle}>Repairs Needed</ThemedText>
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

            <Pressable
              style={styles.urgentCheckbox}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setIsUrgent(!isUrgent);
              }}
            >
              <View style={[
                styles.checkbox,
                { borderColor: isUrgent ? BrandColors.vividTangerine : theme.border },
                isUrgent && { backgroundColor: BrandColors.vividTangerine },
              ]}>
                {isUrgent && <Feather name="check" size={14} color="#FFFFFF" />}
              </View>
              <Feather name="alert-triangle" size={18} color={BrandColors.vividTangerine} />
              <ThemedText style={styles.urgentLabel}>Mark as Urgent</ThemedText>
            </Pressable>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Describe the Issue *</ThemedText>
              <View style={[styles.textAreaContainer, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.textArea, { color: theme.text }]}
                  placeholder="Describe the repair needed..."
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
              disabled={!issueDescription.trim()}
            >
              Submit Repair Request
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
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '90%',
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
  urgentCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
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
