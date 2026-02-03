import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
  Image,
  FlatList,
  Alert,
  Platform,
  Switch,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { ProductCatalog } from '@/components/ProductCatalog';
import { HeritageProduct } from '@/lib/heritageProducts';
import { BorderRadius, Spacing } from '@/constants/theme';
import { ESTIMATE_COLORS, STATUS_BADGES, generateEstimateNumber, calculateTotals, formatCurrencyDollars } from '@/constants/estimateDesign';
import { mockProperties } from '@/lib/mockData';
import { getLocalApiUrl, joinUrl } from '@/lib/query-client';
import type { RootStackParamList } from '@/navigation/RootStackNavigator';

type RouteParams = RouteProp<RootStackParamList, 'UniversalEstimateBuilder'>;

interface LineItem {
  id: string;
  lineNumber: number;
  product: HeritageProduct;
  description: string;
  quantity: number;
  rate: number;
  taxable: boolean;
}

interface PhotoAttachment {
  id: string;
  uri: string;
}

export default function UniversalEstimateBuilderScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteParams>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const isAceMode = route.params?.mode === 'ace';

  const [estimateNumber] = useState(() => generateEstimateNumber());
  const [estimateDate] = useState(new Date());
  const [expirationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d;
  });
  const [status] = useState<'draft'>('draft');

  const [selectedProperty, setSelectedProperty] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);

  const [woRequired, setWoRequired] = useState(false);
  const [woReceived, setWoReceived] = useState(false);
  const [woNumber, setWoNumber] = useState('');

  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showProductCatalog, setShowProductCatalog] = useState(false);

  const [customerNote, setCustomerNote] = useState('');
  const [memoOnStatement, setMemoOnStatement] = useState('');
  const [techNotes, setTechNotes] = useState('');

  const [photos, setPhotos] = useState<PhotoAttachment[]>([]);

  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [tempDiscountValue, setTempDiscountValue] = useState('');
  const [tempDiscountType, setTempDiscountType] = useState<'percent' | 'fixed'>('percent');

  const [salesTaxRate] = useState(9);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddProduct = (product: HeritageProduct) => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      lineNumber: lineItems.length + 1,
      product,
      description: '',
      quantity: 1,
      rate: product.price,
      taxable: true,
    };
    setLineItems(prev => [...prev, newItem]);
    setShowProductCatalog(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const updateLineItem = (id: string, updates: Partial<LineItem>) => {
    setLineItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id).map((item, idx) => ({ ...item, lineNumber: idx + 1 })));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const clearAllItems = () => {
    Alert.alert('Clear All Items', 'Are you sure you want to remove all line items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setLineItems([]) },
    ]);
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled && result.assets) {
      const newPhotos = result.assets.map((asset, idx) => ({
        id: `photo-${Date.now()}-${idx}`,
        uri: asset.uri,
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, { id: `photo-${Date.now()}`, uri: result.assets[0].uri }]);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const uploadPhotos = async (photosToUpload: PhotoAttachment[], authToken: string | null): Promise<string[]> => {
    if (photosToUpload.length === 0) return [];
    
    try {
      const apiUrl = getLocalApiUrl();
      const formData = new FormData();
      
      for (const photo of photosToUpload) {
        const filename = photo.uri.split('/').pop() || `photo-${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('photos', {
          uri: photo.uri,
          name: filename,
          type,
        } as any);
      }
      
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      console.log('[Photo Upload] Uploading', photosToUpload.length, 'photos...');
      const response = await fetch(joinUrl(apiUrl, '/api/photos/upload'), {
        method: 'POST',
        headers,
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Photo Upload] Server error:', response.status, errorText);
        throw new Error('Failed to upload photos');
      }
      
      const result = await response.json();
      console.log('[Photo Upload] Success:', result);
      return result.photos.map((p: any) => p.url);
    } catch (error) {
      console.error('[Photo Upload] Error:', error);
      throw error;
    }
  };

  const items = lineItems.map(item => ({
    ...item,
    amount: item.quantity * item.rate,
  }));

  const { subtotal, discountAmount, salesTaxAmount, totalAmount } = calculateTotals(
    items.map(i => ({ ...i, productService: i.product.name, sku: i.product.sku })),
    discountType,
    discountValue,
    salesTaxRate
  );

  const applyDiscount = () => {
    const val = parseFloat(tempDiscountValue) || 0;
    setDiscountType(tempDiscountType);
    setDiscountValue(val);
    setShowDiscountModal(false);
  };

  const handleSubmit = async (sendToOffice: boolean) => {
    if (!selectedProperty) {
      Alert.alert('Property Required', 'Please select a property for this estimate.');
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert('Items Required', 'Please add at least one item to the estimate.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const selectedProp = mockProperties.find(p => p.name === selectedProperty);
      const { storage } = await import('@/lib/storage');
      const authToken = await storage.getAuthToken();
      
      // Upload photos first if sending to office
      let photoUrls: string[] = [];
      if (sendToOffice && photos.length > 0) {
        try {
          photoUrls = await uploadPhotos(photos, authToken);
          console.log('[Estimate Submit] Photos uploaded:', photoUrls.length);
        } catch (photoError) {
          console.error('[Estimate Submit] Photo upload failed:', photoError);
          Alert.alert('Photo Upload Failed', 'Could not upload photos. The estimate will be saved without photos.');
        }
      }
      
      // Create local estimate first (always save locally)
      const localEstimate = {
        id: estimateNumber,
        estimateNumber,
        propertyId: selectedProp?.id || '',
        propertyName: selectedProperty,
        estimateDate: estimateDate.toISOString(),
        expirationDate: expirationDate.toISOString(),
        description: techNotes || customerNote,
        lineItems: lineItems.map(item => ({
          sku: item.product.sku,
          name: item.product.name,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
          taxable: item.taxable,
        })),
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        taxRate: salesTaxRate,
        taxAmount: salesTaxAmount,
        total: totalAmount,
        status: sendToOffice ? 'pending_approval' : 'draft',
        sentToOffice: sendToOffice,
        createdAt: new Date().toISOString(),
      };
      
      // Save locally first
      await storage.addEstimate(localEstimate as any);
      console.log('Estimate saved locally:', estimateNumber);

      // If just saving draft (not sending to office), we're done - navigate back
      if (!sendToOffice) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Draft Saved!',
          `Estimate ${estimateNumber} has been saved as a draft.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
        return;
      }
      
      // If sending to office, also sync to server
      const estimateData = {
        estimateNumber,
        propertyId: selectedProp?.id || '',
        propertyName: selectedProperty,
        title: (techNotes || customerNote)?.split('\n')[0]?.slice(0, 100) || `Field Estimate - ${selectedProperty}`,
        estimateDate: estimateDate.toISOString(),
        expirationDate: expirationDate.toISOString(),
        description: techNotes || customerNote,
        items: lineItems.map((item, index) => ({
          lineNumber: index + 1,
          productService: item.product.name,
          sku: item.product.sku,
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
          taxable: item.taxable,
        })),
        subtotal,
        discountType,
        discountValue,
        discountAmount,
        taxRate: salesTaxRate,
        taxAmount: salesTaxAmount,
        totalAmount,
        woRequired,
        woReceived,
        woNumber,
        sendToOffice,
        sourceType: 'repair_tech',
        createdByTechId: user?.id || null,
        createdByTechName: user?.name || null,
        status: sendToOffice ? 'needs_review' : 'draft',
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      };

      const apiUrl = getLocalApiUrl();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(joinUrl(apiUrl, '/api/estimates'), {
        method: 'POST',
        headers,
        body: JSON.stringify(estimateData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      // Update local copy with server ID
      const updatedEstimate = { ...localEstimate, id: result.estimate?.id || estimateNumber };
      await storage.addEstimate(updatedEstimate as any);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Estimate Sent!',
        `Estimate ${estimateNumber} has been sent to the office for approval.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error saving estimate:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Error',
        'Failed to send estimate to office. The draft has been saved locally. Please try again when connected.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProperties = mockProperties.filter(p =>
    p.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.address?.toLowerCase().includes(propertySearch.toLowerCase())
  );

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <View style={[styles.container, { backgroundColor: ESTIMATE_COLORS.bgSlate50 }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>ESTIMATE</ThemedText>
          <ThemedText style={styles.headerSubtitle}>{isAceMode ? 'AI Assisted' : 'Create New'}</ThemedText>
        </View>
        <View style={styles.headerAmount}>
          <ThemedText style={styles.amountLabel}>Amount:</ThemedText>
          <ThemedText style={styles.amountValue}>{formatCurrencyDollars(totalAmount)}</ThemedText>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 200 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionLabel}>Customer / Property</ThemedText>
            <Pressable
              onPress={() => setShowPropertyPicker(true)}
              style={styles.selectField}
            >
              <Feather name="map-pin" size={18} color={ESTIMATE_COLORS.textSlate500} />
              <ThemedText style={selectedProperty ? styles.selectText : styles.selectPlaceholder}>
                {selectedProperty || 'Select customer/property...'}
              </ThemedText>
              <Feather name="chevron-down" size={18} color={ESTIMATE_COLORS.textSlate500} />
            </Pressable>

            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <ThemedText style={styles.fieldLabel}>Estimate #</ThemedText>
                <View style={styles.readOnlyField}>
                  <ThemedText style={styles.readOnlyText}>{estimateNumber}</ThemedText>
                </View>
              </View>
              <View style={styles.halfField}>
                <ThemedText style={styles.fieldLabel}>Estimate Date</ThemedText>
                <View style={styles.readOnlyField}>
                  <ThemedText style={styles.readOnlyText}>{formatDate(estimateDate)}</ThemedText>
                </View>
              </View>
            </View>

            <View style={styles.rowFields}>
              <View style={styles.halfField}>
                <ThemedText style={styles.fieldLabel}>Expiration Date</ThemedText>
                <View style={styles.readOnlyField}>
                  <ThemedText style={styles.readOnlyText}>{formatDate(expirationDate)}</ThemedText>
                </View>
              </View>
              <View style={styles.halfField}>
                <ThemedText style={styles.fieldLabel}>Status</ThemedText>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_BADGES.draft.bg, borderColor: STATUS_BADGES.draft.border }]}>
                  <ThemedText style={[styles.statusText, { color: STATUS_BADGES.draft.text }]}>Draft</ThemedText>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionCardOrange}>
            <View style={styles.sectionHeader}>
              <Feather name="clipboard" size={18} color={ESTIMATE_COLORS.accent} />
              <ThemedText style={[styles.sectionLabel, { color: ESTIMATE_COLORS.accent }]}>Work Order Tracking</ThemedText>
            </View>
            <View style={styles.woRow}>
              <View style={styles.woCheckbox}>
                <Switch
                  value={woReceived}
                  onValueChange={setWoReceived}
                  trackColor={{ false: ESTIMATE_COLORS.borderLight, true: ESTIMATE_COLORS.statusGreen }}
                />
                <ThemedText style={styles.woLabel}>WO Received</ThemedText>
              </View>
              <View style={styles.woNumberField}>
                <ThemedText style={styles.fieldLabel}>WO Number:</ThemedText>
                <TextInput
                  style={styles.woInput}
                  placeholder="Enter WO#"
                  placeholderTextColor={ESTIMATE_COLORS.textSlate400}
                  value={woNumber}
                  onChangeText={setWoNumber}
                />
              </View>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.lineItemsHeader}>
              <View style={styles.lineItemsTitleRow}>
                <Feather name="list" size={18} color={ESTIMATE_COLORS.textDark} />
                <ThemedText style={styles.sectionLabel}>Line Items</ThemedText>
              </View>
              {lineItems.length > 0 ? (
                <Pressable onPress={clearAllItems} style={styles.clearButton}>
                  <ThemedText style={styles.clearButtonText}>Clear All</ThemedText>
                </Pressable>
              ) : null}
            </View>

            <Pressable onPress={() => setShowProductCatalog(true)} style={styles.addItemButton}>
              <Feather name="plus" size={18} color="#fff" />
              <ThemedText style={styles.addItemText}>Add Item</ThemedText>
            </Pressable>

            {lineItems.map((item, index) => (
              <View key={item.id} style={styles.lineItemCard}>
                <View style={styles.lineItemHeader}>
                  <View style={styles.lineItemNumber}>
                    <ThemedText style={styles.lineItemNumberText}>{item.lineNumber}</ThemedText>
                  </View>
                  <ThemedText style={styles.lineItemName} numberOfLines={2}>{item.product.name}</ThemedText>
                  <Pressable onPress={() => removeLineItem(item.id)} style={styles.deleteButton}>
                    <Feather name="trash-2" size={16} color={ESTIMATE_COLORS.statusRed} />
                  </Pressable>
                </View>

                <View style={styles.lineItemFields}>
                  <View style={styles.lineItemField}>
                    <ThemedText style={styles.lineItemFieldLabel}>Qty</ThemedText>
                    <TextInput
                      style={styles.lineItemInput}
                      value={item.quantity.toString()}
                      onChangeText={(v) => updateLineItem(item.id, { quantity: parseInt(v) || 1 })}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.lineItemField}>
                    <ThemedText style={styles.lineItemFieldLabel}>Rate</ThemedText>
                    <TextInput
                      style={styles.lineItemInput}
                      value={item.rate.toFixed(2)}
                      onChangeText={(v) => updateLineItem(item.id, { rate: parseFloat(v) || 0 })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.lineItemField}>
                    <ThemedText style={styles.lineItemFieldLabel}>Amount</ThemedText>
                    <View style={styles.lineItemAmountField}>
                      <ThemedText style={styles.lineItemAmount}>{formatCurrencyDollars(item.quantity * item.rate)}</ThemedText>
                    </View>
                  </View>
                </View>

                <View style={styles.lineItemDescRow}>
                  <TextInput
                    style={styles.lineItemDescInput}
                    placeholder="Add description..."
                    placeholderTextColor={ESTIMATE_COLORS.textSlate400}
                    value={item.description}
                    onChangeText={(v) => updateLineItem(item.id, { description: v })}
                  />
                  <View style={styles.taxableRow}>
                    <Switch
                      value={item.taxable}
                      onValueChange={(v) => updateLineItem(item.id, { taxable: v })}
                      trackColor={{ false: ESTIMATE_COLORS.borderLight, true: ESTIMATE_COLORS.secondary }}
                      style={styles.taxSwitch}
                    />
                    <ThemedText style={styles.taxLabel}>Tax</ThemedText>
                  </View>
                </View>
              </View>
            ))}

            {lineItems.length === 0 ? (
              <View style={styles.emptyItems}>
                <Feather name="package" size={32} color={ESTIMATE_COLORS.textSlate400} />
                <ThemedText style={styles.emptyText}>No items added yet</ThemedText>
                <ThemedText style={styles.emptySubtext}>Tap "Add Item" to search products</ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionLabel}>Notes</ThemedText>

            <View style={styles.noteField}>
              <ThemedText style={styles.noteLabel}>Customer Note (visible on estimate)</ThemedText>
              <TextInput
                style={styles.noteInput}
                placeholder="Add a note for the customer..."
                placeholderTextColor={ESTIMATE_COLORS.textSlate400}
                value={customerNote}
                onChangeText={setCustomerNote}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.noteField}>
              <ThemedText style={styles.noteLabel}>Memo (internal)</ThemedText>
              <TextInput
                style={styles.noteInput}
                placeholder="Internal memo..."
                placeholderTextColor={ESTIMATE_COLORS.textSlate400}
                value={memoOnStatement}
                onChangeText={setMemoOnStatement}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.noteField}>
              <ThemedText style={styles.noteLabel}>Tech Notes (internal)</ThemedText>
              <TextInput
                style={styles.noteInput}
                placeholder="Technical notes for the team..."
                placeholderTextColor={ESTIMATE_COLORS.textSlate400}
                value={techNotes}
                onChangeText={setTechNotes}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Feather name="camera" size={18} color={ESTIMATE_COLORS.textDark} />
              <ThemedText style={styles.sectionLabel}>Supporting Photos (optional)</ThemedText>
            </View>
            <ThemedText style={styles.photoHint}>Max 10 MB per photo</ThemedText>

            <View style={styles.photoButtons}>
              <Pressable onPress={takePhoto} style={styles.photoButton}>
                <Feather name="camera" size={18} color={ESTIMATE_COLORS.secondary} />
                <ThemedText style={styles.photoButtonText}>Take Photo</ThemedText>
              </Pressable>
              <Pressable onPress={pickPhoto} style={styles.photoButton}>
                <Feather name="image" size={18} color={ESTIMATE_COLORS.secondary} />
                <ThemedText style={styles.photoButtonText}>Upload</ThemedText>
              </Pressable>
            </View>

            {photos.length > 0 ? (
              <View style={styles.photoGrid}>
                {photos.map(photo => (
                  <View key={photo.id} style={styles.photoItem}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
                    <Pressable onPress={() => removePhoto(photo.id)} style={styles.photoRemove}>
                      <Feather name="x" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={[styles.floatingTotals, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={styles.totalsContent}>
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Subtotal:</ThemedText>
              <ThemedText style={styles.totalValue}>{formatCurrencyDollars(subtotal)}</ThemedText>
            </View>

            <Pressable
              onPress={() => {
                setTempDiscountType(discountType);
                setTempDiscountValue(discountValue.toString());
                setShowDiscountModal(true);
              }}
              style={styles.discountRow}
            >
              <View style={styles.discountLabel}>
                <ThemedText style={styles.totalLabel}>Discount:</ThemedText>
                <View style={styles.discountBadge}>
                  <ThemedText style={styles.discountBadgeText}>
                    {discountType === 'percent' ? '%' : '$'}
                  </ThemedText>
                </View>
                {discountValue > 0 ? (
                  <ThemedText style={styles.discountValueText}>
                    ({discountType === 'percent' ? `${discountValue}%` : `$${discountValue}`})
                  </ThemedText>
                ) : null}
              </View>
              <ThemedText style={[styles.totalValue, { color: ESTIMATE_COLORS.statusRed }]}>
                -{formatCurrencyDollars(discountAmount)}
              </ThemedText>
            </Pressable>

            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Tax ({salesTaxRate}%):</ThemedText>
              <ThemedText style={styles.totalValue}>{formatCurrencyDollars(salesTaxAmount)}</ThemedText>
            </View>

            <View style={styles.grandTotalRow}>
              <ThemedText style={styles.grandTotalLabel}>TOTAL:</ThemedText>
              <ThemedText style={styles.grandTotalValue}>{formatCurrencyDollars(totalAmount)}</ThemedText>
            </View>

            <View style={styles.actionButtons}>
              <Pressable
                onPress={() => handleSubmit(false)}
                disabled={isSubmitting}
                style={styles.saveDraftButton}
              >
                <ThemedText style={styles.saveDraftText}>
                  {isSubmitting ? 'Saving...' : 'Save Draft'}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={() => handleSubmit(true)}
                disabled={isSubmitting}
                style={styles.saveAndSendButton}
              >
                <ThemedText style={styles.saveAndSendText}>
                  {isSubmitting ? 'Sending...' : 'Save & Send'}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showPropertyPicker} animationType="slide" transparent onRequestClose={() => setShowPropertyPicker(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPropertyPicker(false)}>
          <View style={styles.propertyModal}>
            <View style={styles.propertyModalHeader}>
              <ThemedText style={styles.modalTitle}>Select Property</ThemedText>
              <Pressable onPress={() => setShowPropertyPicker(false)}>
                <Feather name="x" size={24} color={ESTIMATE_COLORS.textDark} />
              </Pressable>
            </View>
            <View style={styles.searchContainer}>
              <Feather name="search" size={18} color={ESTIMATE_COLORS.textSlate500} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search properties..."
                placeholderTextColor={ESTIMATE_COLORS.textSlate400}
                value={propertySearch}
                onChangeText={setPropertySearch}
              />
            </View>
            <FlatList
              data={filteredProperties}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedProperty(item.name);
                    setShowPropertyPicker(false);
                    setPropertySearch('');
                  }}
                  style={styles.propertyOption}
                >
                  <ThemedText style={styles.propertyName}>{item.name}</ThemedText>
                  {item.address ? <ThemedText style={styles.propertyAddress}>{item.address}</ThemedText> : null}
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showProductCatalog} animationType="slide" onRequestClose={() => setShowProductCatalog(false)}>
        <View style={[styles.catalogModal, { paddingTop: insets.top }]}>
          <View style={styles.catalogHeader}>
            <Pressable onPress={() => setShowProductCatalog(false)}>
              <Feather name="x" size={24} color={ESTIMATE_COLORS.textDark} />
            </Pressable>
            <ThemedText style={styles.catalogTitle}>Add Product</ThemedText>
            <View style={{ width: 24 }} />
          </View>
          <ProductCatalog
            role="repair_tech"
            selectionMode={true}
            onSelectProduct={handleAddProduct}
          />
        </View>
      </Modal>

      <Modal visible={showDiscountModal} animationType="fade" transparent onRequestClose={() => setShowDiscountModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDiscountModal(false)}>
          <View style={styles.discountModal}>
            <ThemedText style={styles.modalTitle}>Set Discount</ThemedText>
            <View style={styles.discountTypeRow}>
              <Pressable
                onPress={() => setTempDiscountType('percent')}
                style={[styles.discountTypeBtn, tempDiscountType === 'percent' && styles.discountTypeBtnActive]}
              >
                <ThemedText style={[styles.discountTypeBtnText, tempDiscountType === 'percent' && { color: '#fff' }]}>%</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setTempDiscountType('fixed')}
                style={[styles.discountTypeBtn, tempDiscountType === 'fixed' && styles.discountTypeBtnActive]}
              >
                <ThemedText style={[styles.discountTypeBtnText, tempDiscountType === 'fixed' && { color: '#fff' }]}>$</ThemedText>
              </Pressable>
            </View>
            <TextInput
              style={styles.discountInput}
              placeholder={tempDiscountType === 'percent' ? 'Enter percentage' : 'Enter amount'}
              placeholderTextColor={ESTIMATE_COLORS.textSlate400}
              value={tempDiscountValue}
              onChangeText={setTempDiscountValue}
              keyboardType="decimal-pad"
            />
            <View style={styles.discountActions}>
              <Pressable onPress={() => setShowDiscountModal(false)} style={styles.discountCancelBtn}>
                <ThemedText style={styles.discountCancelText}>Cancel</ThemedText>
              </Pressable>
              <Pressable onPress={applyDiscount} style={styles.discountApplyBtn}>
                <ThemedText style={styles.discountApplyText}>Apply</ThemedText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: ESTIMATE_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  headerAmount: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: Spacing.md,
  },
  sectionCard: {
    backgroundColor: ESTIMATE_COLORS.bgSlate50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionCardOrange: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textDark,
    marginBottom: Spacing.sm,
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 6,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    color: ESTIMATE_COLORS.textDark,
  },
  selectPlaceholder: {
    flex: 1,
    fontSize: 14,
    color: ESTIMATE_COLORS.textSlate400,
  },
  rowFields: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  halfField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate500,
    marginBottom: 4,
  },
  readOnlyField: {
    backgroundColor: ESTIMATE_COLORS.bgSlate100,
    borderRadius: 6,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
  },
  readOnlyText: {
    fontSize: 14,
    color: ESTIMATE_COLORS.textDark,
  },
  statusBadge: {
    borderRadius: 6,
    padding: Spacing.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  woRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  woCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  woLabel: {
    fontSize: 14,
    color: ESTIMATE_COLORS.textDark,
  },
  woNumberField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  woInput: {
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    width: 100,
    fontSize: 14,
    color: ESTIMATE_COLORS.textDark,
  },
  lineItemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  lineItemsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  clearButton: {
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate500,
  },
  addItemButton: {
    backgroundColor: ESTIMATE_COLORS.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    borderRadius: 6,
    marginBottom: Spacing.md,
  },
  addItemText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  lineItemCard: {
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  lineItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  lineItemNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ESTIMATE_COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineItemNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lineItemName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: ESTIMATE_COLORS.textDark,
  },
  deleteButton: {
    padding: Spacing.xs,
  },
  lineItemFields: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  lineItemField: {
    flex: 1,
  },
  lineItemFieldLabel: {
    fontSize: 11,
    color: ESTIMATE_COLORS.textSlate500,
    marginBottom: 4,
  },
  lineItemInput: {
    backgroundColor: ESTIMATE_COLORS.bgSlate100,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: 14,
    color: ESTIMATE_COLORS.textDark,
    textAlign: 'center',
  },
  lineItemAmountField: {
    backgroundColor: ESTIMATE_COLORS.bgSlate100,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  lineItemAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: ESTIMATE_COLORS.secondary,
  },
  lineItemDescRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lineItemDescInput: {
    flex: 1,
    backgroundColor: ESTIMATE_COLORS.bgSlate100,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    fontSize: 13,
    color: ESTIMATE_COLORS.textDark,
  },
  taxableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taxSwitch: {
    transform: [{ scale: 0.8 }],
  },
  taxLabel: {
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate500,
  },
  emptyItems: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: ESTIMATE_COLORS.textSlate500,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate400,
    marginTop: 4,
  },
  noteField: {
    marginBottom: Spacing.md,
  },
  noteLabel: {
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate500,
    marginBottom: 4,
  },
  noteInput: {
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: ESTIMATE_COLORS.textDark,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  photoHint: {
    fontSize: 11,
    color: ESTIMATE_COLORS.textSlate400,
    marginBottom: Spacing.sm,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  photoButtonText: {
    fontSize: 13,
    color: ESTIMATE_COLORS.secondary,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  photoItem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: ESTIMATE_COLORS.statusRed,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTotals: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderTopWidth: 1,
    borderTopColor: ESTIMATE_COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  totalsContent: {
    padding: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
    color: ESTIMATE_COLORS.textSlate500,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: ESTIMATE_COLORS.textDark,
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  discountLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  discountBadge: {
    backgroundColor: ESTIMATE_COLORS.bgSlate100,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textSlate500,
  },
  discountValueText: {
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate500,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: ESTIMATE_COLORS.borderMedium,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: ESTIMATE_COLORS.textDark,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: ESTIMATE_COLORS.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  saveDraftButton: {
    flex: 1,
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveDraftText: {
    fontSize: 14,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textSlate500,
  },
  saveAndSendButton: {
    flex: 1,
    backgroundColor: ESTIMATE_COLORS.primary,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveAndSendText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  propertyModal: {
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    padding: Spacing.lg,
  },
  propertyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textDark,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ESTIMATE_COLORS.bgSlate100,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: ESTIMATE_COLORS.textDark,
  },
  propertyOption: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ESTIMATE_COLORS.borderLight,
  },
  propertyName: {
    fontSize: 15,
    fontWeight: '500',
    color: ESTIMATE_COLORS.textDark,
  },
  propertyAddress: {
    fontSize: 13,
    color: ESTIMATE_COLORS.textSlate500,
    marginTop: 2,
  },
  catalogModal: {
    flex: 1,
    backgroundColor: ESTIMATE_COLORS.bgSlate50,
  },
  catalogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ESTIMATE_COLORS.borderLight,
  },
  catalogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textDark,
  },
  discountModal: {
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    margin: Spacing.xl,
    borderRadius: 12,
    padding: Spacing.lg,
  },
  discountTypeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  discountTypeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    alignItems: 'center',
  },
  discountTypeBtnActive: {
    backgroundColor: ESTIMATE_COLORS.secondary,
    borderColor: ESTIMATE_COLORS.secondary,
  },
  discountTypeBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textDark,
  },
  discountInput: {
    backgroundColor: ESTIMATE_COLORS.bgSlate100,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: ESTIMATE_COLORS.textDark,
    textAlign: 'center',
  },
  discountActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  discountCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: ESTIMATE_COLORS.bgSlate100,
    alignItems: 'center',
  },
  discountCancelText: {
    fontSize: 14,
    color: ESTIMATE_COLORS.textSlate500,
  },
  discountApplyBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: ESTIMATE_COLORS.secondary,
    alignItems: 'center',
  },
  discountApplyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
