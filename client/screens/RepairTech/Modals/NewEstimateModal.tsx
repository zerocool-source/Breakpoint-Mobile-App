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

interface LineItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  rate: number;
}

interface Product {
  sku: string;
  name: string;
  category: string;
  rate: number;
}

const PRODUCT_CATALOG: Product[] = [
  { sku: 'PUMP-001', name: 'Hayward Super Pump 1.5HP', category: 'Pumps', rate: 549.00 },
  { sku: 'PUMP-002', name: 'Pentair IntelliFlo VSF', category: 'Pumps', rate: 1549.00 },
  { sku: 'PUMP-003', name: 'Jandy FloPro Pump', category: 'Pumps', rate: 425.00 },
  { sku: 'FILT-001', name: 'Hayward SwimClear Cartridge Filter', category: 'Filters', rate: 899.00 },
  { sku: 'FILT-002', name: 'Pentair Clean & Clear Plus', category: 'Filters', rate: 749.00 },
  { sku: 'FILT-003', name: 'Hayward Pro-Grid DE Filter', category: 'Filters', rate: 1249.00 },
  { sku: 'HEAT-001', name: 'Hayward H400FD Gas Heater', category: 'Heaters', rate: 3299.00 },
  { sku: 'HEAT-002', name: 'Pentair MasterTemp 400', category: 'Heaters', rate: 3599.00 },
  { sku: 'CHEM-001', name: 'Chemical Controller System', category: 'Automation', rate: 1899.00 },
  { sku: 'AUTO-001', name: 'Pentair IntelliChem Controller', category: 'Automation', rate: 2199.00 },
  { sku: 'VALV-001', name: 'Jandy 2-Way Valve 2"', category: 'Valves', rate: 89.00 },
  { sku: 'VALV-002', name: 'Pentair 3-Way Valve', category: 'Valves', rate: 129.00 },
  { sku: 'LABOR-001', name: 'Standard Labor (per hour)', category: 'Labor', rate: 95.00 },
  { sku: 'LABOR-002', name: 'Emergency Labor (per hour)', category: 'Labor', rate: 145.00 },
  { sku: 'LABOR-003', name: 'Pump Installation Labor', category: 'Labor', rate: 350.00 },
  { sku: 'LABOR-004', name: 'Filter Installation Labor', category: 'Labor', rate: 275.00 },
  { sku: 'LABOR-005', name: 'Heater Installation Labor', category: 'Labor', rate: 650.00 },
];

interface NewEstimateModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

interface ProductPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
}

function ProductPicker({ visible, onClose, onSelect }: ProductPickerProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(PRODUCT_CATALOG.map(p => p.category))];

  const filteredProducts = PRODUCT_CATALOG.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={pickerStyles.overlay}>
        <View style={[pickerStyles.container, { backgroundColor: theme.surface }]}>
          <View style={pickerStyles.header}>
            <Pressable onPress={onClose}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText style={pickerStyles.title}>Product Catalog</ThemedText>
            <View style={{ width: 24 }} />
          </View>

          <View style={[pickerStyles.searchContainer, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
            <Feather name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={[pickerStyles.searchInput, { color: theme.text }]}
              placeholder="Search products or SKU..."
              placeholderTextColor={theme.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={pickerStyles.categoriesContainer}
            contentContainerStyle={pickerStyles.categoriesContent}
          >
            <Pressable
              style={[
                pickerStyles.categoryPill,
                !selectedCategory && { backgroundColor: BrandColors.azureBlue }
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <ThemedText style={[
                pickerStyles.categoryText,
                !selectedCategory && { color: '#FFFFFF' }
              ]}>All</ThemedText>
            </Pressable>
            {categories.map(cat => (
              <Pressable
                key={cat}
                style={[
                  pickerStyles.categoryPill,
                  selectedCategory === cat && { backgroundColor: BrandColors.azureBlue }
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <ThemedText style={[
                  pickerStyles.categoryText,
                  selectedCategory === cat && { color: '#FFFFFF' }
                ]}>{cat}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView 
            style={pickerStyles.productList}
            contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.lg }}
          >
            {filteredProducts.map(product => (
              <Pressable
                key={product.sku}
                style={[pickerStyles.productItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  onSelect(product);
                }}
              >
                <View style={pickerStyles.productInfo}>
                  <ThemedText style={pickerStyles.productName}>{product.name}</ThemedText>
                  <ThemedText style={[pickerStyles.productSku, { color: theme.textSecondary }]}>{product.sku}</ThemedText>
                </View>
                <View style={pickerStyles.productPrice}>
                  <ThemedText style={[pickerStyles.priceText, { color: BrandColors.emerald }]}>
                    ${product.rate.toFixed(2)}
                  </ThemedText>
                  <Feather name="plus-circle" size={20} color={BrandColors.azureBlue} />
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function NewEstimateModal({ visible, onClose, onSubmit }: NewEstimateModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();

  const [status, setStatus] = useState('Draft');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showProductPicker, setShowProductPicker] = useState(false);

  const estimateNumber = `EST-${new Date().getFullYear().toString().slice(-2)}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  const handleAddProduct = (product: Product) => {
    const existingIndex = lineItems.findIndex(item => item.sku === product.sku);
    if (existingIndex >= 0) {
      setLineItems(prev => prev.map((item, i) => 
        i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setLineItems(prev => [...prev, {
        id: `${Date.now()}`,
        sku: product.sku,
        name: product.name,
        quantity: 1,
        rate: product.rate,
      }]);
    }
    setShowProductPicker(false);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const handleRemoveItem = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmit = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSubmit({ estimateNumber, status, location, description, photos, lineItems, subtotal, tax, total });
    onClose();
  };

  const handleSaveDraft = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onSubmit({ estimateNumber, status: 'Draft', location, description, photos, lineItems, subtotal, tax, total });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface, maxHeight: windowHeight * 0.95 }]}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Feather name="chevron-left" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={styles.title}>New Estimate</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <View style={[styles.estimateNumberBadge, { backgroundColor: BrandColors.azureBlue + '15' }]}>
            <ThemedText style={[styles.estimateNumberText, { color: BrandColors.azureBlue }]}>
              {estimateNumber}
            </ThemedText>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.row}>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>STATUS</ThemedText>
                <View style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                  <ThemedText>{status}</ThemedText>
                  <Feather name="chevron-down" size={18} color={theme.textSecondary} />
                </View>
              </View>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>REPAIR TECH</ThemedText>
                <View style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                  <ThemedText>Rick Jacobs</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>SERVICE TECH</ThemedText>
                <View style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                  <ThemedText style={{ color: theme.textSecondary }}></ThemedText>
                </View>
              </View>
              <View style={styles.halfField}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>REPORTED DATE</ThemedText>
                <View style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                  <ThemedText>{new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</ThemedText>
                  <Feather name="calendar" size={18} color={theme.textSecondary} />
                </View>
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>LOCATION</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                placeholder="Property name"
                placeholderTextColor={theme.textSecondary}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>QUOTE DESCRIPTION</ThemedText>
                <Pressable style={styles.voiceButton}>
                  <Feather name="mic" size={16} color={BrandColors.vividTangerine} />
                  <ThemedText style={[styles.voiceText, { color: BrandColors.vividTangerine }]}>Voice</ThemedText>
                </Pressable>
              </View>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                placeholder="Describe the job, what needs to be done, findings from inspection..."
                placeholderTextColor={theme.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>PHOTOS</ThemedText>
                <Pressable style={styles.addPhotoButton}>
                  <Feather name="camera" size={16} color={BrandColors.vividTangerine} />
                  <ThemedText style={[styles.addPhotoText, { color: BrandColors.vividTangerine }]}>Add Photo</ThemedText>
                </Pressable>
              </View>
              <View style={[styles.photoArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <Feather name="camera" size={32} color={theme.textSecondary} />
                <ThemedText style={[styles.noPhotosText, { color: theme.textSecondary }]}>No photos attached</ThemedText>
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <ThemedText style={styles.lineItemsTitle}>Product or Service</ThemedText>
                <Pressable onPress={() => setShowProductPicker(true)}>
                  <ThemedText style={[styles.addLineText, { color: BrandColors.azureBlue }]}>+ Add Line</ThemedText>
                </Pressable>
              </View>
              <View style={[styles.lineItemsHeader, { borderBottomColor: theme.border }]}>
                <ThemedText style={[styles.lineItemCol, { color: theme.textSecondary, flex: 0.5 }]}>#</ThemedText>
                <ThemedText style={[styles.lineItemCol, { color: theme.textSecondary, flex: 2 }]}>PRODUCT/SKU</ThemedText>
                <ThemedText style={[styles.lineItemCol, { color: theme.textSecondary, flex: 1 }]}>QTY</ThemedText>
                <ThemedText style={[styles.lineItemCol, { color: theme.textSecondary, flex: 1 }]}>RATE</ThemedText>
                <ThemedText style={[styles.lineItemCol, { color: theme.textSecondary, flex: 1 }]}>AMOUNT</ThemedText>
              </View>

              {lineItems.length === 0 ? (
                <View style={[styles.emptyLineItems, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                  <Feather name="package" size={24} color={theme.textSecondary} />
                  <ThemedText style={[styles.emptyLineItemsText, { color: theme.textSecondary }]}>
                    No items added yet. Tap "+ Add Line" to select products.
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.lineItemsList}>
                  {lineItems.map((item, index) => (
                    <View key={item.id} style={[styles.lineItemRow, { borderBottomColor: theme.border }]}>
                      <ThemedText style={[styles.lineItemCol, { flex: 0.5 }]}>{index + 1}</ThemedText>
                      <View style={{ flex: 2 }}>
                        <ThemedText style={styles.lineItemName} numberOfLines={1}>{item.name}</ThemedText>
                        <ThemedText style={[styles.lineItemSku, { color: theme.textSecondary }]}>{item.sku}</ThemedText>
                      </View>
                      <View style={[styles.qtyControls, { flex: 1 }]}>
                        <Pressable onPress={() => handleUpdateQuantity(item.id, -1)} style={styles.qtyButton}>
                          <Feather name="minus" size={14} color={BrandColors.danger} />
                        </Pressable>
                        <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
                        <Pressable onPress={() => handleUpdateQuantity(item.id, 1)} style={styles.qtyButton}>
                          <Feather name="plus" size={14} color={BrandColors.emerald} />
                        </Pressable>
                      </View>
                      <ThemedText style={[styles.lineItemCol, { flex: 1 }]}>${item.rate.toFixed(0)}</ThemedText>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <ThemedText style={[styles.lineItemAmount, { color: BrandColors.emerald }]}>
                          ${(item.quantity * item.rate).toFixed(0)}
                        </ThemedText>
                        <Pressable onPress={() => handleRemoveItem(item.id)}>
                          <Feather name="trash-2" size={14} color={BrandColors.danger} />
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {lineItems.length > 0 ? (
              <View style={[styles.totalsSection, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <View style={styles.totalRow}>
                  <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>Subtotal</ThemedText>
                  <ThemedText style={styles.totalValue}>${subtotal.toFixed(2)}</ThemedText>
                </View>
                <View style={styles.totalRow}>
                  <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>Tax (8.25%)</ThemedText>
                  <ThemedText style={styles.totalValue}>${tax.toFixed(2)}</ThemedText>
                </View>
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <ThemedText style={styles.grandTotalLabel}>TOTAL</ThemedText>
                  <ThemedText style={[styles.grandTotalValue, { color: BrandColors.emerald }]}>${total.toFixed(2)}</ThemedText>
                </View>
              </View>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.surface }]}>
            <Pressable
              style={[styles.sendButton, { backgroundColor: BrandColors.vividTangerine }]}
              onPress={handleSubmit}
            >
              <ThemedText style={styles.sendButtonText}>Send Estimate</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.draftButton, { borderColor: theme.border }]}
              onPress={handleSaveDraft}
            >
              <View style={[styles.draftHandle, { backgroundColor: theme.textSecondary }]} />
              <ThemedText style={styles.draftButtonText}>Save Draft</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      <ProductPicker
        visible={showProductPicker}
        onClose={() => setShowProductPicker(false)}
        onSelect={handleAddProduct}
      />
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '80%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesContainer: {
    maxHeight: 48,
    marginTop: Spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  productList: {
    flex: 1,
    marginTop: Spacing.md,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  productSku: {
    fontSize: 12,
  },
  productPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
  estimateNumberBadge: {
    alignSelf: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  estimateNumberText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  halfField: {
    flex: 1,
  },
  field: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 44,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 44,
  },
  textArea: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: 16,
    minHeight: 100,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  voiceText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '500',
  },
  photoArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: Spacing.sm,
  },
  noPhotosText: {
    fontSize: 14,
  },
  lineItemsTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  addLineText: {
    fontSize: 14,
    fontWeight: '600',
  },
  lineItemsHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  lineItemCol: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyLineItems: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  emptyLineItemsText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },
  lineItemsList: {
    marginTop: Spacing.xs,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  lineItemName: {
    fontSize: 13,
    fontWeight: '600',
  },
  lineItemSku: {
    fontSize: 10,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  qtyButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 20,
    textAlign: 'center',
  },
  lineItemAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  totalsSection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  footer: {
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sendButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  draftButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  draftHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  draftButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
