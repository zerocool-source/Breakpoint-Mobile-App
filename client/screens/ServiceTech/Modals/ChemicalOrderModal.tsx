import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { DualVoiceInput } from '@/components/DualVoiceInput';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

interface ChemicalOrderModalProps {
  visible: boolean;
  onClose: () => void;
  propertyName: string;
  propertyAddress: string;
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
  { value: 'Other', label: 'Other' },
];

const UNITS = [
  { value: '1 Quart', label: '1 Quart' },
  { value: '1 Gallon', label: '1 Gallon' },
  { value: '2.5 Gallon', label: '2.5 Gallon' },
  { value: '5 Gallon', label: '5 Gallon' },
  { value: '50 lb Bag', label: '50 lb Bag' },
  { value: '25 lb Bucket', label: '25 lb Bucket' },
];

export function ChemicalOrderModal({
  visible,
  onClose,
  propertyName,
  propertyAddress,
}: ChemicalOrderModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [rows, setRows] = useState<ChemicalRow[]>([
    { id: '1', chemical: '', quantity: 1, unit: '1 Quart' },
  ]);
  const [notes, setNotes] = useState('');

  const handleAddRow = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRows([...rows, { id: String(Date.now()), chemical: '', quantity: 1, unit: '1 Quart' }]);
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
    setRows(rows.map((row) => (row.id === id ? { ...row, chemical } : row)));
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

  const handleSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setRows([{ id: '1', chemical: '', quantity: 1, unit: '1 Quart' }]);
    setNotes('');
    onClose();
  };

  const handleCancel = () => {
    setRows([{ id: '1', chemical: '', quantity: 1, unit: '1 Quart' }]);
    setNotes('');
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
              <ThemedText style={styles.headerTitle}>Chemical Order</ThemedText>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <View style={[styles.propertyHeader, { backgroundColor: BrandColors.azureBlue }]}>
            <ThemedText style={styles.propertyName}>{propertyName}</ThemedText>
            <ThemedText style={styles.propertyAddress}>{propertyAddress}</ThemedText>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {rows.map((row) => (
              <View key={row.id} style={styles.chemicalRow}>
                <View style={styles.chemicalMainRow}>
                  <View style={styles.chemicalSelectContainer}>
                    <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>CHEMICAL</ThemedText>
                    <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
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

                  <View style={styles.qtyContainer}>
                    <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>QTY</ThemedText>
                    <View style={styles.quantityControls}>
                      <Pressable
                        style={[styles.quantityButton, { borderColor: theme.border }]}
                        onPress={() => handleQuantityChange(row.id, -1)}
                      >
                        <Feather name="minus" size={16} color={theme.text} />
                      </Pressable>
                      <ThemedText style={styles.quantityValue}>{row.quantity}</ThemedText>
                      <Pressable
                        style={[styles.quantityButton, { borderColor: theme.border }]}
                        onPress={() => handleQuantityChange(row.id, 1)}
                      >
                        <Feather name="plus" size={16} color={theme.text} />
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => handleRemoveRow(row.id)}
                  >
                    <Feather name="trash-2" size={20} color={BrandColors.danger} />
                  </Pressable>
                </View>

                {row.chemical ? (
                  <View style={styles.unitRow}>
                    <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>UNIT</ThemedText>
                    <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                      <Picker
                        selectedValue={row.unit}
                        onValueChange={(value: string) => handleUnitChange(row.id, value)}
                        style={styles.picker}
                      >
                        {UNITS.map((unit) => (
                          <Picker.Item key={unit.value} label={unit.label} value={unit.value} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                ) : null}
              </View>
            ))}

            <Pressable style={[styles.addChemicalButton, { borderColor: BrandColors.azureBlue }]} onPress={handleAddRow}>
              <Feather name="plus" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={[styles.addChemicalText, { color: BrandColors.azureBlue }]}>
                Add Chemical
              </ThemedText>
            </Pressable>

            <View style={[styles.summarySection, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText style={styles.summaryTitle}>ORDER SUMMARY</ThemedText>
              {selectedChemicals.length > 0 ? (
                selectedChemicals.map((row) => (
                  <View key={row.id} style={styles.summaryRow}>
                    <ThemedText style={styles.summaryChemical}>{row.chemical}</ThemedText>
                    <ThemedText style={[styles.summaryQty, { color: theme.textSecondary }]}>
                      {row.quantity} x {row.unit}
                    </ThemedText>
                  </View>
                ))
              ) : (
                <View style={styles.summaryRow}>
                  <ThemedText style={[styles.summaryChemical, { color: theme.textSecondary }]}>
                    Not selected
                  </ThemedText>
                  <ThemedText style={[styles.summaryQty, { color: theme.textSecondary }]}>
                    1 x —
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.notesSection}>
              <ThemedText style={[styles.notesLabel, { color: theme.textSecondary }]}>
                Order Notes (Optional)
              </ThemedText>
              <DualVoiceInput
                value={notes}
                onTextChange={setNotes}
                placeholder="Add delivery notes, timing preferences, or special instructions..."
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
                !isValid && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isValid}
            >
              <Feather name="send" size={18} color="#FFFFFF" />
              <ThemedText style={styles.submitButtonText}>Send Order</ThemedText>
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
    gap: Spacing.sm,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
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
  chemicalRow: {
    marginBottom: Spacing.lg,
  },
  chemicalMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  chemicalSelectContainer: {
    flex: 1,
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
  qtyContainer: {
    width: 100,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'center',
  },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.danger + '10',
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  unitRow: {
    marginTop: Spacing.sm,
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
    fontSize: 13,
  },
  notesSection: {
    marginBottom: Spacing.lg,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  textAreaContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  textArea: {
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 80,
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
