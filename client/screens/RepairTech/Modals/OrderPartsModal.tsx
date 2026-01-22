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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface OrderPartsModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export function OrderPartsModal({ visible, onClose, onSubmit }: OrderPartsModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [property, setProperty] = useState('');
  const [partName, setPartName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [urgency, setUrgency] = useState('Normal');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSubmit({ property, partName, quantity, urgency, notes });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface, maxHeight: windowHeight * 0.9 }]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Feather name="chevron-left" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={styles.title}>Order Parts</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Property</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                placeholder="Enter property name"
                placeholderTextColor={theme.textSecondary}
                value={property}
                onChangeText={setProperty}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Part Name/Description</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                placeholder="Enter part name or description"
                placeholderTextColor={theme.textSecondary}
                value={partName}
                onChangeText={setPartName}
              />
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Quantity</ThemedText>
              <View style={[styles.quantityField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.quantityInput, { color: theme.text }]}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                />
                <View style={styles.quantityButtons}>
                  <Pressable
                    onPress={() => setQuantity(String(Math.max(1, parseInt(quantity) - 1)))}
                    style={styles.quantityButton}
                  >
                    <Feather name="minus" size={16} color={theme.textSecondary} />
                  </Pressable>
                  <Pressable
                    onPress={() => setQuantity(String(parseInt(quantity) + 1))}
                    style={styles.quantityButton}
                  >
                    <Feather name="plus" size={16} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Urgency</ThemedText>
              <Pressable style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <ThemedText style={{ color: theme.text }}>{urgency}</ThemedText>
                <Feather name="chevron-down" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Notes</ThemedText>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                placeholder="Additional notes or instructions..."
                placeholderTextColor={theme.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.surface }]}>
            <Pressable
              style={[styles.submitButton, { backgroundColor: BrandColors.vividTangerine }]}
              onPress={handleSubmit}
            >
              <ThemedText style={styles.submitButtonText}>Submit Order</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.cancelActionButton, { borderColor: theme.border }]}
              onPress={onClose}
            >
              <View style={[styles.handle, { backgroundColor: theme.textSecondary }]} />
              <ThemedText style={styles.cancelActionText}>Cancel</ThemedText>
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
    ...Shadows.large,
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
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 15,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  quantityField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  quantityInput: {
    fontSize: 16,
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  quantityButtons: {
    flexDirection: 'row',
  },
  quantityButton: {
    padding: Spacing.sm,
  },
  textArea: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 100,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelActionButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  cancelActionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
