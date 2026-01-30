import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
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
import { techOpsRequest } from '@/lib/query-client';
import { useAuth } from '@/context/AuthContext';

interface ChemicalsDropoffModalProps {
  visible: boolean;
  onClose: () => void;
  propertyId?: string;
  propertyName: string;
  propertyAddress: string;
}

export function ChemicalsDropoffModal({
  visible,
  onClose,
  propertyId,
  propertyName,
  propertyAddress,
}: ChemicalsDropoffModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const { user } = useAuth();

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleSubmit = async () => {
    if (!propertyId) {
      Alert.alert('Property Required', 'Property information is missing.');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please log in before logging a dropoff.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    const payload = {
      entryType: 'chemicals_dropoff',
      description: notes.trim() || 'Chemicals dropped off',
      priority: 'normal',
      status: 'completed',
      propertyId: propertyId,
      propertyName: propertyName,
      bodyOfWater: propertyAddress,
      technicianId: user.id,
      technicianName: user.name || user.email || 'Service Technician',
      notes: notes.trim(),
      droppedOffAt: new Date().toISOString(),
    };

    console.log('[ChemicalsDropoff] Submitting to Tech Ops:', payload);

    try {
      await techOpsRequest('/api/tech-ops', payload);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Dropoff Logged',
        'Chemical dropoff has been recorded.',
        [{ text: 'OK', onPress: () => {} }]
      );
      
      setNotes('');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[ChemicalsDropoff] Submission failed:', errorMessage);
      Alert.alert('Submission Failed', `Could not log dropoff: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceRecordingComplete = (uri: string, duration: number) => {
    console.log('Voice recording saved:', uri, 'duration:', duration);
  };

  const handleCancel = () => {
    setNotes('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.lg, maxHeight: windowHeight * 0.95 }]}>
          <View style={[styles.header, { backgroundColor: BrandColors.emerald }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Feather name="truck" size={24} color="#FFFFFF" />
              </View>
              <View>
                <ThemedText style={styles.headerTitle}>Chemicals Dropped Off</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Log delivery confirmation</ThemedText>
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
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.propertyCard, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={[styles.propertyLabel, { color: BrandColors.emerald }]}>PROPERTY</ThemedText>
              <ThemedText style={styles.propertyName}>{propertyName}</ThemedText>
              <ThemedText style={[styles.propertyAddress, { color: theme.textSecondary }]}>
                {propertyAddress}
              </ThemedText>
              
              <View style={styles.propertyMetaRow}>
                <View style={styles.propertyMetaItem}>
                  <ThemedText style={[styles.metaLabel, { color: BrandColors.emerald }]}>Date</ThemedText>
                  <ThemedText style={styles.metaValue}>{currentDate}</ThemedText>
                </View>
                <View style={styles.propertyMetaItem}>
                  <ThemedText style={[styles.metaLabel, { color: BrandColors.emerald }]}>Time</ThemedText>
                  <ThemedText style={styles.metaValue}>{currentTime}</ThemedText>
                </View>
              </View>
            </View>

            <View style={[styles.confirmationBanner, { backgroundColor: BrandColors.emerald + '15' }]}>
              <Feather name="check-circle" size={24} color={BrandColors.emerald} />
              <ThemedText style={[styles.confirmationText, { color: BrandColors.emerald }]}>
                Confirming chemical delivery at this location
              </ThemedText>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Notes (Optional)</ThemedText>
              <DualVoiceInput
                value={notes}
                onTextChange={setNotes}
                onAudioRecorded={handleVoiceRecordingComplete}
                placeholder="Add any notes about the dropoff (e.g., location left, quantity, special instructions)..."
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.cancelButton, { backgroundColor: theme.backgroundSecondary }]}
              onPress={handleCancel}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: BrandColors.emerald },
                isSubmitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              ) : (
                <Feather name="check" size={20} color="#FFFFFF" />
              )}
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? 'Logging...' : 'Confirm Dropoff'}
              </ThemedText>
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
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: Spacing.lg,
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
  confirmationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  confirmationText: {
    flex: 1,
    fontSize: 14,
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
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  cancelButton: {
    flex: 0.4,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 0.6,
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
