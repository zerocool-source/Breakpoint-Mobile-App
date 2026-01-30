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
import { LinearGradient } from 'expo-linear-gradient';

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

interface ServiceRepairModalProps {
  visible: boolean;
  onClose: () => void;
  propertyId?: string;
  propertyName: string;
  propertyAddress: string;
  properties?: PropertyOption[];
}

interface Product {
  id: string;
  name: string;
  sku: string;
  added: boolean;
}

const AVAILABLE_PRODUCTS: Product[] = [
  { id: '1', name: '1/2HP - 3HP Complete Hardware', sku: 'SWBSW21123', added: false },
  { id: '2', name: '120W Chlorking Lamp/Bulb Amalgam Sentry', sku: 'CHKLA120W185SP', added: false },
  { id: '3', name: '2 hp Single Speed Pentair Motor replacement Comment', sku: '', added: false },
  { id: '4', name: 'Pool Filter Cartridge', sku: 'PFC-2400', added: false },
  { id: '5', name: 'O-Ring Kit Assortment', sku: 'ORK-100', added: false },
];

export function ServiceRepairModal({
  visible,
  onClose,
  propertyId,
  propertyName,
  propertyAddress,
  properties,
}: ServiceRepairModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const { user } = useAuth();

  const [issueDescription, setIssueDescription] = useState('');
  const [products, setProducts] = useState(AVAILABLE_PRODUCTS);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible && properties && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [visible, properties]);

  const selectedProperty = properties?.find(p => p.id === selectedPropertyId);
  const displayPropertyName = properties ? (selectedProperty?.name || 'Select Property') : propertyName;
  const displayPropertyAddress = properties ? (selectedProperty?.address || '') : propertyAddress;

  const handleSubmit = async () => {
    const propId = properties ? selectedPropertyId : propertyId;
    const propName = displayPropertyName;
    
    if (!propId || (properties && !selectedPropertyId)) {
      Alert.alert('Property Required', 'Please select a property before submitting a service repair.');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please log in before submitting a service repair.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    const addedProducts = products.filter(p => p.added);
    const productsList = addedProducts.map(p => ({
      name: p.name,
      sku: p.sku,
    }));

    const payload = {
      entryType: 'service_repairs',
      description: issueDescription.trim() || 'Service repair logged',
      priority: 'normal',
      status: 'pending',
      propertyId: propId,
      propertyName: propName,
      bodyOfWater: displayPropertyAddress,
      technicianId: user.id,
      technicianName: user.name || user.email || 'Service Technician',
      products: productsList,
    };

    console.log('[ServiceRepair] Submitting to Tech Ops:', payload);

    try {
      await techOpsRequest('/api/tech-ops', payload);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Service Repair Logged',
        'Your service repair has been submitted.',
        [{ text: 'OK', onPress: () => {} }]
      );
      
      setIssueDescription('');
      setProducts(AVAILABLE_PRODUCTS);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[ServiceRepair] Submission failed:', errorMessage);
      Alert.alert('Submission Failed', `Could not submit service repair: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceRecordingComplete = (uri: string, duration: number) => {
    console.log('Voice recording saved:', uri, 'duration:', duration);
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

  const handleToggleProduct = (productId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setProducts(products.map(p => 
      p.id === productId ? { ...p, added: !p.added } : p
    ));
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
          <LinearGradient
            colors={['#4A90D9', '#5B9FE8', '#6BADE8']}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Feather name="tool" size={24} color="#FFFFFF" />
              </View>
              <View>
                <ThemedText style={styles.headerTitle}>Service Repair</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Log repair needs</ThemedText>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </LinearGradient>

          <LinearGradient
            colors={['#5B9FE8', '#6BADE8']}
            style={styles.propertyHeader}
          >
            <ThemedText style={styles.sectionLabel}>Select Property</ThemedText>
            {properties ? (
              <View style={[styles.propertyPickerContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Picker
                  selectedValue={selectedPropertyId}
                  onValueChange={(value) => setSelectedPropertyId(value)}
                  style={styles.propertyPicker}
                  dropdownIconColor={theme.text}
                >
                  <Picker.Item label="Select a property..." value="" />
                  {properties.map((prop) => (
                    <Picker.Item key={prop.id} label={prop.name} value={prop.id} />
                  ))}
                </Picker>
              </View>
            ) : (
              <>
                <ThemedText style={styles.propertyName}>{displayPropertyName}</ThemedText>
                <ThemedText style={styles.propertyAddress}>{displayPropertyAddress}</ThemedText>
              </>
            )}
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>ISSUE DESCRIPTION</ThemedText>
              <DualVoiceInput
                value={issueDescription}
                onTextChange={setIssueDescription}
                onAudioRecorded={handleVoiceRecordingComplete}
                placeholder="Describe the issue found, what needs repair..."
              />
            </View>

            <View style={styles.photosSection}>
              <View style={styles.photoHeader}>
                <ThemedText style={styles.photoLabel}>BEFORE PHOTOS</ThemedText>
                <Pressable style={styles.addPhotoButton} onPress={handleAddBeforePhoto}>
                  <Feather name="camera" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.addPhotoButtonText}>Add Before</ThemedText>
                </Pressable>
              </View>
              <View style={[styles.photoPlaceholder, { backgroundColor: BrandColors.vividTangerine + '15' }]}>
                <Feather name="camera" size={24} color={BrandColors.vividTangerine + '60'} />
                <ThemedText style={[styles.noPhotosText, { color: BrandColors.vividTangerine }]}>
                  No before photos
                </ThemedText>
              </View>
            </View>

            <View style={styles.photosSection}>
              <View style={styles.photoHeader}>
                <ThemedText style={styles.photoLabel}>AFTER PHOTOS</ThemedText>
                <Pressable style={[styles.addPhotoButton, { backgroundColor: BrandColors.emerald }]} onPress={handleAddAfterPhoto}>
                  <Feather name="camera" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.addPhotoButtonText}>Add After</ThemedText>
                </Pressable>
              </View>
              <View style={[styles.photoPlaceholder, { backgroundColor: BrandColors.emerald + '15' }]}>
                <Feather name="camera" size={24} color={BrandColors.emerald + '60'} />
                <ThemedText style={[styles.noPhotosText, { color: BrandColors.emerald }]}>
                  No after photos
                </ThemedText>
              </View>
            </View>

            <View style={styles.productsSection}>
              <View style={styles.productHeader}>
                <ThemedText style={styles.productLabel}>PRODUCTS/PARTS NEEDED</ThemedText>
                <Pressable style={[styles.addProductButton, { backgroundColor: BrandColors.azureBlue }]} onPress={handleAddProduct}>
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.addProductButtonText}>Add Product</ThemedText>
                </Pressable>
              </View>
              <View style={[styles.productsList, { borderColor: theme.border }]}>
                {products.map((product) => (
                  <Pressable
                    key={product.id}
                    style={[styles.productItem, { borderBottomColor: theme.border }]}
                    onPress={() => handleToggleProduct(product.id)}
                  >
                    <View style={styles.productInfo}>
                      <ThemedText style={styles.productName}>{product.name}</ThemedText>
                      {product.sku ? (
                        <ThemedText style={[styles.productSku, { color: BrandColors.azureBlue }]}>
                          SKU: {product.sku}
                        </ThemedText>
                      ) : (
                        <ThemedText style={[styles.productSku, { color: BrandColors.azureBlue }]}>
                          SKU:
                        </ThemedText>
                      )}
                    </View>
                    <Feather 
                      name={product.added ? "check" : "plus"} 
                      size={20} 
                      color={product.added ? BrandColors.emerald : BrandColors.azureBlue} 
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={[styles.submitButton, { backgroundColor: BrandColors.azureBlue }, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              ) : (
                <Feather name="check" size={20} color="#FFFFFF" />
              )}
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Service Repair'}
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
    minHeight: '70%',
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
  propertyHeader: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  propertyAddress: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    marginBottom: Spacing.xl,
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.vividTangerine,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  addPhotoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  photoPlaceholder: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  noPhotosText: {
    fontSize: 14,
    fontWeight: '500',
  },
  productsSection: {
    marginBottom: Spacing.lg,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  productLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addProductButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  addProductButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  productsList: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  productInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  productSku: {
    fontSize: 12,
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  propertyPickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  propertyPicker: {
    height: 50,
  },
});
