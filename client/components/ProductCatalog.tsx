import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { getLocalApiUrl, joinUrl } from '@/lib/query-client';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import {
  HERITAGE_PRODUCTS,
  HERITAGE_CATEGORIES,
  HeritageProduct,
  HeritageCategory,
  getProductsByCategory,
  getSubcategories,
} from '@/lib/heritageProducts';

export type ProductCatalogRole = 'repair_tech' | 'service_tech' | 'supervisor';

interface ProductCatalogProps {
  role: ProductCatalogRole;
  onSelectProduct?: (product: HeritageProduct, quantity: number) => void;
  selectionMode?: boolean;
}

interface SelectedProduct extends HeritageProduct {
  quantity: number;
}

interface PoolBrainProduct {
  sku: string;
  heritageNumber: string;
  name: string;
  category: string;
  subcategory: string;
  price: number;
  cost: number;
  unit: string;
  manufacturer: string;
  description: string;
  productId: number;
}

export function ProductCatalog({ role, onSelectProduct, selectionMode = false }: ProductCatalogProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedForQuantity, setSelectedForQuantity] = useState<HeritageProduct | PoolBrainProduct | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const showPricing = role === 'repair_tech' || role === 'supervisor';

  const { data: poolBrainData, isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['/api/poolbrain/products'],
    queryFn: async () => {
      const apiUrl = getLocalApiUrl();
      const response = await fetch(joinUrl(apiUrl, '/api/poolbrain/products'));
      const data = await response.json();
      if (!response.ok || data.serviceAvailable === false) {
        throw new Error(data.message || 'Product catalog service temporarily unavailable');
      }
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const products: PoolBrainProduct[] = poolBrainData?.data ?? [];
  const serviceAvailable = poolBrainData?.serviceAvailable !== false && products.length > 0;

  const categories = useMemo(() => {
    if (serviceAvailable) {
      // Include "Plumbing" category for specialty parts
      const cats = [...new Set([...products.map(p => p.category), 'Plumbing'])].filter(Boolean).sort();
      return cats;
    }
    return HERITAGE_CATEGORIES as unknown as string[];
  }, [products, serviceAvailable]);

  const startVoiceSearch = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Voice Search',
        'Voice search requires running in Expo Go on your mobile device. Scan the QR code to use this feature.',
        [{ text: 'OK' }]
      );
      return;
    }
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert(
          'Permission Required',
          'Microphone permission is needed for voice search.',
          [{ text: 'OK' }]
        );
        return;
      }
      
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      audioRecorder.record();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start voice recording:', error);
      Alert.alert('Error', 'Failed to start voice recording. Please try again.');
    }
  };

  const stopVoiceSearch = async () => {
    try {
      await audioRecorder.stop();
      setIsRecording(false);
      setIsTranscribing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = audioRecorder.uri;
      if (!uri) {
        setIsTranscribing(false);
        return;
      }

      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      const apiUrl = getLocalApiUrl();
      const response = await fetch(joinUrl(apiUrl, '/api/transcribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.text) {
          setSearch(data.text);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
      setIsTranscribing(false);
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      setIsTranscribing(false);
    }
  };

  const subcategories = useMemo(() => {
    if (!selectedCategory) return [];
    if (serviceAvailable) {
      const subs = products
        .filter(p => p.category === selectedCategory)
        .map(p => p.subcategory)
        .filter(Boolean);
      return [...new Set(subs)].sort();
    }
    return getSubcategories(selectedCategory as HeritageCategory);
  }, [selectedCategory, products, serviceAvailable]);

  // Known plumbing parts that aren't in Pool Brain catalog
  const plumbingParts: PoolBrainProduct[] = useMemo(() => [
    { sku: 'PLUMB-MISSION-4', heritageNumber: '', name: '4" Mission Clamp (no-hub coupling)', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 24.99, cost: 15, unit: 'each', manufacturer: '', description: 'No-hub coupling for cast iron to PVC connection', productId: 0 },
    { sku: 'PLUMB-SANT-4', heritageNumber: '', name: '4" Sanitary Tee (San T)', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 38.50, cost: 22, unit: 'each', manufacturer: '', description: 'DWV sanitary tee for drain connections', productId: 0 },
    { sku: 'PLUMB-SANT-PLUG-4', heritageNumber: '', name: '4" San T with Threaded Service Plug', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 45.00, cost: 28, unit: 'each', manufacturer: '', description: 'Sanitary tee with access plug', productId: 0 },
    { sku: 'PLUMB-PLUG-4', heritageNumber: '', name: '4" Threaded Service Plug', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 12.99, cost: 7, unit: 'each', manufacturer: '', description: 'Threaded cleanout plug', productId: 0 },
    { sku: 'PLUMB-90-4', heritageNumber: '', name: '4" DWV 90° Elbow', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 18.75, cost: 10, unit: 'each', manufacturer: '', description: '90 degree elbow for drain piping', productId: 0 },
    { sku: 'PLUMB-45-4', heritageNumber: '', name: '4" DWV 45° Elbow', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 16.50, cost: 9, unit: 'each', manufacturer: '', description: '45 degree elbow for drain piping', productId: 0 },
    { sku: 'PLUMB-PTRAP-4', heritageNumber: '', name: '4" P-Trap', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 42.00, cost: 25, unit: 'each', manufacturer: '', description: 'P-trap for proper drainage', productId: 0 },
    { sku: 'PLUMB-CONE-4-5', heritageNumber: '', name: '4" to 5" Backwash Cone Increaser', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 34.99, cost: 20, unit: 'each', manufacturer: '', description: 'Backwash cone increaser for filter discharge', productId: 0 },
    { sku: 'PLUMB-STRUT', heritageNumber: '', name: 'Shallow Strut Channel (per foot)', category: 'Plumbing', subcategory: 'Supports', price: 8.50, cost: 5, unit: 'foot', manufacturer: '', description: 'Strut channel for pipe support', productId: 0 },
    { sku: 'PLUMB-STRUT-CLAMP-4', heritageNumber: '', name: '4" Strut Clamp', category: 'Plumbing', subcategory: 'Supports', price: 12.00, cost: 7, unit: 'each', manufacturer: '', description: 'Strut clamp for 4" pipe', productId: 0 },
    { sku: 'PLUMB-STRUT-L', heritageNumber: '', name: 'Strut L-Bracket', category: 'Plumbing', subcategory: 'Supports', price: 8.50, cost: 5, unit: 'each', manufacturer: '', description: 'L-bracket for strut mounting', productId: 0 },
    { sku: 'PLUMB-ANCHOR-SS', heritageNumber: '', name: 'Stainless Steel Red Head Anchor 3/8"x3"', category: 'Plumbing', subcategory: 'Supports', price: 4.25, cost: 2.50, unit: 'each', manufacturer: 'Red Head', description: 'SS concrete anchor', productId: 0 },
    { sku: 'PLUMB-CLEANOUT-4', heritageNumber: '', name: '4" Cleanout w/ Plug', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 28.50, cost: 16, unit: 'each', manufacturer: '', description: 'Cleanout fitting with plug', productId: 0 },
    { sku: 'PLUMB-AIRGAP-1', heritageNumber: '', name: '1" Air Gap/Siphon Break Fitting', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 45.00, cost: 28, unit: 'each', manufacturer: '', description: 'Air gap fitting to prevent siphon', productId: 0 },
    { sku: 'PLUMB-FERNCO-4', heritageNumber: '', name: 'Fernco Flexible Coupling 4"', category: 'Plumbing', subcategory: 'Drain & Backwash', price: 18.99, cost: 11, unit: 'each', manufacturer: 'Fernco', description: 'Flexible rubber coupling', productId: 0 },
  ], []);

  const filteredProducts = useMemo(() => {
    let prods: (HeritageProduct | PoolBrainProduct)[];
    
    if (serviceAvailable) {
      // Include plumbing parts in catalog
      prods = [...products, ...plumbingParts];
      if (selectedCategory) {
        prods = prods.filter(p => p.category === selectedCategory);
      }
    } else {
      prods = selectedCategory
        ? getProductsByCategory(selectedCategory as HeritageCategory)
        : HERITAGE_PRODUCTS;
    }

    if (selectedSubcategory) {
      prods = prods.filter(p => p.subcategory === selectedSubcategory);
    }

    if (search.trim()) {
      const lower = search.toLowerCase();
      prods = prods.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.sku.toLowerCase().includes(lower) ||
        ('heritageNumber' in p && p.heritageNumber.toLowerCase().includes(lower)) ||
        ('manufacturer' in p && p.manufacturer.toLowerCase().includes(lower)) ||
        ('description' in p && p.description?.toLowerCase().includes(lower))
      );
    }

    return prods;
  }, [selectedCategory, selectedSubcategory, search, products, serviceAvailable, plumbingParts]);

  const handleProductPress = useCallback((product: HeritageProduct | PoolBrainProduct) => {
    if (selectionMode && onSelectProduct) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedForQuantity(product);
      setQuantity('1');
      setQuantityModalVisible(true);
    }
  }, [selectionMode, onSelectProduct]);

  const confirmQuantity = useCallback(() => {
    if (selectedForQuantity && onSelectProduct) {
      const qty = parseInt(quantity) || 1;
      const productAsHeritage: HeritageProduct = {
        sku: selectedForQuantity.sku,
        heritageNumber: 'heritageNumber' in selectedForQuantity ? selectedForQuantity.heritageNumber : '',
        name: selectedForQuantity.name,
        category: selectedForQuantity.category as HeritageCategory,
        subcategory: selectedForQuantity.subcategory,
        price: selectedForQuantity.price,
        unit: selectedForQuantity.unit,
        manufacturer: 'manufacturer' in selectedForQuantity ? selectedForQuantity.manufacturer : '',
      };
      onSelectProduct(productAsHeritage, qty);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setQuantityModalVisible(false);
    setSelectedForQuantity(null);
    setQuantity('1');
  }, [selectedForQuantity, quantity, onSelectProduct]);

  const renderCategoryChip = ({ item }: { item: string }) => {
    const isSelected = selectedCategory === item;
    return (
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          if (isSelected) {
            setSelectedCategory(null);
            setSelectedSubcategory(null);
          } else {
            setSelectedCategory(item);
            setSelectedSubcategory(null);
          }
        }}
        style={[
          styles.categoryChip,
          { backgroundColor: isSelected ? BrandColors.azureBlue : theme.surface, borderColor: theme.border },
        ]}
      >
        <ThemedText style={[styles.categoryChipText, { color: isSelected ? '#fff' : theme.text }]}>
          {item}
        </ThemedText>
      </Pressable>
    );
  };

  const renderSubcategoryChip = ({ item }: { item: string }) => {
    const isSelected = selectedSubcategory === item;
    return (
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          setSelectedSubcategory(isSelected ? null : item);
        }}
        style={[
          styles.subcategoryChip,
          { backgroundColor: isSelected ? BrandColors.tropicalTeal : theme.surface, borderColor: theme.border },
        ]}
      >
        <ThemedText style={[styles.subcategoryChipText, { color: isSelected ? '#fff' : theme.text }]}>
          {item}
        </ThemedText>
      </Pressable>
    );
  };

  const renderProduct = ({ item }: { item: HeritageProduct | PoolBrainProduct }) => {
    const heritageNum = 'heritageNumber' in item ? item.heritageNumber : '';
    const manufacturer = 'manufacturer' in item ? item.manufacturer : '';
    
    return (
      <Pressable
        onPress={() => handleProductPress(item)}
        style={[
          styles.productCard,
          { backgroundColor: theme.surface },
          selectionMode && styles.productCardSelectable,
        ]}
      >
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <ThemedText style={styles.productName}>{item.name}</ThemedText>
            <ThemedText style={[styles.productSku, { color: theme.textSecondary }]}>
              SKU: {item.sku}{heritageNum ? ` | Heritage: ${heritageNum}` : ''}
            </ThemedText>
            <ThemedText style={[styles.productMeta, { color: theme.textSecondary }]}>
              {manufacturer ? `${manufacturer} • ` : ''}{item.subcategory || item.category}
            </ThemedText>
          </View>
          {showPricing ? (
            <View style={styles.priceContainer}>
              <ThemedText style={styles.priceLabel}>Price</ThemedText>
              <ThemedText style={styles.price}>${item.price.toFixed(2)}</ThemedText>
              <ThemedText style={[styles.priceUnit, { color: theme.textSecondary }]}>
                per {item.unit}
              </ThemedText>
            </View>
          ) : null}
        </View>
        {selectionMode ? (
          <View style={styles.addIndicator}>
            <Feather name="plus-circle" size={24} color={BrandColors.azureBlue} />
            <ThemedText style={[styles.addText, { color: BrandColors.azureBlue }]}>
              Tap to add
            </ThemedText>
          </View>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Feather name="search" size={20} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search products, SKU, or manufacturer..."
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')}>
            <Feather name="x" size={20} color={theme.textSecondary} />
          </Pressable>
        ) : null}
        {isTranscribing ? (
          <ActivityIndicator size="small" color={BrandColors.azureBlue} style={styles.voiceButton} />
        ) : (
          <Pressable
            onPress={isRecording ? stopVoiceSearch : startVoiceSearch}
            style={[
              styles.voiceButton,
              isRecording && { backgroundColor: BrandColors.danger },
            ]}
          >
            <Feather
              name={isRecording ? "stop-circle" : "mic"}
              size={20}
              color={isRecording ? '#fff' : BrandColors.azureBlue}
            />
          </Pressable>
        )}
      </View>

      {isLoadingProducts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={BrandColors.azureBlue} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading products from Pool Brain...
          </ThemedText>
        </View>
      ) : null}

      {!isLoadingProducts && (productsError || !serviceAvailable) ? (
        <View style={styles.serviceUnavailable}>
          <Feather name="alert-circle" size={48} color={BrandColors.danger} />
          <ThemedText style={styles.serviceUnavailableTitle}>
            Service Temporarily Unavailable
          </ThemedText>
          <ThemedText style={[styles.serviceUnavailableText, { color: theme.textSecondary }]}>
            {productsError?.message || 'Product catalog is currently unavailable. Please try again later.'}
          </ThemedText>
          <Pressable
            style={[styles.retryButton, { backgroundColor: BrandColors.azureBlue }]}
            onPress={() => window.location.reload()}
          >
            <Feather name="refresh-cw" size={16} color="#fff" />
            <ThemedText style={styles.retryButtonText}>Retry</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {serviceAvailable ? (
        <>
          <FlatList
            data={categories}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryList}
            contentContainerStyle={styles.categoryListContent}
          />

          {selectedCategory && subcategories.length > 0 ? (
            <FlatList
              data={subcategories}
              renderItem={renderSubcategoryChip}
              keyExtractor={(item) => item}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.subcategoryList}
              contentContainerStyle={styles.categoryListContent}
            />
          ) : null}

          <View style={styles.resultsHeader}>
            <ThemedText style={[styles.resultsCount, { color: theme.textSecondary }]}>
              {filteredProducts.length} products
            </ThemedText>
            {!showPricing ? (
              <View style={styles.noPricingBadge}>
                <Feather name="eye-off" size={12} color={theme.textSecondary} />
                <ThemedText style={[styles.noPricingText, { color: theme.textSecondary }]}>
                  Pricing hidden
                </ThemedText>
              </View>
            ) : null}
          </View>

          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.sku}
            contentContainerStyle={[
              styles.productList,
              { paddingBottom: insets.bottom + 20 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </>
      ) : null}

      <Modal
        visible={quantityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setQuantityModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setQuantityModalVisible(false)}
        >
          <Pressable style={[styles.quantityModal, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.quantityTitle}>Add Product</ThemedText>
            {selectedForQuantity ? (
              <>
                <ThemedText style={styles.quantityProductName}>
                  {selectedForQuantity.name}
                </ThemedText>
                {showPricing ? (
                  <ThemedText style={[styles.quantityPrice, { color: BrandColors.azureBlue }]}>
                    ${selectedForQuantity.price.toFixed(2)} per {selectedForQuantity.unit}
                  </ThemedText>
                ) : null}
                <View style={styles.quantityInputContainer}>
                  <ThemedText style={styles.quantityLabel}>Quantity:</ThemedText>
                  <View style={styles.quantityControls}>
                    <Pressable
                      onPress={() => {
                        const q = Math.max(1, parseInt(quantity) - 1);
                        setQuantity(String(q));
                      }}
                      style={[styles.quantityButton, { backgroundColor: theme.backgroundRoot }]}
                    >
                      <Feather name="minus" size={20} color={theme.text} />
                    </Pressable>
                    <TextInput
                      style={[styles.quantityInput, { color: theme.text, borderColor: theme.border }]}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                    />
                    <Pressable
                      onPress={() => {
                        const q = parseInt(quantity) + 1;
                        setQuantity(String(q));
                      }}
                      style={[styles.quantityButton, { backgroundColor: theme.backgroundRoot }]}
                    >
                      <Feather name="plus" size={20} color={theme.text} />
                    </Pressable>
                  </View>
                </View>
                {showPricing ? (
                  <ThemedText style={styles.quantityTotal}>
                    Total: ${(selectedForQuantity.price * (parseInt(quantity) || 1)).toFixed(2)}
                  </ThemedText>
                ) : null}
              </>
            ) : null}
            <View style={styles.quantityActions}>
              <Pressable
                onPress={() => setQuantityModalVisible(false)}
                style={[styles.quantityActionButton, { backgroundColor: theme.backgroundRoot }]}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={confirmQuantity}
                style={[styles.quantityActionButton, styles.confirmButton]}
              >
                <ThemedText style={{ color: '#fff' }}>Add to Repair</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 13,
  },
  serviceUnavailable: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  serviceUnavailableTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  serviceUnavailableText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  voiceButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  categoryList: {
    maxHeight: 44,
    marginBottom: Spacing.sm,
  },
  categoryListContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subcategoryList: {
    maxHeight: 36,
    marginBottom: Spacing.sm,
  },
  subcategoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  subcategoryChipText: {
    fontSize: 13,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  resultsCount: {
    fontSize: 13,
  },
  noPricingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noPricingText: {
    fontSize: 12,
  },
  productList: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  productCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  productCardSelectable: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    marginBottom: 4,
  },
  productMeta: {
    fontSize: 13,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 11,
    color: '#888',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
  priceUnit: {
    fontSize: 11,
  },
  addIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: Spacing.sm,
  },
  addText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityModal: {
    width: '85%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  quantityTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  quantityProductName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  quantityPrice: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  quantityLabel: {
    fontSize: 15,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityInput: {
    width: 60,
    height: 40,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  quantityTotal: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    color: BrandColors.azureBlue,
  },
  quantityActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quantityActionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: BrandColors.azureBlue,
  },
});

export default ProductCatalog;
