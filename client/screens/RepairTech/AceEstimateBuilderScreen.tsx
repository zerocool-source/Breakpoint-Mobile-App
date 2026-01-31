import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import { getLocalApiUrl, joinUrl } from '@/lib/query-client';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
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

interface AIProductMatch {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  manufacturer: string;
  price: number;
  unit: string;
  confidence: number;
  reason: string;
  selected: boolean;
}

interface AceMessage {
  id: string;
  type: 'ace' | 'user' | 'system';
  text: string;
  timestamp: Date;
  products?: AIProductMatch[];
}

export default function AceEstimateBuilderScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [estimateNumber] = useState(() => `ACE-${Date.now().toString().slice(-6)}`);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [taxRate] = useState(9);

  const [messages, setMessages] = useState<AceMessage[]>([
    {
      id: '1',
      type: 'ace',
      text: "Hey there! I'm Ace, your AI assistant. Tell me what products or repairs you need for this estimate, and I'll help you find them in our catalog. Just type or speak!",
      timestamp: new Date(),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showWebWarning, setShowWebWarning] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const thinkingAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  const thinkingMessages = [
    "Let me search the catalog...",
    "Looking through 600+ products...",
    "Finding the best matches...",
    "Almost got it...",
  ];
  const [currentThinkingMsg, setCurrentThinkingMsg] = useState(thinkingMessages[0]);

  useEffect(() => {
    if (isThinking) {
      Animated.spring(thinkingAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();

      const dotAnimation = Animated.loop(
        Animated.stagger(150, [
          Animated.sequence([
            Animated.timing(dot1Anim, { toValue: -6, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(dot1Anim, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot2Anim, { toValue: -6, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(dot2Anim, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(dot3Anim, { toValue: -6, duration: 250, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(dot3Anim, { toValue: 0, duration: 250, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
        ])
      );
      dotAnimation.start();

      let msgIdx = 0;
      const msgInterval = setInterval(() => {
        msgIdx = (msgIdx + 1) % thinkingMessages.length;
        setCurrentThinkingMsg(thinkingMessages[msgIdx]);
      }, 1500);

      return () => {
        dotAnimation.stop();
        clearInterval(msgInterval);
      };
    } else {
      Animated.timing(thinkingAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isThinking]);

  const addUserMessage = (text: string) => {
    const newMsg: AceMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const addAceMessage = (text: string, products?: AIProductMatch[]) => {
    const newMsg: AceMessage = {
      id: `msg-${Date.now()}`,
      type: 'ace',
      text,
      timestamp: new Date(),
      products,
    };
    setMessages(prev => [...prev, newMsg]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const searchProductsWithAI = async (description: string) => {
    if (!description.trim()) {
      Alert.alert('Enter Description', 'Please describe what you need.');
      return;
    }

    addUserMessage(description);
    setUserInput('');
    setIsThinking(true);

    try {
      const apiUrl = getLocalApiUrl();
      const response = await fetch(joinUrl(apiUrl, '/api/ai-product-search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) throw new Error('AI search failed');

      const data = await response.json();
      setIsThinking(false);

      if (data.matches && data.matches.length > 0) {
        const matches = data.matches.map((m: any) => ({ ...m, selected: true }));
        addAceMessage(
          `I found ${matches.length} product${matches.length > 1 ? 's' : ''} that match what you're looking for! Tap to select and add them to your estimate:`,
          matches
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        addAceMessage("Hmm, I couldn't find any exact matches for that. Try describing it differently, or give me more details like the brand or type of equipment.");
      }
    } catch (error) {
      console.error('AI search error:', error);
      setIsThinking(false);
      addAceMessage("Oops! I had trouble searching. Let me try again in a moment.");
    }
  };

  const toggleProductSelection = (msgId: string, sku: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId && msg.products) {
        return {
          ...msg,
          products: msg.products.map(p =>
            p.sku === sku ? { ...p, selected: !p.selected } : p
          ),
        };
      }
      return msg;
    }));
  };

  const addProductsFromMessage = (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.products) return;

    const selected = msg.products.filter(p => p.selected);
    if (selected.length === 0) {
      Alert.alert('No Selection', 'Please select at least one product to add.');
      return;
    }

    const newItems: LineItem[] = selected.map(match => ({
      id: `item-${Date.now()}-${match.sku}`,
      product: {
        sku: match.sku,
        heritageNumber: '',
        name: match.name,
        description: '',
        category: match.category as any,
        subcategory: match.subcategory,
        manufacturer: match.manufacturer,
        price: match.price,
        unit: match.unit as any,
      },
      description: '',
      quantity: 1,
      rate: match.price,
      discount: 0,
      discountType: 'percent',
    }));

    setLineItems(prev => [...prev, ...newItems]);
    addAceMessage(`Added ${selected.length} item${selected.length > 1 ? 's' : ''} to your estimate. Need anything else?`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      setShowWebWarning(true);
      setTimeout(() => setShowWebWarning(false), 4000);
      return;
    }
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission Required', 'Microphone permission is needed.');
        return;
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      audioRecorder.record();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      await audioRecorder.stop();
      setIsRecording(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const uri = audioRecorder.uri;
      if (!uri) return;

      setIsThinking(true);
      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

      const apiUrl = getLocalApiUrl();
      const transcribeResponse = await fetch(joinUrl(apiUrl, '/api/transcribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!transcribeResponse.ok) throw new Error('Transcription failed');

      const transcribeData = await transcribeResponse.json();
      const description = transcribeData.text;
      
      if (!description) {
        setIsThinking(false);
        addAceMessage("I didn't catch that. Could you try speaking again or type what you need?");
        return;
      }

      await searchProductsWithAI(description);
    } catch (error) {
      console.error('Failed to process recording:', error);
      setIsThinking(false);
      addAceMessage("Sorry, I had trouble understanding that. Try typing your request instead.");
    }
  };

  const removeLineItem = (id: string) => {
    setLineItems(prev => prev.filter(item => item.id !== id));
  };

  const updateLineItemQuantity = (id: string, quantity: number) => {
    setLineItems(prev => prev.map(item =>
      item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item
    ));
  };

  const calculateItemAmount = (item: LineItem) => {
    return item.quantity * item.rate;
  };

  const subtotal = lineItems.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  const handleSubmit = async () => {
    if (!selectedProperty) {
      Alert.alert('Select Property', 'Please select a property for this estimate.');
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert('Add Items', 'Ask me to find products to add to your estimate.');
      return;
    }

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert('Estimate Created!', `Estimate ${estimateNumber} has been created successfully.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }, 1500);
  };

  const handleSendToOffice = async () => {
    if (!selectedProperty) {
      Alert.alert('Select Property', 'Please select a property before sending.');
      return;
    }
    if (lineItems.length === 0) {
      Alert.alert('No Items', 'Add products to your estimate first.');
      return;
    }

    setIsSubmitting(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Sent to Office!',
        `Estimate ${estimateNumber} for ${selectedProperty} ($${total.toFixed(2)}) has been sent to the office for review.`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }, 1500);
  };

  const filteredProperties = mockProperties.filter(p =>
    p.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.address?.toLowerCase().includes(propertySearch.toLowerCase())
  );

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return BrandColors.emerald;
    if (confidence >= 60) return BrandColors.vividTangerine;
    return BrandColors.danger;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.estimateNumber}>{estimateNumber}</ThemedText>
          <ThemedText style={[styles.estimateLabel, { color: theme.textSecondary }]}>Create with Ace</ThemedText>
        </View>
        <Pressable
          onPress={handleSubmit}
          disabled={isSubmitting || lineItems.length === 0}
          style={[styles.saveButton, (isSubmitting || lineItems.length === 0) && styles.saveButtonDisabled]}
        >
          <ThemedText style={styles.saveButtonText}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </ThemedText>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={{ paddingBottom: Spacing.lg }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.propertySection, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.sectionLabel}>Property</ThemedText>
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

          {messages.map((msg) => (
            <View key={msg.id} style={[
              styles.messageContainer,
              msg.type === 'user' && styles.userMessageContainer,
            ]}>
              {msg.type === 'ace' ? (
                <View style={styles.aceMessageRow}>
                  <Image
                    source={require('../../../assets/images/ask-ace-button.png')}
                    style={styles.aceAvatar}
                    resizeMode="contain"
                  />
                  <View style={[styles.aceBubble, { backgroundColor: '#E8F4FD' }]}>
                    <ThemedText style={styles.aceText}>{msg.text}</ThemedText>
                    {msg.products && msg.products.length > 0 ? (
                      <View style={styles.productResults}>
                        {msg.products.map((product) => (
                          <Pressable
                            key={product.sku}
                            onPress={() => toggleProductSelection(msg.id, product.sku)}
                            style={[
                              styles.productCard,
                              { backgroundColor: theme.surface, borderColor: product.selected ? BrandColors.azureBlue : theme.border },
                            ]}
                          >
                            <View style={styles.productCheckbox}>
                              <View style={[
                                styles.checkbox,
                                product.selected && { backgroundColor: BrandColors.azureBlue, borderColor: BrandColors.azureBlue },
                                { borderColor: theme.border },
                              ]}>
                                {product.selected ? (
                                  <Feather name="check" size={14} color="#fff" />
                                ) : null}
                              </View>
                            </View>
                            <View style={styles.productInfo}>
                              <ThemedText style={styles.productName} numberOfLines={2}>{product.name}</ThemedText>
                              <ThemedText style={[styles.productMeta, { color: theme.textSecondary }]}>
                                {product.manufacturer} • {product.category}
                              </ThemedText>
                              <View style={styles.productReason}>
                                <Feather name="zap" size={12} color={BrandColors.tropicalTeal} />
                                <ThemedText style={[styles.productReasonText, { color: theme.textSecondary }]}>
                                  {product.reason}
                                </ThemedText>
                              </View>
                            </View>
                            <View style={styles.productPriceContainer}>
                              <ThemedText style={styles.productPrice}>${product.price.toFixed(2)}</ThemedText>
                              <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(product.confidence) }]}>
                                <ThemedText style={styles.confidenceText}>{product.confidence}%</ThemedText>
                              </View>
                            </View>
                          </Pressable>
                        ))}
                        <Pressable
                          onPress={() => addProductsFromMessage(msg.id)}
                          style={styles.addSelectedButton}
                        >
                          <Feather name="plus" size={18} color="#fff" />
                          <ThemedText style={styles.addSelectedText}>Add Selected to Estimate</ThemedText>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : (
                <View style={[styles.userBubble, { backgroundColor: BrandColors.azureBlue }]}>
                  <ThemedText style={styles.userText}>{msg.text}</ThemedText>
                </View>
              )}
            </View>
          ))}

          {isThinking ? (
            <View style={styles.messageContainer}>
              <View style={styles.aceMessageRow}>
                <Image
                  source={require('../../../assets/images/ask-ace-button.png')}
                  style={styles.aceAvatar}
                  resizeMode="contain"
                />
                <Animated.View style={[styles.thinkingBubble, { backgroundColor: '#E8F4FD', opacity: thinkingAnim }]}>
                  <ThemedText style={styles.thinkingText}>{currentThinkingMsg}</ThemedText>
                  <View style={styles.thinkingDots}>
                    <Animated.View style={[styles.thinkingDot, { transform: [{ translateY: dot1Anim }] }]} />
                    <Animated.View style={[styles.thinkingDot, { transform: [{ translateY: dot2Anim }] }]} />
                    <Animated.View style={[styles.thinkingDot, { transform: [{ translateY: dot3Anim }] }]} />
                  </View>
                </Animated.View>
              </View>
            </View>
          ) : null}

          {lineItems.length > 0 ? (
            <View style={[styles.estimateSummary, { backgroundColor: theme.surface }]}>
              <ThemedText style={styles.summaryTitle}>Estimate Items ({lineItems.length})</ThemedText>
              {lineItems.map((item, index) => (
                <View key={item.id} style={[styles.lineItemRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.lineItemNumBadge}>
                    <ThemedText style={styles.lineItemNumText}>{index + 1}</ThemedText>
                  </View>
                  <View style={styles.lineItemDetails}>
                    <ThemedText style={styles.lineItemName} numberOfLines={1}>{item.product.name}</ThemedText>
                    <ThemedText style={[styles.lineItemPrice, { color: theme.textSecondary }]}>
                      ${item.rate.toFixed(2)} × {item.quantity} = ${calculateItemAmount(item).toFixed(2)}
                    </ThemedText>
                  </View>
                  <View style={styles.lineItemActions}>
                    <Pressable
                      onPress={() => updateLineItemQuantity(item.id, item.quantity - 1)}
                      style={styles.qtyButton}
                    >
                      <Feather name="minus" size={16} color={theme.text} />
                    </Pressable>
                    <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
                    <Pressable
                      onPress={() => updateLineItemQuantity(item.id, item.quantity + 1)}
                      style={styles.qtyButton}
                    >
                      <Feather name="plus" size={16} color={theme.text} />
                    </Pressable>
                    <Pressable onPress={() => removeLineItem(item.id)} style={styles.removeButton}>
                      <Feather name="trash-2" size={16} color={BrandColors.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}
              <View style={styles.totalsContainer}>
                <View style={styles.totalRow}>
                  <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>Subtotal</ThemedText>
                  <ThemedText style={styles.totalValue}>${subtotal.toFixed(2)}</ThemedText>
                </View>
                <View style={styles.totalRow}>
                  <ThemedText style={[styles.totalLabel, { color: theme.textSecondary }]}>Tax ({taxRate}%)</ThemedText>
                  <ThemedText style={styles.totalValue}>${taxAmount.toFixed(2)}</ThemedText>
                </View>
                <View style={[styles.totalRow, styles.grandTotalRow]}>
                  <ThemedText style={styles.grandTotalLabel}>Total</ThemedText>
                  <ThemedText style={styles.grandTotalValue}>${total.toFixed(2)}</ThemedText>
                </View>
              </View>
              <Pressable
                onPress={handleSendToOffice}
                disabled={isSubmitting}
                style={styles.sendToOfficeButton}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="send" size={18} color="#fff" />
                    <ThemedText style={styles.sendToOfficeText}>Send to Office</ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.inputContainer, { backgroundColor: theme.surface, paddingBottom: insets.bottom + Spacing.sm }]}>
          {showWebWarning ? (
            <View style={styles.webWarningBanner}>
              <Feather name="info" size={14} color="#fff" />
              <ThemedText style={styles.webWarningText}>
                Voice requires Expo Go. Type instead.
              </ThemedText>
            </View>
          ) : null}
          <View style={styles.inputRow}>
            <Pressable
              onPress={isRecording ? stopRecording : startRecording}
              style={[styles.micButton, isRecording && { backgroundColor: BrandColors.danger }]}
            >
              <Feather name={isRecording ? 'stop-circle' : 'mic'} size={22} color="#fff" />
            </Pressable>
            <TextInput
              style={[styles.textInput, { color: theme.text, backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}
              placeholder="Tell Ace what you need..."
              placeholderTextColor={theme.textSecondary}
              value={userInput}
              onChangeText={setUserInput}
              multiline
              maxLength={500}
              editable={!isThinking}
            />
            <Pressable
              onPress={() => searchProductsWithAI(userInput)}
              style={styles.sendButton}
              disabled={isThinking}
            >
              {isThinking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="send" size={20} color="#fff" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

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
            <View style={[styles.searchContainer, { borderColor: theme.border }]}>
              <Feather name="search" size={18} color={theme.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search properties..."
                placeholderTextColor={theme.textSecondary}
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
                  style={[styles.propertyOption, { borderBottomColor: theme.border }]}
                >
                  <ThemedText style={styles.propertyOptionName}>{item.name}</ThemedText>
                  {item.address ? (
                    <ThemedText style={[styles.propertyOptionAddress, { color: theme.textSecondary }]}>
                      {item.address}
                    </ThemedText>
                  ) : null}
                </Pressable>
              )}
            />
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
  chatArea: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  propertySection: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
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
  messageContainer: {
    marginVertical: Spacing.sm,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aceMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  aceAvatar: {
    width: 40,
    height: 32,
    borderRadius: BorderRadius.sm,
  },
  aceBubble: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderTopLeftRadius: BorderRadius.sm,
    maxWidth: '85%',
  },
  aceText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1E293B',
  },
  userBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.sm,
    maxWidth: '80%',
  },
  userText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  thinkingBubble: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderTopLeftRadius: BorderRadius.sm,
    maxWidth: '85%',
  },
  thinkingText: {
    fontSize: 14,
    color: BrandColors.azureBlue,
    marginBottom: Spacing.sm,
  },
  thinkingDots: {
    flexDirection: 'row',
    gap: 6,
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.azureBlue,
  },
  productResults: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  productCard: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  productCheckbox: {
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  productMeta: {
    fontSize: 12,
    marginBottom: 4,
  },
  productReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  productReasonText: {
    fontSize: 11,
    flex: 1,
  },
  productPriceContainer: {
    alignItems: 'flex-end',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  confidenceText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  addSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.azureBlue,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addSelectedText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  estimateSummary: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  lineItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
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
  lineItemDetails: {
    flex: 1,
  },
  lineItemName: {
    fontSize: 14,
    fontWeight: '500',
  },
  lineItemPrice: {
    fontSize: 12,
    marginTop: 2,
  },
  lineItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  totalsContainer: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: '#ddd',
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
  sendToOfficeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: '#1e3a5f',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  sendToOfficeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    padding: Spacing.md,
    ...Shadows.card,
  },
  webWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.vividTangerine,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  webWarningText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandColors.tropicalTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandColors.azureBlue,
    alignItems: 'center',
    justifyContent: 'center',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
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
});
