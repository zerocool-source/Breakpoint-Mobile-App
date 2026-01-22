import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
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
}

const CHEMICALS = [
  'Chlorine',
  'Muriatic Acid',
  'Shock',
  'Algaecide',
  'pH Up',
  'pH Down',
  'Stabilizer',
  'Other',
];

const URGENCY_OPTIONS = ['Routine', 'Next Visit', 'ASAP'];

export function ChemicalOrderModal({
  visible,
  onClose,
  propertyName,
  propertyAddress,
}: ChemicalOrderModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [rows, setRows] = useState<ChemicalRow[]>([
    { id: '1', chemical: '', quantity: 1 },
  ]);
  const [urgency, setUrgency] = useState('Routine');
  const [notes, setNotes] = useState('');

  const handleAddRow = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRows([...rows, { id: String(Date.now()), chemical: '', quantity: 1 }]);
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
    onClose();
  };

  const isValid = rows.some((row) => row.chemical !== '');

  const getUrgencyColor = (u: string) => {
    switch (u) {
      case 'ASAP':
        return BrandColors.danger;
      case 'Next Visit':
        return BrandColors.vividTangerine;
      case 'Routine':
        return BrandColors.azureBlue;
      default:
        return theme.textSecondary;
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
        <LinearGradient
          colors={['#FFFFFF', '#E3F2FD', '#FFF3E0', '#FFFFFF']}
          locations={[0, 0.3, 0.7, 1]}
          style={[styles.modalContainer, { paddingBottom: insets.bottom + Spacing.lg }]}
        >
          <View style={[styles.header, { backgroundColor: BrandColors.azureBlue }]}>
            <View style={styles.headerContent}>
              <View style={styles.headerIconContainer}>
                <Feather name="droplet" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextContainer}>
                <ThemedText style={styles.headerTitle}>Chemical Order</ThemedText>
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
            {rows.map((row, index) => (
              <View key={row.id} style={styles.chemicalRow}>
                <View style={styles.rowHeader}>
                  <ThemedText style={styles.rowLabel}>Chemical {index + 1}</ThemedText>
                  {rows.length > 1 ? (
                    <Pressable onPress={() => handleRemoveRow(row.id)}>
                      <Feather name="trash-2" size={18} color={BrandColors.danger} />
                    </Pressable>
                  ) : null}
                </View>

                <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                  <Picker
                    selectedValue={row.chemical}
                    onValueChange={(value: string) => handleChemicalChange(row.id, value)}
                    style={[styles.picker, { color: theme.text }]}
                  >
                    <Picker.Item label="Select Chemical" value="" color={theme.textSecondary} />
                    {CHEMICALS.map((chem) => (
                      <Picker.Item key={chem} label={chem} value={chem} />
                    ))}
                  </Picker>
                </View>

                <View style={styles.quantitySection}>
                  <ThemedText style={styles.quantityLabel}>Quantity</ThemedText>
                  <View style={styles.quantityControls}>
                    <Pressable
                      style={[styles.quantityButton, { backgroundColor: theme.backgroundSecondary }]}
                      onPress={() => handleQuantityChange(row.id, -1)}
                    >
                      <Feather name="minus" size={20} color={theme.text} />
                    </Pressable>
                    <ThemedText style={styles.quantityValue}>{row.quantity}</ThemedText>
                    <Pressable
                      style={[styles.quantityButton, { backgroundColor: theme.backgroundSecondary }]}
                      onPress={() => handleQuantityChange(row.id, 1)}
                    >
                      <Feather name="plus" size={20} color={theme.text} />
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}

            <Pressable style={styles.addRowButton} onPress={handleAddRow}>
              <Feather name="plus-circle" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={[styles.addRowText, { color: BrandColors.azureBlue }]}>
                Add Another Chemical
              </ThemedText>
            </Pressable>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Urgency</ThemedText>
              <View style={[styles.pickerContainer, { borderColor: getUrgencyColor(urgency) }]}>
                <Picker
                  selectedValue={urgency}
                  onValueChange={(value: string) => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setUrgency(value);
                  }}
                  style={[styles.picker, { color: getUrgencyColor(urgency) }]}
                >
                  {URGENCY_OPTIONS.map((option) => (
                    <Picker.Item key={option} label={option} value={option} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.inputSection}>
              <ThemedText style={styles.inputLabel}>Notes (Optional)</ThemedText>
              <View style={[styles.textAreaContainer, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.textArea, { color: theme.text }]}
                  placeholder="Add special instructions..."
                  placeholderTextColor={theme.textSecondary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <BPButton
              variant="primary"
              onPress={handleSubmit}
              fullWidth
              disabled={!isValid}
            >
              Submit Order
            </BPButton>
          </View>
        </LinearGradient>
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
    maxHeight: '90%',
    overflow: 'hidden',
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
  chemicalRow: {
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  addRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  addRowText: {
    fontSize: 15,
    fontWeight: '600',
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
  },
  textArea: {
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 80,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
