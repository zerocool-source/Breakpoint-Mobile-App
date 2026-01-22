import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Haptics from 'expo-haptics';

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

const COMMON_CHEMICALS = [
  'Chlorine (Liquid)',
  'Muriatic Acid',
  'Tri-Chlor Tablets',
];

const OTHER_CHEMICALS = [
  'Algaecide Yellow Treat',
  'Chlorine Neutralizer',
  'Clarifier (Gold-N-Clear)',
  'Conditioner (CYA)',
  'DE Powder',
  'Defoamer',
  'Dichlor Granular',
  'Extreme Enzyme',
  'Non-Chlor Shock (MSP)',
  'Red Tile Soap',
  'Soda Ash',
  'Sodium Bicarbonate',
  'Test Strips',
  'Tri-Chlor Granular',
  'Other (Specify)',
];

const ALL_CHEMICALS = [...COMMON_CHEMICALS, ...OTHER_CHEMICALS];

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
                  {rows.length > 1 && (
                    <Pressable onPress={() => handleRemoveRow(row.id)}>
                      <Feather name="trash-2" size={18} color={BrandColors.danger} />
                    </Pressable>
                  )}
                </View>

                <View style={[styles.pickerContainer, { borderColor: theme.border }]}>
                  <Picker
                    selectedValue={row.chemical}
                    onValueChange={(value: string) => handleChemicalChange(row.id, value)}
                    style={[styles.picker, { color: theme.text }]}
                  >
                    <Picker.Item label="Select Chemical" value="" color={theme.textSecondary} />
                    <Picker.Item label="--- Most Common ---" value="" enabled={false} />
                    {COMMON_CHEMICALS.map((chem) => (
                      <Picker.Item key={chem} label={chem} value={chem} />
                    ))}
                    <Picker.Item label="--- Other ---" value="" enabled={false} />
                    {OTHER_CHEMICALS.map((chem) => (
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
  },
  addRowText: {
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
});
