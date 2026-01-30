import React, { useState, useEffect } from 'react';
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
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

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

interface ChemicalOrderModalProps {
  visible: boolean;
  onClose: () => void;
  propertyId?: string;
  propertyName: string;
  propertyAddress: string;
  properties?: PropertyOption[];
}

interface ChemicalRow {
  id: string;
  chemical: string;
  quantity: number;
  unit: string;
}

const CHEMICALS = [
  { value: '', label: 'Select...' },
  { value: 'Chlorine', label: 'Chlorine' },
  { value: 'Muriatic Acid', label: 'Muriatic Acid' },
  { value: 'Shock', label: 'Shock' },
  { value: 'Algaecide', label: 'Algaecide' },
  { value: 'pH Up', label: 'pH Up' },
  { value: 'pH Down', label: 'pH Down' },
  { value: 'Stabilizer', label: 'Stabilizer' },
  { value: 'Defoamer', label: 'Defoamer' },
  { value: 'Calcium', label: 'Calcium' },
  { value: 'Baking Soda', label: 'Baking Soda' },
  { value: 'Sodium Bicarbonate', label: 'Sodium Bicarbonate' },
  { value: 'Soda Ash', label: 'Soda Ash' },
  { value: 'Cyanuric Acid', label: 'Cyanuric Acid' },
  { value: 'Calcium Chloride', label: 'Calcium Chloride' },
  { value: 'Other', label: 'Other' },
];

const LIQUID_UNITS = [
  { value: '1 Gallon', label: '1 Gallon' },
  { value: '2.5 Gallon', label: '2.5 Gallon' },
  { value: '5 Gallon', label: '5 Gallon' },
  { value: '15 Gallon', label: '15 Gallon' },
  { value: '30 Gallon', label: '30 Gallon' },
  { value: '50 Gallon', label: '50 Gallon' },
  { value: '100 Gallon', label: '100 Gallon' },
  { value: '150 Gallon', label: '150 Gallon' },
  { value: '200 Gallon', label: '200 Gallon' },
  { value: '250 Gallon', label: '250 Gallon' },
];

const DRY_UNITS = [
  { value: '25 lb Bag', label: '25 lb Bag' },
  { value: '50 lb Bag', label: '50 lb Bag' },
  { value: '100 lb Bag', label: '100 lb Bag' },
  { value: '250 lb Bag', label: '250 lb Bag' },
  { value: '25 lb Bucket', label: '25 lb Bucket' },
  { value: '50 lb Bucket', label: '50 lb Bucket' },
];

const DRY_CHEMICALS = ['Baking Soda', 'Sodium Bicarbonate', 'Soda Ash', 'Stabilizer', 'Cyanuric Acid', 'Calcium', 'Calcium Chloride', 'Shock'];

function getUnitsForChemical(chemical: string) {
  if (DRY_CHEMICALS.includes(chemical)) {
    return DRY_UNITS;
  }
  return LIQUID_UNITS;
}

function getDefaultUnit(chemical: string) {
  if (DRY_CHEMICALS.includes(chemical)) {
    return '50 lb Bag';
  }
  return '5 Gallon';
}

export function ChemicalOrderModal({
  visible,
  onClose,
  propertyId,
  propertyName,
  propertyAddress,
  properties,
}: ChemicalOrderModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const { user } = useAuth();

  const [rows, setRows] = useState<ChemicalRow[]>([
    { id: '1', chemical: '', quantity: 1, unit: '5 Gallon' },
  ]);
  const [notes, setNotes] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tankPhotos, setTankPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (visible && properties && properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [visible, properties]);

  const selectedProperty = properties?.find(p => p.id === selectedPropertyId);
  const displayPropertyName = properties ? (selectedProperty?.name || 'Select Property') : propertyName;
  const displayPropertyAddress = properties ? (selectedProperty?.address || '') : propertyAddress;

  const handleAddRow = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRows([...rows, { id: String(Date.now()), chemical: '', quantity: 1, unit: '5 Gallon' }]);
  };

  const handleRemoveRow = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (rows.length > 1) {
      setRows(rows.filter((row) => row.id !== id));
    }
  };

  const handleChemicalChange = (id: string, chemical: string) => {
    setRows(rows.map((row) => {
      if (row.id === id) {
        const newUnit = getDefaultUnit(chemical);
        return { ...row, chemical, unit: newUnit };
      }
      return row;
    }));
  };

  const handleUnitChange = (id: string, unit: string) => {
    setRows(rows.map((row) => (row.id === id ? { ...row, unit } : row)));
  };

  const handleQuantityChange = (id: string, delta: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRows(
      rows.map((row) => {
        if (row.id === id) {
          const newQuantity = Math.max(1, row.quantity + delta);
          return { ...row, quantity: newQuantity };
        }
        return row;
      })
    );
  };

  const handleTakePhoto = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take tank photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTankPhotos([...tankPhotos, result.assets[0].uri]);
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library permission is needed to select tank photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setTankPhotos([...tankPhotos, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTankPhotos(tankPhotos.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const propId = properties ? selectedPropertyId : propertyId;
    const propName = displayPropertyName;
    
    if (!propId || (properties && !selectedPropertyId)) {
      Alert.alert('Property Required', 'Please select a property before submitting a chemical order.');
      return;
    }
    
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please log in before submitting a chemical order.');
      return;
    }
    
    if (selectedChemicals.length === 0) {
      Alert.alert('Chemicals Required', 'Please select at least one chemical to order.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setIsSubmitting(true);

    const chemicalsOrderList = selectedChemicals.map(row => ({
      chemical: row.chemical,
      quantity: row.quantity,
      unit: row.unit,
    }));

    const payload = {
      entryType: 'chemical_order',
      description: `Chemical Order: ${chemicalsOrderList.map(c => `${c.quantity}x ${c.unit} ${c.chemical}`).join(', ')}${notes ? ` - Notes: ${notes}` : ''}`,
      priority: 'normal',
      status: 'pending',
      propertyId: propId,
      propertyName: propName,
      bodyOfWater: displayPropertyAddress,
      technicianId: user.id,
      technicianName: user.name || user.email || 'Service Technician',
      chemicals: chemicalsOrderList,
      notes: notes.trim(),
      hasPhotos: tankPhotos.length > 0,
      photoUris: tankPhotos,
      photoCount: tankPhotos.length,
    };

    console.log('[ChemicalOrder] Submitting to Tech Ops:', payload);

    try {
      await techOpsRequest('/api/tech-ops', payload);
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert(
        'Order Submitted',
        'Your chemical order has been sent to the office.',
        [{ text: 'OK', onPress: () => {} }]
      );
      
      setRows([{ id: '1', chemical: '', quantity: 1, unit: '5 Gallon' }]);
      setNotes('');
      setTankPhotos([]);
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('[ChemicalOrder] Submission failed:', errorMessage);
      Alert.alert('Submission Failed', `Could not send chemical order: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setRows([{ id: '1', chemical: '', quantity: 1, unit: '5 Gallon' }]);
    setNotes('');
    setTankPhotos([]);
    onClose();
  };

  const selectedChemicals = rows.filter((row) => row.chemical !== '');
  const isValid = selectedChemicals.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.lg, maxHeight: windowHeight * 0.95 }]}>
          <View style={[styles.header, { backgroundColor: BrandColors.azureBlue }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Feather name="droplet" size={24} color="#FFFFFF" />
              </View>
              <View>
                <ThemedText style={styles.headerTitle}>Bulk Chemical Order</ThemedText>
                <ThemedText style={styles.headerSubtitle}>Order chemicals for tank refills</ThemedText>
              </View>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={[styles.propertyHeader, { backgroundColor: BrandColors.azureBlue }]}>
            <ThemedText style={styles.sectionLabel}>Property</ThemedText>
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
                <ThemedText style={styles.propertyName}>{propertyName}</ThemedText>
                <ThemedText style={styles.propertyAddress}>{propertyAddress}</ThemedText>
              </>
            )}
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Chemicals to Order</ThemedText>
            
            {rows.map((row, index) => (
              <View key={row.id} style={[styles.chemicalRow, { backgroundColor: theme.backgroundSecondary }]}>
                <View style={styles.rowHeader}>
                  <ThemedText style={[styles.rowNumber, { color: BrandColors.azureBlue }]}>
                    Item {index + 1}
                  </ThemedText>
                  {rows.length > 1 ? (
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleRemoveRow(row.id)}
                    >
                      <Feather name="trash-2" size={18} color={BrandColors.danger} />
                    </Pressable>
                  ) : null}
                </View>

                <View style={styles.chemicalSelectContainer}>
                  <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>CHEMICAL</ThemedText>
                  <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                    <Picker
                      selectedValue={row.chemical}
                      onValueChange={(value: string) => handleChemicalChange(row.id, value)}
                      style={styles.picker}
                    >
                      {CHEMICALS.map((chem) => (
                        <Picker.Item key={chem.value} label={chem.label} value={chem.value} />
                      ))}
                    </Picker>
                  </View>
                </View>

                {row.chemical ? (
                  <View style={styles.quantityUnitRow}>
                    <View style={styles.qtyContainer}>
                      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>QUANTITY</ThemedText>
                      <View style={styles.quantityControls}>
                        <Pressable
                          style={[styles.quantityButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                          onPress={() => handleQuantityChange(row.id, -1)}
                        >
                          <Feather name="minus" size={18} color={theme.text} />
                        </Pressable>
                        <ThemedText style={styles.quantityValue}>{row.quantity}</ThemedText>
                        <Pressable
                          style={[styles.quantityButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                          onPress={() => handleQuantityChange(row.id, 1)}
                        >
                          <Feather name="plus" size={18} color={theme.text} />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.unitContainer}>
                      <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>UNIT SIZE</ThemedText>
                      <View style={[styles.pickerContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                        <Picker
                          selectedValue={row.unit}
                          onValueChange={(value: string) => handleUnitChange(row.id, value)}
                          style={styles.picker}
                        >
                          {getUnitsForChemical(row.chemical).map((unit) => (
                            <Picker.Item key={unit.value} label={unit.label} value={unit.value} />
                          ))}
                        </Picker>
                      </View>
                    </View>
                  </View>
                ) : null}
              </View>
            ))}

            <Pressable style={[styles.addChemicalButton, { borderColor: BrandColors.azureBlue }]} onPress={handleAddRow}>
              <Feather name="plus" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={[styles.addChemicalText, { color: BrandColors.azureBlue }]}>
                Add Another Chemical
              </ThemedText>
            </Pressable>

            <View style={styles.photoSection}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Tank Photo (Optional)</ThemedText>
              <ThemedText style={[styles.photoHint, { color: theme.textSecondary }]}>
                Take a photo of your empty tank to verify refill needed
              </ThemedText>
              
              <View style={styles.photoButtonsRow}>
                <Pressable
                  style={[styles.photoButton, { backgroundColor: BrandColors.azureBlue }]}
                  onPress={handleTakePhoto}
                >
                  <Feather name="camera" size={20} color="#FFFFFF" />
                  <ThemedText style={styles.photoButtonText}>Take Photo</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.photoButton, { backgroundColor: theme.backgroundSecondary, borderWidth: 1, borderColor: theme.border }]}
                  onPress={handlePickImage}
                >
                  <Feather name="image" size={20} color={theme.text} />
                  <ThemedText style={[styles.photoButtonText, { color: theme.text }]}>Choose Photo</ThemedText>
                </Pressable>
              </View>

              {tankPhotos.length > 0 ? (
                <View style={styles.photoPreviewContainer}>
                  {tankPhotos.map((uri, index) => (
                    <View key={index} style={styles.photoPreviewWrapper}>
                      <Image source={{ uri }} style={styles.photoPreview} contentFit="cover" />
                      <Pressable
                        style={styles.removePhotoButton}
                        onPress={() => handleRemovePhoto(index)}
                      >
                        <Feather name="x" size={16} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={[styles.summarySection, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.summaryTitle}>ORDER SUMMARY</ThemedText>
              {selectedChemicals.length > 0 ? (
                selectedChemicals.map((row) => (
                  <View key={row.id} style={styles.summaryRow}>
                    <ThemedText style={styles.summaryChemical}>{row.chemical}</ThemedText>
                    <ThemedText style={[styles.summaryQty, { color: BrandColors.azureBlue }]}>
                      {row.quantity} x {row.unit}
                    </ThemedText>
                  </View>
                ))
              ) : (
                <ThemedText style={[styles.emptyState, { color: theme.textSecondary }]}>
                  No chemicals selected yet
                </ThemedText>
              )}
              {tankPhotos.length > 0 ? (
                <View style={[styles.photoIndicator, { borderTopColor: theme.border }]}>
                  <Feather name="camera" size={16} color={BrandColors.emerald} />
                  <ThemedText style={[styles.photoIndicatorText, { color: BrandColors.emerald }]}>
                    {tankPhotos.length} tank photo{tankPhotos.length > 1 ? 's' : ''} attached
                  </ThemedText>
                </View>
              ) : null}
            </View>

            <View style={styles.notesSection}>
              <ThemedText style={[styles.notesLabel, { color: theme.textSecondary }]}>
                Order Notes (Optional)
              </ThemedText>
              <DualVoiceInput
                value={notes}
                onTextChange={setNotes}
                placeholder="Add delivery notes, timing preferences, tank location, or special instructions..."
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
                { backgroundColor: BrandColors.azureBlue },
                (!isValid || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: Spacing.sm }} />
              ) : (
                <Feather name="send" size={18} color="#FFFFFF" />
              )}
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? 'Sending...' : 'Send Order'}
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
    minHeight: '75%',
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
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  chemicalRow: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rowNumber: {
    fontSize: 13,
    fontWeight: '600',
  },
  chemicalSelectContainer: {
    marginBottom: Spacing.sm,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  quantityUnitRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  qtyContainer: {
    flex: 0.4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '700',
    minWidth: 40,
    textAlign: 'center',
  },
  unitContainer: {
    flex: 0.6,
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.danger + '15',
    borderRadius: BorderRadius.md,
  },
  addChemicalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  addChemicalText: {
    fontSize: 15,
    fontWeight: '600',
  },
  photoSection: {
    marginBottom: Spacing.xl,
  },
  photoHint: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  photoPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  photoPreviewWrapper: {
    position: 'relative',
  },
  photoPreview: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BrandColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summarySection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryChemical: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryQty: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  photoIndicatorText: {
    fontSize: 13,
    fontWeight: '500',
  },
  notesSection: {
    marginBottom: Spacing.lg,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '500',
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
