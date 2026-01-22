import React, { useState } from 'react';
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

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockProperties } from '@/lib/supervisorMockData';

interface NewInspectionModalProps {
  visible: boolean;
  onClose: () => void;
  onStartInspection: (propertyId: string, propertyName: string) => void;
}

export function NewInspectionModal({ visible, onClose, onStartInspection }: NewInspectionModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [selectedProperty, setSelectedProperty] = useState('');

  const handleStartInspection = () => {
    if (!selectedProperty) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const property = mockProperties.find(p => p.id === selectedProperty);
    if (property) {
      onStartInspection(property.id, property.name);
    }
    setSelectedProperty('');
    onClose();
  };

  const handleClose = () => {
    setSelectedProperty('');
    onClose();
  };

  const selectedPropertyData = mockProperties.find(p => p.id === selectedProperty);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.lg, maxHeight: windowHeight * 0.85 },
          ]}
        >
          <View style={[styles.header, { backgroundColor: BrandColors.azureBlue }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Feather name="clipboard" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.headerText}>
                <ThemedText style={styles.headerTitle}>New QC Inspection</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Select a property to inspect</ThemedText>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={handleClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <ThemedText style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                Property *
              </ThemedText>
              <View style={[styles.pickerContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <Picker
                  selectedValue={selectedProperty}
                  onValueChange={(value) => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedProperty(value);
                  }}
                  style={styles.picker}
                  dropdownIconColor={theme.textSecondary}
                >
                  <Picker.Item label="Select a property..." value="" color={theme.textSecondary} />
                  {mockProperties.map((property) => (
                    <Picker.Item
                      key={property.id}
                      label={property.name}
                      value={property.id}
                      color={theme.text}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {selectedPropertyData ? (
              <View style={[styles.propertyPreview, { backgroundColor: theme.backgroundSecondary, borderColor: BrandColors.azureBlue }]}>
                <View style={styles.propertyPreviewHeader}>
                  <View style={[styles.propertyIcon, { backgroundColor: BrandColors.azureBlue + '20' }]}>
                    <Feather name="map-pin" size={20} color={BrandColors.azureBlue} />
                  </View>
                  <View style={styles.propertyDetails}>
                    <ThemedText style={styles.propertyName}>{selectedPropertyData.name}</ThemedText>
                    <ThemedText style={[styles.propertyAddress, { color: theme.textSecondary }]}>
                      {selectedPropertyData.address}
                    </ThemedText>
                    <View style={[styles.propertyTypeBadge, { backgroundColor: BrandColors.tropicalTeal + '20' }]}>
                      <ThemedText style={[styles.propertyTypeText, { color: BrandColors.tropicalTeal }]}>
                        {selectedPropertyData.type}
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}

            <View style={[styles.infoCard, { backgroundColor: BrandColors.azureBlue + '10', borderColor: BrandColors.azureBlue + '30' }]}>
              <Feather name="info" size={18} color={BrandColors.azureBlue} />
              <ThemedText style={[styles.infoText, { color: BrandColors.azureBlue }]}>
                The inspection checklist includes 63 items across 10 categories covering water quality, safety, equipment, and more.
              </ThemedText>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <BPButton
              variant="outline"
              onPress={handleClose}
              style={styles.cancelButton}
            >
              Cancel
            </BPButton>
            <BPButton
              onPress={handleStartInspection}
              disabled={!selectedProperty}
              style={styles.startButton}
            >
              <Feather name="play" size={18} color="#FFFFFF" style={{ marginRight: Spacing.xs }} />
              Start Inspection
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
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
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  propertyPreview: {
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    padding: Spacing.lg,
  },
  propertyPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  propertyIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  propertyDetails: {
    flex: 1,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  propertyAddress: {
    fontSize: 13,
    marginBottom: Spacing.sm,
  },
  propertyTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  propertyTypeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  cancelButton: {
    flex: 1,
  },
  startButton: {
    flex: 2,
  },
});
