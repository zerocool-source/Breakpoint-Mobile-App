import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { ProductCatalog } from '@/components/ProductCatalog';
import { HeritageProduct } from '@/lib/heritageProducts';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockProperties } from '@/lib/mockData';

interface SelectedItem {
  product: HeritageProduct;
  quantity: number;
}

export default function SupervisorProductsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [assignedTech, setAssignedTech] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const technicians = [
    { id: '1', name: 'John Martinez' },
    { id: '2', name: 'Sarah Chen' },
    { id: '3', name: 'Mike Thompson' },
    { id: '4', name: 'Emily Rodriguez' },
  ];

  const handleSelectProduct = useCallback((product: HeritageProduct, quantity: number) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.product.sku === product.sku);
      if (existing) {
        return prev.map(i =>
          i.product.sku === product.sku
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeItem = useCallback((sku: string) => {
    setSelectedItems(prev => prev.filter(i => i.product.sku !== sku));
  }, []);

  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSubmitRepair = useCallback(async () => {
    if (!selectedProperty || selectedItems.length === 0) return;
    
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setShowRepairModal(false);
      setSelectedItems([]);
      setSelectedProperty('');
      setAssignedTech('');
      setNotes('');
      setPriority('normal');
    }, 1000);
  }, [selectedProperty, selectedItems]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
      <ProductCatalog
        role="supervisor"
        selectionMode={true}
        onSelectProduct={handleSelectProduct}
      />

      {selectedItems.length > 0 ? (
        <Pressable
          onPress={() => setShowRepairModal(true)}
          style={styles.cartButton}
        >
          <View style={styles.cartBadge}>
            <ThemedText style={styles.cartBadgeText}>{selectedItems.length}</ThemedText>
          </View>
          <Feather name="clipboard" size={24} color="#fff" />
          <ThemedText style={styles.cartButtonText}>
            Create Work Order (${totalAmount.toFixed(2)})
          </ThemedText>
        </Pressable>
      ) : null}

      <Modal
        visible={showRepairModal}
        animationType="slide"
        onRequestClose={() => setShowRepairModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.surface, paddingTop: insets.top }]}>
            <Pressable onPress={() => setShowRepairModal(false)}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText style={styles.modalTitle}>Create Work Order</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Priority</ThemedText>
              <View style={styles.priorityContainer}>
                <Pressable
                  onPress={() => setPriority('normal')}
                  style={[
                    styles.priorityButton,
                    { backgroundColor: priority === 'normal' ? BrandColors.azureBlue : theme.surface },
                  ]}
                >
                  <ThemedText style={[styles.priorityText, priority === 'normal' && { color: '#fff' }]}>
                    Normal
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setPriority('urgent')}
                  style={[
                    styles.priorityButton,
                    { backgroundColor: priority === 'urgent' ? BrandColors.danger : theme.surface },
                  ]}
                >
                  <ThemedText style={[styles.priorityText, priority === 'urgent' && { color: '#fff' }]}>
                    Urgent
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Property</ThemedText>
              <View style={[styles.picker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.pickerInput, { color: theme.text }]}
                  placeholder="Search property..."
                  placeholderTextColor={theme.textSecondary}
                  value={selectedProperty}
                  onChangeText={setSelectedProperty}
                />
              </View>
              {selectedProperty.length > 0 ? (
                <ScrollView style={styles.dropdown} nestedScrollEnabled>
                  {mockProperties
                    .filter(p => p.name.toLowerCase().includes(selectedProperty.toLowerCase()))
                    .slice(0, 5)
                    .map(prop => (
                      <Pressable
                        key={prop.id}
                        onPress={() => setSelectedProperty(prop.name)}
                        style={[styles.dropdownOption, { backgroundColor: theme.surface }]}
                      >
                        <ThemedText>{prop.name}</ThemedText>
                      </Pressable>
                    ))}
                </ScrollView>
              ) : null}
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Assign Technician</ThemedText>
              <View style={[styles.picker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.pickerInput, { color: theme.text }]}
                  placeholder="Search technician..."
                  placeholderTextColor={theme.textSecondary}
                  value={assignedTech}
                  onChangeText={setAssignedTech}
                />
              </View>
              {assignedTech.length > 0 ? (
                <ScrollView style={styles.dropdown} nestedScrollEnabled>
                  {technicians
                    .filter(t => t.name.toLowerCase().includes(assignedTech.toLowerCase()))
                    .map(tech => (
                      <Pressable
                        key={tech.id}
                        onPress={() => setAssignedTech(tech.name)}
                        style={[styles.dropdownOption, { backgroundColor: theme.surface }]}
                      >
                        <ThemedText>{tech.name}</ThemedText>
                      </Pressable>
                    ))}
                </ScrollView>
              ) : null}
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Work Order Items ({selectedItems.length})</ThemedText>
              {selectedItems.map(item => (
                <View key={item.product.sku} style={[styles.itemCard, { backgroundColor: theme.surface }]}>
                  <View style={styles.itemInfo}>
                    <ThemedText style={styles.itemName}>{item.product.name}</ThemedText>
                    <ThemedText style={[styles.itemSku, { color: theme.textSecondary }]}>
                      {item.product.sku} • Qty: {item.quantity}
                    </ThemedText>
                  </View>
                  <View style={styles.itemPricing}>
                    <ThemedText style={styles.itemPrice}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </ThemedText>
                    <Pressable onPress={() => removeItem(item.product.sku)}>
                      <Feather name="trash-2" size={18} color={BrandColors.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Work Order Notes</ThemedText>
              <TextInput
                style={[styles.notesInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                placeholder="Add detailed instructions..."
                placeholderTextColor={theme.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={[styles.totalSection, { backgroundColor: theme.surface }]}>
              <ThemedText style={styles.totalLabel}>Work Order Total</ThemedText>
              <ThemedText style={styles.totalAmount}>${totalAmount.toFixed(2)}</ThemedText>
            </View>
          </ScrollView>

          <View style={[styles.modalFooter, { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.md }]}>
            <Pressable
              onPress={handleSubmitRepair}
              disabled={!selectedProperty || selectedItems.length === 0 || isSubmitting}
              style={[
                styles.submitButton,
                (!selectedProperty || selectedItems.length === 0) && styles.submitButtonDisabled,
              ]}
            >
              <Feather name="check-circle" size={20} color="#fff" />
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? 'Creating...' : 'Create Work Order'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cartButton: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: BrandColors.vividTangerine,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  cartBadge: {
    backgroundColor: BrandColors.azureBlue,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    ...Shadows.card,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  priorityButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 15,
    fontWeight: '500',
  },
  picker: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.lg,
  },
  pickerInput: {
    fontSize: 16,
  },
  dropdown: {
    maxHeight: 200,
    marginTop: Spacing.sm,
  },
  dropdownOption: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemSku: {
    fontSize: 12,
  },
  itemPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.azureBlue,
  },
  notesInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  totalSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
  modalFooter: {
    padding: Spacing.lg,
    ...Shadows.card,
  },
  submitButton: {
    backgroundColor: BrandColors.vividTangerine,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
