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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockProperties } from '@/lib/mockData';

interface EmergencyReportModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const EMERGENCY_TYPES = [
  { id: 'leak', label: 'Major Water Leak', icon: 'droplet' },
  { id: 'electrical', label: 'Electrical Hazard', icon: 'zap' },
  { id: 'chemical', label: 'Chemical Spill', icon: 'alert-triangle' },
  { id: 'injury', label: 'Injury on Site', icon: 'heart' },
  { id: 'equipment', label: 'Equipment Failure', icon: 'tool' },
  { id: 'other', label: 'Other Emergency', icon: 'alert-circle' },
];

export function EmergencyReportModal({ visible, onClose, onSubmit }: EmergencyReportModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);

  const handleSubmit = async () => {
    if (!selectedProperty || !selectedType) {
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      
      const property = mockProperties.find(p => p.id === selectedProperty);
      
      onSubmit({
        propertyId: selectedProperty,
        propertyName: property?.name,
        emergencyType: selectedType,
        description,
        timestamp: new Date().toISOString(),
        notifiedAdmin: true,
      });

      setSelectedProperty(null);
      setSelectedType(null);
      setDescription('');
      onClose();

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1500);
  };

  const selectedPropertyData = mockProperties.find(p => p.id === selectedProperty);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View 
          entering={ZoomIn.springify()}
          style={[styles.container, { backgroundColor: theme.surface, maxHeight: windowHeight * 0.9 }]}
        >
          <View style={[styles.emergencyHeader, { backgroundColor: BrandColors.danger }]}>
            <View style={styles.emergencyIconContainer}>
              <Feather name="alert-triangle" size={32} color="#FFFFFF" />
            </View>
            <ThemedText style={styles.emergencyTitle}>Emergency Report</ThemedText>
            <ThemedText style={styles.emergencySubtitle}>
              Admin will be notified immediately
            </ThemedText>
          </View>

          <Pressable onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                PROPERTY <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <Pressable 
                style={[
                  styles.propertySelector, 
                  { backgroundColor: theme.backgroundRoot, borderColor: selectedProperty ? BrandColors.azureBlue : theme.border }
                ]}
                onPress={() => setShowPropertyPicker(!showPropertyPicker)}
              >
                {selectedPropertyData ? (
                  <View style={styles.selectedPropertyContent}>
                    <View style={[styles.propertyIcon, { backgroundColor: BrandColors.azureBlue + '20' }]}>
                      <Feather name="map-pin" size={18} color={BrandColors.azureBlue} />
                    </View>
                    <View style={styles.propertyInfo}>
                      <ThemedText style={styles.propertyName}>{selectedPropertyData.name}</ThemedText>
                      <ThemedText style={[styles.propertyAddress, { color: theme.textSecondary }]}>
                        {selectedPropertyData.address}
                      </ThemedText>
                    </View>
                  </View>
                ) : (
                  <ThemedText style={{ color: theme.textSecondary }}>Select property...</ThemedText>
                )}
                <Feather name="chevron-down" size={20} color={theme.textSecondary} />
              </Pressable>

              {showPropertyPicker ? (
                <View style={[styles.propertyList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {mockProperties.map((property) => (
                    <Pressable
                      key={property.id}
                      style={[
                        styles.propertyOption,
                        { borderBottomColor: theme.border },
                        selectedProperty === property.id && { backgroundColor: BrandColors.azureBlue + '10' }
                      ]}
                      onPress={() => {
                        setSelectedProperty(property.id);
                        setShowPropertyPicker(false);
                        if (Platform.OS !== 'web') {
                          Haptics.selectionAsync();
                        }
                      }}
                    >
                      <ThemedText style={styles.propertyOptionName}>{property?.name ?? 'Unknown Property'}</ThemedText>
                      <ThemedText style={[styles.propertyOptionAddress, { color: theme.textSecondary }]}>
                        {property?.address ?? 'Address unavailable'}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                EMERGENCY TYPE <ThemedText style={styles.required}>*</ThemedText>
              </ThemedText>
              <View style={styles.emergencyTypesGrid}>
                {EMERGENCY_TYPES.map((type) => (
                  <Pressable
                    key={type.id}
                    style={[
                      styles.emergencyTypeButton,
                      { backgroundColor: theme.backgroundRoot, borderColor: theme.border },
                      selectedType === type.id && { 
                        backgroundColor: BrandColors.danger + '15', 
                        borderColor: BrandColors.danger 
                      }
                    ]}
                    onPress={() => {
                      setSelectedType(type.id);
                      if (Platform.OS !== 'web') {
                        Haptics.selectionAsync();
                      }
                    }}
                  >
                    <Feather 
                      name={type.icon as any} 
                      size={20} 
                      color={selectedType === type.id ? BrandColors.danger : theme.textSecondary} 
                    />
                    <ThemedText 
                      style={[
                        styles.emergencyTypeLabel,
                        selectedType === type.id && { color: BrandColors.danger }
                      ]}
                    >
                      {type.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
                DESCRIPTION
              </ThemedText>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                placeholder="Describe the emergency situation..."
                placeholderTextColor={theme.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={[styles.notificationBanner, { backgroundColor: BrandColors.vividTangerine + '15' }]}>
              <Feather name="bell" size={18} color={BrandColors.vividTangerine} />
              <ThemedText style={[styles.notificationText, { color: BrandColors.vividTangerine }]}>
                Submitting will immediately notify admin and dispatch team
              </ThemedText>
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.surface }]}>
            <Pressable
              style={[
                styles.submitButton, 
                { backgroundColor: BrandColors.danger },
                (!selectedProperty || !selectedType) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!selectedProperty || !selectedType || isSubmitting}
            >
              {isSubmitting ? (
                <ThemedText style={styles.submitButtonText}>Notifying Admin...</ThemedText>
              ) : (
                <>
                  <Feather name="alert-triangle" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.submitButtonText}>Submit Emergency Report</ThemedText>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={onClose}
            >
              <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    minHeight: '60%',
    ...Shadows.card,
  },
  emergencyHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emergencyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  emergencySubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  required: {
    color: BrandColors.danger,
  },
  propertySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
  },
  selectedPropertyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  propertyIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    fontSize: 15,
    fontWeight: '600',
  },
  propertyAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  propertyList: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  propertyOption: {
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  propertyOptionName: {
    fontSize: 15,
    fontWeight: '500',
  },
  propertyOptionAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  emergencyTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  emergencyTypeButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  emergencyTypeLabel: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  textArea: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 100,
  },
  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  notificationText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  footer: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
