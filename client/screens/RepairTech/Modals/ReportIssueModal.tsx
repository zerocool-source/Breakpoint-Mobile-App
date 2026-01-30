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
  Image,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { techOpsRequest } from '@/lib/query-client';

interface ReportIssueModalProps {
  visible: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
  bodyOfWater: string;
  technicianId: string;
  technicianName: string;
}

export function ReportIssueModal({
  visible,
  onClose,
  propertyId,
  propertyName,
  bodyOfWater,
  technicianId,
  technicianName,
}: ReportIssueModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [description, setDescription] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cameraPermission, requestCameraPermission] = ImagePicker.useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = ImagePicker.useMediaLibraryPermissions();

  const resetForm = () => {
    setDescription('');
    setIsUrgent(false);
    setPhotos([]);
    setShowPhotoOptions(false);
  };

  const handleTakePhoto = async () => {
    setShowPhotoOptions(false);
    
    if (!cameraPermission?.granted) {
      if (cameraPermission?.status === 'denied' && !cameraPermission?.canAskAgain) {
        Alert.alert(
          'Camera Access Required',
          'Please enable camera access in your device settings to take photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            ...(Platform.OS !== 'web' ? [{ text: 'Open Settings', onPress: () => { try { Linking.openSettings(); } catch {} } }] : []),
          ]
        );
        return;
      }
      const result = await requestCameraPermission();
      if (!result.granted) return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri]);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handlePickFromGallery = async () => {
    setShowPhotoOptions(false);
    
    if (!mediaPermission?.granted) {
      if (mediaPermission?.status === 'denied' && !mediaPermission?.canAskAgain) {
        Alert.alert(
          'Photo Library Access Required',
          'Please enable photo library access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            ...(Platform.OS !== 'web' ? [{ text: 'Open Settings', onPress: () => { try { Linking.openSettings(); } catch {} } }] : []),
          ]
        );
        return;
      }
      const result = await requestMediaPermission();
      if (!result.granted) return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      setPhotos(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSubmit = async () => {
    if (!propertyId || propertyId === 'unknown') {
      Alert.alert('Property Required', 'Please select a property before submitting a repair request.');
      return;
    }

    if (!technicianId || technicianId === 'unknown') {
      Alert.alert('Authentication Required', 'Please log in before submitting a repair request.');
      return;
    }

    if (description.trim().length < 10) {
      Alert.alert('Description Required', 'Please provide at least 10 characters describing the issue.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    const payload = {
      entryType: 'repairs_needed',
      description: description.trim(),
      priority: isUrgent ? 'urgent' : 'normal',
      status: 'pending',
      propertyId,
      propertyName,
      bodyOfWater,
      technicianId,
      technicianName,
      photoUrls: photos.length > 0 ? photos : undefined,
    };

    if (__DEV__) {
      console.log('[RepairsNeeded] payload', payload);
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
      
      resetForm();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Submission Failed', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface, maxHeight: windowHeight * 0.9 }]}>
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.cancelButton} disabled={isSubmitting}>
              <Feather name="chevron-left" size={20} color={isSubmitting ? theme.textSecondary : BrandColors.azureBlue} />
              <ThemedText style={[styles.cancelText, isSubmitting && { color: theme.textSecondary }]}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={styles.title}>Report Issue</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Property</ThemedText>
              <View style={[styles.readOnlyField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <ThemedText style={{ color: theme.text }}>{propertyName}</ThemedText>
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Body of Water</ThemedText>
              <View style={[styles.readOnlyField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <ThemedText style={{ color: theme.text }}>{bodyOfWater}</ThemedText>
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                Description <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                placeholder="Describe the issue in detail (min 10 characters)..."
                placeholderTextColor={theme.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
              <ThemedText style={[styles.charCount, { color: theme.textSecondary }]}>
                {description.length} / 10 min
              </ThemedText>
            </View>

            <View style={styles.field}>
              <Pressable
                style={[styles.urgentToggle, { backgroundColor: isUrgent ? BrandColors.danger : theme.backgroundRoot, borderColor: isUrgent ? BrandColors.danger : theme.border }]}
                onPress={() => {
                  setIsUrgent(!isUrgent);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                disabled={isSubmitting}
              >
                <Feather 
                  name={isUrgent ? "alert-triangle" : "flag"} 
                  size={20} 
                  color={isUrgent ? '#FFFFFF' : theme.textSecondary} 
                />
                <ThemedText style={[styles.urgentText, { color: isUrgent ? '#FFFFFF' : theme.text }]}>
                  Mark as Urgent
                </ThemedText>
                {isUrgent ? (
                  <View style={styles.checkIcon}>
                    <Feather name="check" size={16} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                Photos (optional) {photos.length > 0 ? `${photos.length}/5` : ''}
              </ThemedText>
              
              {photos.length > 0 ? (
                <View style={styles.photosGrid}>
                  {photos.map((uri, index) => (
                    <View key={index} style={styles.photoWrapper}>
                      <Image source={{ uri }} style={styles.photoPreview} />
                      <Pressable
                        style={styles.removePhotoButton}
                        onPress={() => handleRemovePhoto(index)}
                        disabled={isSubmitting}
                      >
                        <Feather name="x" size={14} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                  {photos.length < 5 ? (
                    <Pressable
                      style={[styles.addMorePhoto, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}
                      onPress={() => setShowPhotoOptions(true)}
                      disabled={isSubmitting}
                    >
                      <Feather name="plus" size={24} color={theme.textSecondary} />
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <Pressable
                  style={[styles.photoArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}
                  onPress={() => setShowPhotoOptions(true)}
                  disabled={isSubmitting}
                >
                  <Feather name="camera" size={24} color={theme.textSecondary} />
                  <ThemedText style={[styles.addPhotosText, { color: theme.textSecondary }]}>Add Photos</ThemedText>
                </Pressable>
              )}

              {showPhotoOptions ? (
                <View style={[styles.photoOptionsContainer, { backgroundColor: theme.surface }]}>
                  <Pressable style={styles.photoOption} onPress={handleTakePhoto} disabled={isSubmitting}>
                    <Feather name="camera" size={20} color={BrandColors.azureBlue} />
                    <ThemedText style={[styles.photoOptionText, { color: theme.text }]}>Take Photo</ThemedText>
                  </Pressable>
                  <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />
                  <Pressable style={styles.photoOption} onPress={handlePickFromGallery} disabled={isSubmitting}>
                    <Feather name="image" size={20} color={BrandColors.azureBlue} />
                    <ThemedText style={[styles.photoOptionText, { color: theme.text }]}>Choose from Library</ThemedText>
                  </Pressable>
                  <View style={[styles.optionDivider, { backgroundColor: theme.border }]} />
                  <Pressable style={styles.photoOption} onPress={() => setShowPhotoOptions(false)}>
                    <Feather name="x" size={20} color={theme.textSecondary} />
                    <ThemedText style={[styles.photoOptionText, { color: theme.textSecondary }]}>Cancel</ThemedText>
                  </Pressable>
                </View>
              ) : null}
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.surface }]}>
            <Pressable
              style={[
                styles.submitButton, 
                { backgroundColor: isSubmitting ? theme.textSecondary : BrandColors.danger }
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              ) : (
                <Feather name="flag" size={18} color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              )}
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Issue Report'}
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
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    minHeight: '70%',
    ...Shadows.card,
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
  readOnlyField: {
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
  charCount: {
    fontSize: 12,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  urgentText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoWrapper: {
    position: 'relative',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMorePhoto: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOptionsContainer: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  photoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  photoOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionDivider: {
    height: 1,
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
