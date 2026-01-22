import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { DualVoiceInput } from '@/components/DualVoiceInput';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockProperties } from '@/lib/mockData';

type Priority = 'low' | 'normal' | 'high' | 'urgent';

const issueTypes = [
  'Equipment Malfunction',
  'Water Quality Issue',
  'Structural Damage',
  'Safety Hazard',
  'Plumbing Issue',
  'Other',
];

const priorities: { value: Priority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: BrandColors.low },
  { value: 'normal', label: 'Normal', color: BrandColors.azureBlue },
  { value: 'high', label: 'High', color: BrandColors.vividTangerine },
  { value: 'urgent', label: 'Urgent', color: BrandColors.danger },
];

export default function ReportIssueModal() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedIssueType, setSelectedIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');
  const [photos, setPhotos] = useState<string[]>([]);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [showIssueTypePicker, setShowIssueTypePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedPropertyObj = mockProperties.find(p => p.id === selectedProperty);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5 - photos.length,
      });

      if (!result.canceled && result.assets) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setPhotos(prev => [...prev, ...newPhotos].slice(0, 5));
      }
    } catch (error) {
      console.error('Image picker error:', error);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedProperty || !selectedIssueType || !description.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Success', 'Issue reported successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.lg,
          paddingBottom: insets.bottom + Spacing['5xl'],
          paddingHorizontal: Spacing.screenPadding,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <ThemedText style={styles.label}>Property *</ThemedText>
          <Pressable
            onPress={() => setShowPropertyPicker(!showPropertyPicker)}
            style={[styles.picker, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <ThemedText style={[styles.pickerText, !selectedProperty && { color: theme.textSecondary }]}>
              {selectedPropertyObj?.name || 'Select property'}
            </ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </Pressable>
          {showPropertyPicker ? (
            <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {mockProperties.map(prop => (
                <Pressable
                  key={prop.id}
                  onPress={() => {
                    setSelectedProperty(prop.id);
                    setShowPropertyPicker(false);
                  }}
                  style={styles.dropdownItem}
                >
                  <ThemedText>{prop.name}</ThemedText>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.field, { zIndex: 9 }]}>
          <ThemedText style={styles.label}>Issue Type *</ThemedText>
          <Pressable
            onPress={() => setShowIssueTypePicker(!showIssueTypePicker)}
            style={[styles.picker, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <ThemedText style={[styles.pickerText, !selectedIssueType && { color: theme.textSecondary }]}>
              {selectedIssueType || 'Select issue type'}
            </ThemedText>
            <Feather name="chevron-down" size={20} color={theme.textSecondary} />
          </Pressable>
          {showIssueTypePicker ? (
            <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {issueTypes.map(type => (
                <Pressable
                  key={type}
                  onPress={() => {
                    setSelectedIssueType(type);
                    setShowIssueTypePicker(false);
                  }}
                  style={styles.dropdownItem}
                >
                  <ThemedText>{type}</ThemedText>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Description *</ThemedText>
          <DualVoiceInput
            value={description}
            onTextChange={setDescription}
            placeholder="Describe the issue in detail..."
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Priority</ThemedText>
          <View style={styles.priorityRow}>
            {priorities.map(p => (
              <Pressable
                key={p.value}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setPriority(p.value);
                }}
                style={[
                  styles.priorityButton,
                  {
                    backgroundColor: priority === p.value ? p.color : theme.surface,
                    borderColor: priority === p.value ? p.color : theme.border,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.priorityText,
                    { color: priority === p.value ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {p.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Photos (optional)</ThemedText>
          <View style={styles.photosContainer}>
            {photos.map((uri, index) => (
              <Animated.View key={uri} entering={FadeIn} style={styles.photoWrapper}>
                <Image source={{ uri }} style={styles.photo} contentFit="cover" />
                <Pressable
                  onPress={() => handleRemovePhoto(index)}
                  style={styles.removePhotoButton}
                >
                  <Feather name="x" size={14} color="#FFFFFF" />
                </Pressable>
              </Animated.View>
            ))}
            {photos.length < 5 ? (
              <Pressable
                onPress={handlePickImage}
                style={[styles.addPhotoButton, { borderColor: theme.border }]}
              >
                <Feather name="camera" size={24} color={theme.textSecondary} />
                <ThemedText style={[styles.addPhotoText, { color: theme.textSecondary }]}>
                  Add Photo
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>

        <BPButton
          onPress={handleSubmit}
          loading={isSubmitting}
          fullWidth
          size="large"
        >
          Submit Report
        </BPButton>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  field: {
    marginBottom: Spacing.xl,
    zIndex: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  pickerText: {
    fontSize: 15,
  },
  dropdown: {
    position: 'absolute',
    top: 72,
    left: 0,
    right: 0,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    ...Shadows.card,
    zIndex: 100,
  },
  dropdownItem: {
    padding: Spacing.lg,
  },
  textArea: {
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    padding: Spacing.lg,
    minHeight: 100,
    fontSize: 15,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
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
  addPhotoButton: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoText: {
    fontSize: 10,
    marginTop: 4,
  },
});
