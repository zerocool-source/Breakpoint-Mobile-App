import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockProperties, generateEstimateNumber } from '@/lib/mockData';
import type { EstimateItem } from '@/types';

export default function CreateEstimateModal() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [selectedProperty, setSelectedProperty] = useState('');
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [items, setItems] = useState<EstimateItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const estimateNumber = generateEstimateNumber();
  const selectedPropertyObj = mockProperties.find(p => p.id === selectedProperty);

  const calculateTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.09;
    return { subtotal, tax, total: subtotal + tax };
  };

  const totals = calculateTotal();

  const updateItem = (id: string, field: keyof EstimateItem, value: string | number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updated.amount = Number(updated.quantity) * Number(updated.rate);
        }
        return updated;
      })
    );
  };

  const addLineItem = () => {
    setItems(prev => [
      ...prev,
      { id: String(Date.now()), description: '', quantity: 1, rate: 0, amount: 0 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSaveDraft = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Draft Saved', 'Your estimate has been saved as a draft', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  const handleSendEstimate = async () => {
    if (!selectedProperty) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Validation Error', 'Please select a property');
      return;
    }

    const validItems = items.filter(item => item.description.trim() && item.amount > 0);
    if (validItems.length === 0) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Validation Error', 'Please add at least one line item');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Estimate Sent', 'Your estimate has been sent successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to send estimate. Please try again.');
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
        <View style={[styles.estimateHeader, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.estimateNumber}>{estimateNumber}</ThemedText>
          <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </ThemedText>
        </View>

        <View style={[styles.field, { zIndex: 10 }]}>
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

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Line Items</ThemedText>
            <Pressable onPress={addLineItem} style={styles.addButton}>
              <Feather name="plus" size={18} color={BrandColors.azureBlue} />
              <ThemedText style={styles.addButtonText}>Add Line</ThemedText>
            </Pressable>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={[styles.lineItem, { backgroundColor: theme.surface }]}>
              <View style={styles.lineItemHeader}>
                <ThemedText style={styles.lineItemNumber}>#{index + 1}</ThemedText>
                {items.length > 1 ? (
                  <Pressable onPress={() => removeLineItem(item.id)}>
                    <Feather name="trash-2" size={18} color={BrandColors.danger} />
                  </Pressable>
                ) : null}
              </View>

              <TextInput
                style={[styles.descriptionInput, { color: theme.text, borderColor: theme.border }]}
                placeholder="Description"
                placeholderTextColor={theme.textSecondary}
                value={item.description}
                onChangeText={(v) => updateItem(item.id, 'description', v)}
              />

              <View style={styles.lineItemRow}>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Qty</ThemedText>
                  <TextInput
                    style={[styles.numberInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="1"
                    placeholderTextColor={theme.textSecondary}
                    value={String(item.quantity)}
                    onChangeText={(v) => updateItem(item.id, 'quantity', Number(v) || 0)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputGroup}>
                  <ThemedText style={styles.inputLabel}>Rate</ThemedText>
                  <TextInput
                    style={[styles.numberInput, { color: theme.text, borderColor: theme.border }]}
                    placeholder="0.00"
                    placeholderTextColor={theme.textSecondary}
                    value={item.rate > 0 ? String(item.rate) : ''}
                    onChangeText={(v) => updateItem(item.id, 'rate', Number(v) || 0)}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.amountGroup}>
                  <ThemedText style={styles.inputLabel}>Amount</ThemedText>
                  <ThemedText style={styles.amountText}>{formatCurrency(item.amount)}</ThemedText>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.totalsCard, { backgroundColor: theme.surface }]}>
          <View style={styles.totalRow}>
            <ThemedText style={{ color: theme.textSecondary }}>Subtotal</ThemedText>
            <ThemedText>{formatCurrency(totals.subtotal)}</ThemedText>
          </View>
          <View style={styles.totalRow}>
            <ThemedText style={{ color: theme.textSecondary }}>Tax (9%)</ThemedText>
            <ThemedText>{formatCurrency(totals.tax)}</ThemedText>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <ThemedText style={styles.grandTotalLabel}>Total</ThemedText>
            <ThemedText style={styles.grandTotalValue}>{formatCurrency(totals.total)}</ThemedText>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <BPButton
            variant="outline"
            onPress={handleSaveDraft}
            style={styles.draftButton}
          >
            Save Draft
          </BPButton>
          <BPButton
            onPress={handleSendEstimate}
            loading={isSubmitting}
            style={styles.sendButton}
          >
            Send Estimate
          </BPButton>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  estimateHeader: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  estimateNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.azureBlue,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
  },
  field: {
    marginBottom: Spacing.xl,
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.azureBlue,
    marginLeft: 4,
  },
  lineItem: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  lineItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  lineItemNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.azureBlue,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 15,
    marginBottom: Spacing.md,
  },
  lineItemRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: BrandColors.textSecondary,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 15,
    textAlign: 'center',
  },
  amountGroup: {
    flex: 1.2,
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  totalsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: BrandColors.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: 0,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.emerald,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  draftButton: {
    flex: 1,
  },
  sendButton: {
    flex: 1,
  },
});
