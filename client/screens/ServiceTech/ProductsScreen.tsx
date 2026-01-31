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

export default function ServiceTechProductsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

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

  const handleSubmitRepair = useCallback(async () => {
    if (!selectedProperty || selectedItems.length === 0) return;
    
    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setShowRepairModal(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedItems([]);
        setSelectedProperty('');
        setNotes('');
      }, 3000);
    }, 1000);
  }, [selectedProperty, selectedItems]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
      <View style={[styles.infoBanner, { backgroundColor: BrandColors.tropicalTeal + '20' }]}>
        <Feather name="info" size={18} color={BrandColors.tropicalTeal} />
        <ThemedText style={[styles.infoBannerText, { color: BrandColors.tropicalTeal }]}>
          Items you add to repairs are automatically tracked for your commission
        </ThemedText>
      </View>

      <ProductCatalog
        role="service_tech"
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
          <Feather name="tool" size={24} color="#fff" />
          <ThemedText style={styles.cartButtonText}>
            Submit Repair ({selectedItems.length} items)
          </ThemedText>
        </Pressable>
      ) : null}

      {showSuccess ? (
        <View style={styles.successOverlay}>
          <View style={[styles.successCard, { backgroundColor: theme.surface }]}>
            <View style={styles.successIcon}>
              <Feather name="check-circle" size={48} color={BrandColors.emerald} />
            </View>
            <ThemedText style={styles.successTitle}>Repair Submitted!</ThemedText>
            <ThemedText style={[styles.successText, { color: theme.textSecondary }]}>
              Your repair has been submitted and will be tracked for commission automatically.
            </ThemedText>
          </View>
        </View>
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
            <ThemedText style={styles.modalTitle}>Submit Repair Request</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
            <View style={[styles.commissionBanner, { backgroundColor: BrandColors.emerald + '20' }]}>
              <Feather name="dollar-sign" size={20} color={BrandColors.emerald} />
              <View style={styles.commissionBannerText}>
                <ThemedText style={[styles.commissionTitle, { color: BrandColors.emerald }]}>
                  Commission Tracking
                </ThemedText>
                <ThemedText style={[styles.commissionSubtext, { color: theme.textSecondary }]}>
                  These items will be automatically added to your commission tracker
                </ThemedText>
              </View>
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Property</ThemedText>
              <View style={[styles.picker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Pressable style={styles.pickerTouchable}>
                  <TextInput
                    style={[styles.pickerInput, { color: theme.text }]}
                    placeholder="Search property..."
                    placeholderTextColor={theme.textSecondary}
                    value={selectedProperty}
                    onChangeText={setSelectedProperty}
                  />
                </Pressable>
              </View>
              {selectedProperty.length > 0 ? (
                <ScrollView style={styles.propertyDropdown} nestedScrollEnabled>
                  {mockProperties
                    .filter(p => p.name.toLowerCase().includes(selectedProperty.toLowerCase()))
                    .slice(0, 5)
                    .map(prop => (
                      <Pressable
                        key={prop.id}
                        onPress={() => setSelectedProperty(prop.name)}
                        style={[styles.propertyOption, { backgroundColor: theme.surface }]}
                      >
                        <ThemedText>{prop.name}</ThemedText>
                      </Pressable>
                    ))}
                </ScrollView>
              ) : null}
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Repair Items ({selectedItems.length})</ThemedText>
              {selectedItems.map(item => (
                <View key={item.product.sku} style={[styles.itemCard, { backgroundColor: theme.surface }]}>
                  <View style={styles.itemInfo}>
                    <ThemedText style={styles.itemName}>{item.product.name}</ThemedText>
                    <ThemedText style={[styles.itemSku, { color: theme.textSecondary }]}>
                      {item.product.sku} • Qty: {item.quantity}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removeItem(item.product.sku)}>
                    <Feather name="trash-2" size={18} color={BrandColors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <ThemedText style={styles.sectionTitle}>Description of Issue</ThemedText>
              <TextInput
                style={[styles.notesInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                placeholder="Describe what needs to be repaired..."
                placeholderTextColor={theme.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
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
              <Feather name="send" size={20} color="#fff" />
              <ThemedText style={styles.submitButtonText}>
                {isSubmitting ? 'Submitting...' : 'Submit Repair Request'}
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
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
  },
  cartButton: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: BrandColors.tropicalTeal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  cartBadge: {
    backgroundColor: BrandColors.vividTangerine,
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
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  successCard: {
    width: '80%',
    maxWidth: 320,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.card,
  },
  successIcon: {
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
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
  commissionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  commissionBannerText: {
    flex: 1,
  },
  commissionTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  commissionSubtext: {
    fontSize: 13,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  picker: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickerTouchable: {
    padding: Spacing.lg,
  },
  pickerInput: {
    fontSize: 16,
  },
  propertyDropdown: {
    maxHeight: 200,
    marginTop: Spacing.sm,
  },
  propertyOption: {
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
  notesInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalFooter: {
    padding: Spacing.lg,
    ...Shadows.card,
  },
  submitButton: {
    backgroundColor: BrandColors.tropicalTeal,
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
