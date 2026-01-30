import React, { useState, useEffect } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { DualVoiceInput } from '@/components/DualVoiceInput';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { techOpsRequest } from '@/lib/query-client';
import { useAuth } from '@/context/AuthContext';

interface PropertyOption {
  id: string;
  name: string;
  address: string;
}

interface RepairsNeededModalProps {
  visible: boolean;
  onClose: () => void;
  propertyName: string;
  propertyAddress: string;
  technicianName?: string;
  properties?: PropertyOption[];
}

export function RepairsNeededModal({
  visible,
  onClose,
  propertyName,
  propertyAddress,
  technicianName = 'Service Technician',
  properties,
}: RepairsNeededModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const { user } = useAuth();

  const [isUrgent, setIsUrgent] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProperty = properties?.find(p => p.id === selectedPropertyId);
  const displayPropertyName = properties ? (selectedProperty?.name || 'Select Property') : propertyName;
  const displayPropertyAddress = properties ? (selectedProperty?.address || '') : propertyAddress;

  useEffect(() => {
    if (visible && properties && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId('');
    }
  }, [visible, properties]);

  const handleSubmit = async () => {
    const propId = properties ? selectedPropertyId : 'default';
    const propName = displayPropertyName;
    
    if (!propId || (properties && !selectedPropertyId)) {
      Alert.alert('Property Required', 'Please select a property before submitting a repair request.');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please log in before submitting a repair request.');
      return;
    }
    
    if (issueDescription.trim().length < 3 && !audioRecording) {
      Alert.alert('Description Required', 'Please describe the issue or record an audio message.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    const payload = {
      entryType: 'repairs_needed',
      description: issueDescription.trim() || '[Audio message attached]',
      priority: isUrgent ? 'urgent' : 'normal',
      status: 'pending',
      propertyId: propId,
      propertyName: propName,
      bodyOfWater: displayPropertyAddress || 'Main Pool',
      technicianId: user.id.toString(),
      technicianName: technicianName || user.name || 'Technician',
      hasAudio: !!audioRecording,
      audioUri: audioRecording?.uri,
    };

    if (__DEV__) {
      console.log('[RepairsNeeded] Submitting to Tech Ops:', payload);
    }

    try {
      await techOpsRequest('/api/tech-ops', payload);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Report Submitted',
        'Your repair request has been sent to the office.',
        [{ text: 'OK', onPress: () => {} }]
      );
      
      setIssueDescription('');
      setIsUrgent(false);
      setAudioRecording(null);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[RepairsNeeded] Submission failed:', errorMessage);
      
      // Provide user-friendly error messages
      let userMessage = 'Could not send repair request. ';
      if (errorMessage.includes('503') || errorMessage.includes('unavailable') || errorMessage.includes('500')) {
        userMessage = 'The repair reporting system is temporarily down. Please try again in a few minutes, or contact the office directly.';
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
        userMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else {
        userMessage = `Could not send repair request: ${errorMessage}`;
      }
      
      Alert.alert('Submission Failed', userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [audioRecording, setAudioRecording] = useState<{ uri: string; duration: number } | null>(null);

  const handleVoiceRecordingComplete = (uri: string, duration: number) => {
    setAudioRecording({ uri, duration });
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
        <View style={[styles.modalContainer, { backgroundColor: theme.surface, maxHeight: windowHeight * 0.90 }]}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Feather name="alert-triangle" size={24} color={BrandColors.vividTangerine} />
              </View>
              <View>
                <ThemedText style={styles.headerTitle}>Repairs Needed</ThemedText>
                <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                  Report a repair issue
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
            <View style={styles.propertySection}>
              <ThemedText style={styles.sectionLabel}>Select Property</ThemedText>
              {properties ? (
                <View style={[styles.pickerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Picker
                    selectedValue={selectedPropertyId}
                    onValueChange={(value) => setSelectedPropertyId(value)}
                    style={styles.picker}
                    dropdownIconColor={theme.text}
                    itemStyle={{ color: '#000000', fontSize: 16 }}
                  >
                    <Picker.Item label="Select a property..." value="" color="#000000" />
                    {properties.map((prop) => (
                      <Picker.Item key={prop.id} label={prop.name} value={prop.id} color="#000000" />
                    ))}
                  </Picker>
                </View>
              ) : (
                <>
                  <ThemedText style={styles.propertyName}>{propertyName}</ThemedText>
                  <ThemedText style={[styles.propertyAddress, { color: theme.textSecondary }]}>
                    {propertyAddress}
                  </ThemedText>
                </>
              )}
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>Technician</ThemedText>
                <ThemedText style={styles.metaValue}>{technicianName}</ThemedText>
              </View>
              <View style={styles.metaItem}>
                <ThemedText style={[styles.metaLabel, { color: theme.textSecondary }]}>Time</ThemedText>
                <ThemedText style={styles.metaValue}>{currentTime}</ThemedText>
              </View>
            </View>

            <Pressable 
              style={[styles.urgentCard, { borderColor: isUrgent ? BrandColors.vividTangerine : theme.border }]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setIsUrgent(!isUrgent);
              }}
            >
              <View style={[styles.checkbox, isUrgent && styles.checkboxChecked]}>
                {isUrgent ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
              </View>
              <View style={styles.urgentTextContainer}>
                <ThemedText style={styles.urgentTitle}>Mark as Urgent</ThemedText>
                <ThemedText style={[styles.urgentSubtitle, { color: theme.textSecondary }]}>
                  Notifies admin team immediately
                </ThemedText>
              </View>
              <View style={styles.urgentIcon}>
                <Feather name="alert-triangle" size={20} color={theme.textSecondary} />
              </View>
            </Pressable>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Describe the Issue *</ThemedText>
              <DualVoiceInput
                value={issueDescription}
                onTextChange={setIssueDescription}
                onAudioRecorded={handleVoiceRecordingComplete}
                placeholder="Describe the repair needed..."
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

          <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, Spacing.lg) }]}>
            <Pressable
              style={[
                styles.submitButton,
                { backgroundColor: isSubmitting ? theme.textSecondary : BrandColors.azureBlue },
                (!issueDescription.trim() && !audioRecording) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting || (!issueDescription.trim() && !audioRecording)}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              ) : null}
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Repair Request'}
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
    backgroundColor: BrandColors.vividTangerine + '15',
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
  propertySection: {
    marginBottom: Spacing.lg,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  propertyAddress: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: Spacing.lg,
  },
  metaItem: {},
  metaLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  urgentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  checkboxChecked: {
    backgroundColor: BrandColors.vividTangerine,
    borderColor: BrandColors.vividTangerine,
  },
  urgentTextContainer: {
    flex: 1,
  },
  urgentTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  urgentSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  urgentIcon: {
    marginLeft: Spacing.sm,
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
    backgroundColor: BrandColors.azureBlue,
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
    flexDirection: 'row',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.azureBlue,
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
});
