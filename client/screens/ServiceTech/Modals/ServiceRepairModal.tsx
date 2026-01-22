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
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

interface ServiceRepairModalProps {
  visible: boolean;
  onClose: () => void;
  propertyName: string;
  propertyAddress: string;
}

interface Product {
  id: string;
  name: string;
}

export function ServiceRepairModal({
  visible,
  onClose,
  propertyName,
  propertyAddress,
}: ServiceRepairModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [issueDescription, setIssueDescription] = useState('');
  const [beforePhotos, setBeforePhotos] = useState<string[]>([]);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

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

  const handleAddBeforePhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddAfterPhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddProduct = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={[styles.header, { backgroundColor: BrandColors.azureBlue }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Feather name="tool" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextContainer}>
                <ThemedText style={styles.headerTitle}>Service Repair</ThemedText>
                <ThemedText style={styles.headerSubtitle} numberOfLines={1}>
                  {propertyName}
                </ThemedText>
                <ThemedText style={styles.headerAddress} numberOfLines={1}>
                  {propertyAddress}
                </ThemedText>
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
          >
            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Issue Description</ThemedText>
              <View style={[styles.textAreaContainer, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.textArea, { color: theme.text }]}
                  placeholder="Describe the issue and repair work..."
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
              <ThemedText style={styles.inputLabel}>Before Photos</ThemedText>
              <View style={styles.photoPreviewRow}>
                {beforePhotos.length === 0 ? (
                  <ThemedText style={[styles.noPhotosText, { color: theme.textSecondary }]}>
                    No photos added
                  </ThemedText>
                ) : null}
              </View>
              <Pressable
                style={[styles.addPhotoButton, { backgroundColor: BrandColors.vividTangerine }]}
                onPress={handleAddBeforePhoto}
              >
                <Feather name="camera" size={18} color="#FFFFFF" />
                <ThemedText style={styles.addPhotoButtonText}>Add Before</ThemedText>
              </Pressable>
            </View>

            <View style={styles.photosSection}>
              <ThemedText style={styles.inputLabel}>After Photos</ThemedText>
              <View style={styles.photoPreviewRow}>
                {afterPhotos.length === 0 ? (
                  <ThemedText style={[styles.noPhotosText, { color: theme.textSecondary }]}>
                    No photos added
                  </ThemedText>
                ) : null}
              </View>
              <Pressable
                style={[styles.addPhotoButton, { backgroundColor: BrandColors.vividTangerine }]}
                onPress={handleAddAfterPhoto}
              >
                <Feather name="camera" size={18} color="#FFFFFF" />
                <ThemedText style={styles.addPhotoButtonText}>Add After</ThemedText>
              </Pressable>
            </View>

            <View style={styles.productsSection}>
              <ThemedText style={styles.inputLabel}>Products/Parts Needed</ThemedText>
              {products.length === 0 ? (
                <ThemedText style={[styles.noProductsText, { color: theme.textSecondary }]}>
                  No products added
                </ThemedText>
              ) : (
                products.map((product) => (
                  <View key={product.id} style={[styles.productItem, { backgroundColor: theme.backgroundSecondary }]}>
                    <ThemedText>{product.name}</ThemedText>
                  </View>
                ))
              )}
              <Pressable
                style={[styles.addProductButton, { backgroundColor: BrandColors.azureBlue }]}
                onPress={handleAddProduct}
              >
                <Feather name="plus" size={18} color="#FFFFFF" />
                <ThemedText style={styles.addProductButtonText}>Add Product</ThemedText>
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <BPButton
              variant="primary"
              onPress={handleSubmit}
              fullWidth
              disabled={!issueDescription.trim()}
            >
              Submit Service Repair
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
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
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  headerAddress: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
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
  photoPreviewRow: {
    marginBottom: Spacing.sm,
  },
  noPhotosText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addPhotoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  productsSection: {
    marginBottom: Spacing.lg,
  },
  noProductsText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  productItem: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  addProductButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
