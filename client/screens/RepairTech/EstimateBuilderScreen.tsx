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
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAudioRecorder, AudioModule, RecordingPresets, useAudioPlayer } from 'expo-audio';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { ProductCatalog } from '@/components/ProductCatalog';
import { HeritageProduct } from '@/lib/heritageProducts';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockProperties } from '@/lib/mockData';

interface LineItem {
  id: string;
  product: HeritageProduct;
  description: string;
  quantity: number;
  rate: number;
  discount: number;
  discountType: 'percent' | 'fixed';
}

interface VoiceNote {
  id: string;
  uri: string;
  duration: number;
  timestamp: Date;
}

interface PhotoAttachment {
  id: string;
  uri: string;
  timestamp: Date;
}

export default function EstimateBuilderScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const [estimateNumber] = useState(() => `EST-${Date.now().toString().slice(-6)}`);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [showProductCatalog, setShowProductCatalog] = useState(false);
  const [estimateMessage, setEstimateMessage] = useState('');
  const [photos, setPhotos] = useState<PhotoAttachment[]>([]);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [selectedItemForDiscount, setSelectedItemForDiscount] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [overallDiscountType, setOverallDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [taxRate] = useState(9);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddProduct = useCallback((product: HeritageProduct, quantity: number) => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      product,
      description: product.description || '',
      quantity,
      rate: product.price,
      discount: 0,
      discountType: 'percent',
    };
    setLineItems(prev => [...prev, newItem]);
    setShowProductCatalog(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateLineItem = useCallback((id: string, updates: Partial<LineItem>) => {
    setLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  }, []);

  const calculateItemAmount = (item: LineItem) => {
    const subtotal = item.quantity * item.rate;
    if (item.discountType === 'percent') {
      return subtotal * (1 - item.discount / 100);
    }
    return subtotal - item.discount;
  };

  const subtotal = lineItems.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  
  const overallDiscountAmount = overallDiscountType === 'percent'
    ? subtotal * (overallDiscount / 100)
    : overallDiscount;
  
  const afterDiscount = subtotal - overallDiscountAmount;
  const taxAmount = afterDiscount * (taxRate / 100);
  const total = afterDiscount + taxAmount;

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const newPhoto: PhotoAttachment = {
        id: `photo-${Date.now()}`,
        uri: result.assets[0].uri,
        timestamp: new Date(),
      };
      setPhotos(prev => [...prev, newPhoto]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library permission is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (!result.canceled) {
      const newPhotos = result.assets.map(asset => ({
        id: `photo-${Date.now()}-${Math.random()}`,
        uri: asset.uri,
        timestamp: new Date(),
      }));
      setPhotos(prev => [...prev, ...newPhotos]);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const startRecording = async () => {
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission needed', 'Microphone permission is required for voice notes.');
        return;
      }

      audioRecorder.record();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      await audioRecorder.stop();
      const uri = audioRecorder.uri;

      if (uri) {
        const newVoiceNote: VoiceNote = {
          id: `voice-${Date.now()}`,
          uri,
          duration: recordingDuration,
          timestamp: new Date(),
        };
        setVoiceNotes(prev => [...prev, newVoiceNote]);
      }

      setIsRecording(false);
      setRecordingDuration(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const playVoiceNote = async (uri: string) => {
    try {
      const { sound } = await AudioModule.Sound.createAsync({ uri });
      if (sound) {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('Failed to play voice note:', error);
    }
  };

  const removeVoiceNote = (id: string) => {
    setVoiceNotes(prev => prev.filter(v => v.id !== id));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitEstimate = async () => {
    if (!selectedProperty || lineItems.length === 0) {
      Alert.alert('Missing Information', 'Please select a property and add at least one line item.');
      return;
    }

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Estimate Created', `Estimate ${estimateNumber} has been created successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }, 1500);
  };

  const applyItemDiscount = () => {
    if (selectedItemForDiscount) {
      updateLineItem(selectedItemForDiscount, {
        discount: parseFloat(discountValue) || 0,
        discountType,
      });
    }
    setShowDiscountModal(false);
    setSelectedItemForDiscount(null);
    setDiscountValue('');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.estimateNumber}>{estimateNumber}</ThemedText>
          <ThemedText style={[styles.estimateLabel, { color: theme.textSecondary }]}>New Estimate</ThemedText>
        </View>
        <Pressable
          onPress={handleSubmitEstimate}
          disabled={isSubmitting || lineItems.length === 0}
          style={[styles.saveButton, (isSubmitting || lineItems.length === 0) && styles.saveButtonDisabled]}
        >
          <ThemedText style={styles.saveButtonText}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.content} 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      >
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Property</ThemedText>
          <Pressable
            onPress={() => setShowPropertyPicker(true)}
            style={[styles.propertySelector, { borderColor: theme.border }]}
          >
            <Feather name="map-pin" size={18} color={theme.textSecondary} />
            <ThemedText style={selectedProperty ? styles.propertyText : [styles.propertyPlaceholder, { color: theme.textSecondary }]}>
              {selectedProperty || 'Select a property...'}
            </ThemedText>
            <Feather name="chevron-down" size={18} color={theme.textSecondary} />
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Line Items</ThemedText>
            <Pressable onPress={() => setShowProductCatalog(true)} style={styles.addLineButton}>
              <Feather name="plus" size={16} color="#fff" />
              <ThemedText style={styles.addLineButtonText}>Add Item</ThemedText>
            </Pressable>
          </View>

          {lineItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="file-text" size={40} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
                No items added yet
              </ThemedText>
              <ThemedText style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>
                Tap "Add Item" to add products to this estimate
              </ThemedText>
            </View>
          ) : (
            lineItems.map((item, index) => (
              <View key={item.id} style={[styles.lineItemCard, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <View style={styles.lineItemHeader}>
                  <View style={styles.lineItemNumBadge}>
                    <ThemedText style={styles.lineItemNumText}>{index + 1}</ThemedText>
                  </View>
                  <View style={styles.lineItemInfo}>
                    <ThemedText style={styles.lineItemName} numberOfLines={2}>{item.product.name}</ThemedText>
                    <ThemedText style={[styles.lineItemSku, { color: theme.textSecondary }]}>{item.product.sku}</ThemedText>
                  </View>
                  <View style={styles.lineItemActions}>
                    <Pressable
                      onPress={() => {
                        setSelectedItemForDiscount(item.id);
                        setDiscountValue(String(item.discount));
                        setDiscountType(item.discountType);
                        setShowDiscountModal(true);
                      }}
                      style={styles.actionButton}
                    >
                      <Feather name="percent" size={16} color={BrandColors.tropicalTeal} />
                    </Pressable>
                    <Pressable onPress={() => removeLineItem(item.id)} style={styles.actionButton}>
                      <Feather name="trash-2" size={16} color={BrandColors.danger} />
                    </Pressable>
                  </View>
                </View>
                
                <View style={styles.lineItemDetails}>
                  <View style={styles.lineItemField}>
                    <ThemedText style={[styles.lineItemFieldLabel, { color: theme.textSecondary }]}>Qty</ThemedText>
                    <TextInput
                      style={[styles.lineItemFieldInput, { color: theme.text, borderColor: theme.border }]}
                      value={String(item.quantity)}
                      onChangeText={(v) => updateLineItem(item.id, { quantity: parseInt(v) || 1 })}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.lineItemField}>
                    <ThemedText style={[styles.lineItemFieldLabel, { color: theme.textSecondary }]}>Rate</ThemedText>
                    <TextInput
                      style={[styles.lineItemFieldInput, { color: theme.text, borderColor: theme.border }]}
                      value={String(item.rate.toFixed(2))}
                      onChangeText={(v) => updateLineItem(item.id, { rate: parseFloat(v) || 0 })}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={styles.lineItemField}>
                    <ThemedText style={[styles.lineItemFieldLabel, { color: theme.textSecondary }]}>Amount</ThemedText>
                    <ThemedText style={styles.lineItemAmount}>${calculateItemAmount(item).toFixed(2)}</ThemedText>
                  </View>
                </View>

                {item.discount > 0 ? (
                  <View style={styles.discountBadge}>
                    <Feather name="tag" size={12} color={BrandColors.tropicalTeal} />
                    <ThemedText style={styles.discountBadgeText}>
                      {item.discountType === 'percent' ? `${item.discount}% off` : `$${item.discount} off`}
                    </ThemedText>
                  </View>
                ) : null}

                <TextInput
                  style={[styles.descriptionInput, { color: theme.text, borderColor: theme.border }]}
                  placeholder="Add notes..."
                  placeholderTextColor={theme.textSecondary}
                  value={item.description}
                  onChangeText={(v) => updateLineItem(item.id, { description: v })}
                  multiline
                />
              </View>
            ))
          )}
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Photos & Voice Notes</ThemedText>
          
          <View style={styles.mediaButtons}>
            <Pressable onPress={takePhoto} style={[styles.mediaButton, { backgroundColor: theme.backgroundRoot }]}>
              <Feather name="camera" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={styles.mediaButtonText}>Take Photo</ThemedText>
            </Pressable>
            <Pressable onPress={pickImage} style={[styles.mediaButton, { backgroundColor: theme.backgroundRoot }]}>
              <Feather name="image" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={styles.mediaButtonText}>Gallery</ThemedText>
            </Pressable>
            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              style={[
                styles.mediaButton,
                { backgroundColor: isRecording ? BrandColors.danger : theme.backgroundRoot }
              ]}
            >
              <Feather name={isRecording ? 'square' : 'mic'} size={20} color={isRecording ? '#fff' : BrandColors.vividTangerine} />
              <ThemedText style={[styles.mediaButtonText, isRecording && { color: '#fff' }]}>
                {isRecording ? formatDuration(recordingDuration) : 'Voice'}
              </ThemedText>
            </Pressable>
          </View>

          {photos.length > 0 ? (
            <View style={styles.photoGrid}>
              {photos.map(photo => (
                <View key={photo.id} style={styles.photoContainer}>
                  <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                  <Pressable onPress={() => removePhoto(photo.id)} style={styles.photoRemove}>
                    <Feather name="x" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}

          {voiceNotes.length > 0 ? (
            <View style={styles.voiceNotesList}>
              {voiceNotes.map(note => (
                <View key={note.id} style={[styles.voiceNoteItem, { backgroundColor: theme.backgroundRoot }]}>
                  <Pressable onPress={() => playVoiceNote(note.uri)} style={styles.playButton}>
                    <Feather name="play" size={16} color={BrandColors.azureBlue} />
                  </Pressable>
                  <View style={styles.voiceNoteInfo}>
                    <ThemedText style={styles.voiceNoteDuration}>{formatDuration(note.duration)}</ThemedText>
                    <ThemedText style={[styles.voiceNoteTime, { color: theme.textSecondary }]}>
                      {note.timestamp.toLocaleTimeString()}
                    </ThemedText>
                  </View>
                  <Pressable onPress={() => removeVoiceNote(note.id)}>
                    <Feather name="trash-2" size={16} color={BrandColors.danger} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <ThemedText style={styles.sectionTitle}>Message on Estimate</ThemedText>
          <TextInput
            style={[styles.messageInput, { color: theme.text, borderColor: theme.border }]}
            placeholder="Add a message to display on the estimate..."
            placeholderTextColor={theme.textSecondary}
            value={estimateMessage}
            onChangeText={setEstimateMessage}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={[styles.totalsSection, { backgroundColor: theme.surface }]}>
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Subtotal</ThemedText>
            <ThemedText style={styles.totalValue}>${subtotal.toFixed(2)}</ThemedText>
          </View>
          
          <View style={styles.totalRow}>
            <Pressable
              onPress={() => {
                setSelectedItemForDiscount(null);
                setShowDiscountModal(true);
              }}
              style={styles.discountRow}
            >
              <Feather name="tag" size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>
                Discount {overallDiscount > 0 ? `(${overallDiscountType === 'percent' ? `${overallDiscount}%` : `$${overallDiscount}`})` : ''}
              </ThemedText>
            </Pressable>
            <ThemedText style={[styles.totalValue, { color: BrandColors.danger }]}>
              -${overallDiscountAmount.toFixed(2)}
            </ThemedText>
          </View>

          <View style={styles.totalRow}>
            <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>
              Tax ({taxRate}%)
            </ThemedText>
            <ThemedText style={styles.totalValue}>${taxAmount.toFixed(2)}</ThemedText>
          </View>

          <View style={[styles.totalRow, styles.grandTotal]}>
            <ThemedText style={styles.grandTotalLabel}>Total</ThemedText>
            <ThemedText style={styles.grandTotalValue}>${total.toFixed(2)}</ThemedText>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showPropertyPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPropertyPicker(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowPropertyPicker(false)}>
          <View style={[styles.propertyModal, { backgroundColor: theme.surface }]}>
            <View style={styles.propertyModalHeader}>
              <ThemedText style={styles.propertyModalTitle}>Select Property</ThemedText>
              <Pressable onPress={() => setShowPropertyPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            <View style={[styles.propertySearchContainer, { borderColor: theme.border }]}>
              <Feather name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.propertySearchInput, { color: theme.text }]}
                placeholder="Search properties..."
                placeholderTextColor={theme.textSecondary}
                value={propertySearch}
                onChangeText={setPropertySearch}
              />
            </View>
            <FlatList
              data={mockProperties.filter(p => 
                p.name.toLowerCase().includes(propertySearch.toLowerCase())
              )}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedProperty(item.name);
                    setShowPropertyPicker(false);
                  }}
                  style={[styles.propertyOption, { borderBottomColor: theme.border }]}
                >
                  <ThemedText style={styles.propertyOptionName}>{item.name}</ThemedText>
                  <ThemedText style={[styles.propertyOptionAddress, { color: theme.textSecondary }]}>
                    {item.address}
                  </ThemedText>
                </Pressable>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showProductCatalog}
        animationType="slide"
        onRequestClose={() => setShowProductCatalog(false)}
      >
        <View style={[styles.catalogModal, { backgroundColor: theme.backgroundRoot }]}>
          <View style={[styles.catalogHeader, { backgroundColor: theme.surface, paddingTop: insets.top }]}>
            <Pressable onPress={() => setShowProductCatalog(false)}>
              <Feather name="x" size={24} color={theme.text} />
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

      <Modal
        visible={showDiscountModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDiscountModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowDiscountModal(false)}>
          <View style={[styles.discountModal, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.discountModalTitle}>
              {selectedItemForDiscount ? 'Item Discount' : 'Overall Discount'}
            </ThemedText>
            <View style={styles.discountTypeRow}>
              <Pressable
                onPress={() => setDiscountType('percent')}
                style={[
                  styles.discountTypeButton,
                  discountType === 'percent' && { backgroundColor: BrandColors.azureBlue }
                ]}
              >
                <ThemedText style={[styles.discountTypeText, discountType === 'percent' && { color: '#fff' }]}>%</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => setDiscountType('fixed')}
                style={[
                  styles.discountTypeButton,
                  discountType === 'fixed' && { backgroundColor: BrandColors.azureBlue }
                ]}
              >
                <ThemedText style={[styles.discountTypeText, discountType === 'fixed' && { color: '#fff' }]}>$</ThemedText>
              </Pressable>
            </View>
            <TextInput
              style={[styles.discountInput, { color: theme.text, borderColor: theme.border }]}
              placeholder={discountType === 'percent' ? 'Discount %' : 'Discount $'}
              placeholderTextColor={theme.textSecondary}
              value={discountValue}
              onChangeText={setDiscountValue}
              keyboardType="decimal-pad"
            />
            <View style={styles.discountActions}>
              <Pressable
                onPress={() => setShowDiscountModal(false)}
                style={[styles.discountActionButton, { backgroundColor: theme.backgroundRoot }]}
              >
                <ThemedText>Cancel</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (selectedItemForDiscount) {
                    applyItemDiscount();
                  } else {
                    setOverallDiscount(parseFloat(discountValue) || 0);
                    setOverallDiscountType(discountType);
                    setShowDiscountModal(false);
                  }
                }}
                style={[styles.discountActionButton, { backgroundColor: BrandColors.azureBlue }]}
              >
                <ThemedText style={{ color: '#fff' }}>Apply</ThemedText>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    ...Shadows.card,
  },
  headerButton: {
    padding: Spacing.sm,
  },
  headerCenter: {
    alignItems: 'center',
  },
  estimateNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  estimateLabel: {
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: BrandColors.azureBlue,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
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
    marginBottom: Spacing.sm,
  },
  addLineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.azureBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  addLineButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  propertySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  propertyText: {
    flex: 1,
    fontSize: 15,
  },
  propertyPlaceholder: {
    flex: 1,
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  lineItemCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  lineItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  lineItemNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BrandColors.azureBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineItemNumText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  lineItemInfo: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 15,
    fontWeight: '600',
  },
  lineItemSku: {
    fontSize: 12,
    marginTop: 2,
  },
  lineItemDetails: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  lineItemField: {
    flex: 1,
  },
  lineItemFieldLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  lineItemFieldInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    textAlign: 'center',
  },
  lineItemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: BrandColors.emerald,
    paddingVertical: Spacing.sm,
  },
  descriptionInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    fontSize: 13,
    minHeight: 36,
    marginTop: Spacing.sm,
  },
  lineItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.tropicalTeal + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    gap: 4,
  },
  discountBadgeText: {
    color: BrandColors.tropicalTeal,
    fontSize: 12,
    fontWeight: '500',
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  mediaButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  photoContainer: {
    position: 'relative',
  },
  photoThumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  photoRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: BrandColors.danger,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceNotesList: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  voiceNoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BrandColors.azureBlue + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceNoteInfo: {
    flex: 1,
  },
  voiceNoteDuration: {
    fontSize: 14,
    fontWeight: '600',
  },
  voiceNoteTime: {
    fontSize: 11,
  },
  messageInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  totalsSection: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: '#ddd',
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  grandTotalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  propertyModal: {
    maxHeight: '70%',
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  propertyModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  propertyModalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  propertySearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  propertySearchInput: {
    flex: 1,
    fontSize: 15,
  },
  propertyOption: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  propertyOptionName: {
    fontSize: 15,
    fontWeight: '500',
  },
  propertyOptionAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  catalogModal: {
    flex: 1,
  },
  catalogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    ...Shadows.card,
  },
  catalogTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  discountModal: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  discountModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  discountTypeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  discountTypeButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  discountTypeText: {
    fontSize: 18,
    fontWeight: '600',
  },
  discountInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  discountActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  discountActionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
});
