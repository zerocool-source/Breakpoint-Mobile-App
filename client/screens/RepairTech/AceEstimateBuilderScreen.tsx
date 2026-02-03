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
  Switch,
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import { getLocalApiUrl, joinUrl } from '@/lib/query-client';
import { checkNetworkConnection } from '@/lib/apiHelper';
import NetInfo from '@react-native-community/netinfo';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { ProductCatalog } from '@/components/ProductCatalog';
import { HeritageProduct } from '@/lib/heritageProducts';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { ESTIMATE_COLORS, STATUS_BADGES, generateEstimateNumber, calculateTotals, formatCurrencyDollars } from '@/constants/estimateDesign';
import { mockProperties } from '@/lib/mockData';

const getFirstName = (fullName: string): string => {
  if (!fullName) return '';
  return fullName.split(' ')[0];
};

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
  imageUrl?: string;
  description?: string;
  webInfo?: string;
  loadingInfo?: boolean;
}

interface AceMessage {
  id: string;
  type: 'ace' | 'user' | 'system';
  text: string;
  timestamp: Date;
  products?: AIProductMatch[];
  showDoneButton?: boolean;
}

const DONE_PHRASES = [
  'done', 'no', 'nope', 'that\'s it', 'thats it', 'that is it', 'i\'m done', 'im done',
  'all set', 'all good', 'no thanks', 'nothing else', 'that\'s all', 'thats all',
  'finish', 'finished', 'complete', 'go to estimate', 'lets go', 'let\'s go',
  'no more', 'that will do', 'we\'re done', 'were done', 'good to go'
];

const isDonePhrase = (text: string): boolean => {
  const lowerText = text.toLowerCase().trim();
  return DONE_PHRASES.some(phrase => lowerText === phrase || lowerText.includes(phrase));
};

interface RecommendedProduct {
  sku: string;
  name: string;
  category: string;
  manufacturer: string;
  price: number;
  unit: string;
  matchReason?: string;
  suggestedQuantity?: number;
}

type AceRouteParams = {
  AceEstimateBuilder: {
    updatedDescription?: string;
    recommendedProducts?: RecommendedProduct[];
  };
};

export default function AceEstimateBuilderScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<AceRouteParams, 'AceEstimateBuilder'>>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const chatScrollRef = useRef<ScrollView>(null);
  
  // User info for personalized experience
  const userId = user?.id || null;
  const userFirstName = user?.name ? getFirstName(user.name) : '';
  
  // AI Learning session tracking
  const sessionIdRef = useRef(`session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const lastInteractionIdRef = useRef<string | null>(null);

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

  const [estimateDescription, setEstimateDescription] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
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

  const [showAceModal, setShowAceModal] = useState(false);
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submittedEstimateNumber, setSubmittedEstimateNumber] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');
  const [showDraftSavedModal, setShowDraftSavedModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [messages, setMessages] = useState<AceMessage[]>([]);
  
  // Initialize with personalized greeting
  useEffect(() => {
    const greeting = userFirstName 
      ? `Hey ${userFirstName}! I'm Ace, your AI assistant. I've been learning from your past estimates to give you better suggestions. Tell me what products or repairs you need, and I'll help you find them!`
      : "Hey there! I'm Ace, your AI assistant. Tell me what products or repairs you need for this estimate, and I'll help you find them in our catalog. Just type or speak!";
    
    setMessages([{
      id: '1',
      type: 'ace',
      text: greeting,
      timestamp: new Date(),
    }]);
  }, [userFirstName]);
  const [userInput, setUserInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showWebWarning, setShowWebWarning] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const thinkingAnim = useRef(new Animated.Value(0)).current;
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  // Autosave functionality
  const hasUnsavedChanges = useRef(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const autosaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mark as having unsaved changes when key data changes
  useEffect(() => {
    if (lineItems.length > 0 || selectedProperty || estimateDescription) {
      hasUnsavedChanges.current = true;
    }
  }, [lineItems, selectedProperty, estimateDescription, discountValue, discountType, customerNote, techNotes]);

  // Autosave every 3 seconds if there are changes
  useEffect(() => {
    const autosave = async () => {
      if (!hasUnsavedChanges.current || isSavingDraft || lineItems.length === 0) return;
      
      try {
        setIsSavingDraft(true);
        const { storage } = await import('@/lib/storage');
        
        const selectedProp = mockProperties.find(p => p.name === selectedProperty);
        // Map LineItems to EstimateLineItems for calculation
        const estimateLineItems = lineItems.map((item, idx) => ({
          id: item.id,
          lineNumber: idx + 1,
          productService: item.product.name,
          description: item.description,
          sku: item.product.sku,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.quantity * item.rate,
          taxable: item.taxable,
        }));
        const { subtotal, discountAmount, salesTaxAmount, totalAmount } = calculateTotals(
          estimateLineItems, discountType, discountValue, salesTaxRate
        );

        const draftEstimate = {
          id: estimateNumber,
          estimateNumber,
          propertyId: selectedProp?.id || '',
          propertyName: selectedProperty,
          estimateDate: estimateDate.toISOString(),
          expirationDate: expirationDate.toISOString(),
          description: estimateDescription,
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
          status: 'draft' as const,
          customerNote,
          techNotes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await storage.addEstimate(draftEstimate as any);
        hasUnsavedChanges.current = false;
        setLastSavedAt(new Date());
        console.log('Autosaved estimate:', estimateNumber);
      } catch (error) {
        console.error('Autosave failed:', error);
      } finally {
        setIsSavingDraft(false);
      }
    };

    autosaveIntervalRef.current = setInterval(autosave, 3000);
    
    return () => {
      if (autosaveIntervalRef.current) {
        clearInterval(autosaveIntervalRef.current);
      }
    };
  }, [lineItems, selectedProperty, estimateDescription, discountType, discountValue, salesTaxRate, customerNote, techNotes, estimateNumber, estimateDate, expirationDate, isSavingDraft]);

  const thinkingMessages = [
    "Let me search the catalog...",
    "Looking through 600+ products...",
    "Finding the best matches...",
    "Almost got it...",
  ];
  const [currentThinkingMsg, setCurrentThinkingMsg] = useState(thinkingMessages[0]);

  useEffect(() => {
    if (route.params?.updatedDescription !== undefined) {
      setEstimateDescription(route.params.updatedDescription);
    }
  }, [route.params?.updatedDescription]);

  // Handle recommended products from QuoteDescriptionScreen
  useEffect(() => {
    if (route.params?.recommendedProducts && route.params.recommendedProducts.length > 0) {
      const newProducts = route.params.recommendedProducts;
      
      // Add each recommended product as a line item
      setLineItems(prev => {
        const existingSkus = new Set(prev.map(item => item.product.sku));
        const newLineItems = newProducts
          .filter(product => !existingSkus.has(product.sku))
          .map((product, index) => ({
            id: `li-${Date.now()}-${product.sku}-${index}`,
            lineNumber: prev.length + 1 + index,
            product: {
              sku: product.sku,
              name: product.name,
              category: product.category,
              subcategory: '', // Not available from recommendations
              manufacturer: product.manufacturer,
              heritageNumber: '', // Not available from recommendations
              price: product.price,
              unit: product.unit || 'ea',
            },
            description: product.matchReason || '',
            quantity: product.suggestedQuantity || 1,
            rate: product.price,
            taxable: true,
          }));
        
        if (newLineItems.length > 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        
        return [...prev, ...newLineItems];
      });
    }
  }, [route.params?.recommendedProducts]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

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
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const addAceMessage = (text: string, products?: AIProductMatch[], showDoneButton?: boolean) => {
    const newMsg: AceMessage = {
      id: `ace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'ace',
      text,
      timestamp: new Date(),
      products,
      showDoneButton,
    };
    setMessages(prev => [...prev, newMsg]);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // AI Learning helper functions - includes userId for per-user personalization
  const logAIInteraction = async (userQuery: string, suggestedProducts: AIProductMatch[]) => {
    try {
      const apiUrl = getLocalApiUrl();
      const response = await fetch(joinUrl(apiUrl, '/api/ai-learning/log-interaction'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          userQuery,
          suggestedProducts: suggestedProducts.map(p => ({ 
            sku: p.sku, 
            name: p.name, 
            confidence: p.confidence 
          })),
          sessionId: sessionIdRef.current,
          propertyType: mockProperties.find(p => p.name === selectedProperty)?.type,
        }),
      });
      const data = await response.json();
      if (data.interactionId) {
        lastInteractionIdRef.current = data.interactionId;
      }
    } catch (error) {
      console.error('Failed to log AI interaction:', error);
    }
  };

  const logProductFeedback = async (
    productSku: string, 
    productName: string, 
    feedbackType: 'selected' | 'rejected', 
    quantity?: number,
    confidence?: number
  ) => {
    if (!lastInteractionIdRef.current) return;
    try {
      const apiUrl = getLocalApiUrl();
      await fetch(joinUrl(apiUrl, '/api/ai-learning/log-feedback'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          interactionId: lastInteractionIdRef.current,
          productSku,
          productName,
          feedbackType,
          quantitySelected: quantity,
          confidenceScore: confidence,
        }),
      });
    } catch (error) {
      console.error('Failed to log product feedback:', error);
    }
  };

  const logEstimateCompletion = async () => {
    if (lineItems.length === 0) return;
    try {
      const apiUrl = getLocalApiUrl();
      await fetch(joinUrl(apiUrl, '/api/ai-learning/log-estimate-completion'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          sessionId: sessionIdRef.current,
          selectedProducts: lineItems.map(item => ({ 
            sku: item.product.sku, 
            quantity: item.quantity 
          })),
          propertyType: mockProperties.find(p => p.name === selectedProperty)?.type,
        }),
      });
    } catch (error) {
      console.error('Failed to log estimate completion:', error);
    }
  };

  const handleFinishEstimate = () => {
    logEstimateCompletion();
    setShowAceModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  const searchProductsWithAI = async (description: string) => {
    if (!description.trim()) {
      Alert.alert('Enter Description', 'Please describe what you need.');
      return;
    }

    addUserMessage(description);
    setUserInput('');

    // Check if user is indicating they're done
    if (isDonePhrase(description)) {
      const itemCount = lineItems.length;
      if (itemCount > 0) {
        addAceMessage(
          `Great! You have ${itemCount} item${itemCount > 1 ? 's' : ''} in your estimate. Ready to review and finalize?`,
          undefined,
          true // Show done button
        );
      } else {
        addAceMessage(
          "Looks like you haven't added any items yet. Would you like to add some products first, or continue to the estimate form?",
          undefined,
          true
        );
      }
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return;
    }

    setIsThinking(true);

    try {
      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        setIsThinking(false);
        addAceMessage("I can't connect right now. Please check your internet connection and try again.");
        return;
      }

      const apiUrl = getLocalApiUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(joinUrl(apiUrl, '/api/ai-product-search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, userId }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        setIsThinking(false);
        if (response.status >= 500) {
          addAceMessage("Our service is temporarily busy. Please try again in a moment.");
        } else if (response.status === 401) {
          addAceMessage("Your session has expired. Please log in again.");
        } else {
          addAceMessage("I had trouble searching. Please try again or describe it differently.");
        }
        return;
      }

      const data = await response.json();
      setIsThinking(false);

      if (data.matches && data.matches.length > 0) {
        const matches = data.matches.map((m: any) => ({ ...m, selected: true }));
        
        logAIInteraction(description, matches);
        
        let messageText = `I found ${matches.length} product${matches.length > 1 ? 's' : ''} that match what you're looking for!`;
        if (data.learnedFromHistory) {
          messageText += userFirstName 
            ? ` (Based on your past estimates, ${userFirstName})`
            : ' (Improved by learning from past estimates)';
        }
        messageText += ' Tap to select and add them to your estimate:';
        
        addAceMessage(messageText, matches);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        addAceMessage("Hmm, I couldn't find any exact matches for that. Try describing it differently, or give me more details like the brand or type of equipment.");
      }
    } catch (error: any) {
      console.error('AI search error:', error);
      setIsThinking(false);
      if (error.name === 'AbortError') {
        addAceMessage("That search took too long. Try being more specific, or try again in a moment.");
      } else {
        addAceMessage("I had trouble searching. Please check your connection and try again.");
      }
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
    const rejected = msg.products.filter(p => !p.selected);
    
    if (selected.length === 0) {
      Alert.alert('No Selection', 'Please select at least one product to add.');
      return;
    }

    // Log feedback for learning - selected products
    selected.forEach(p => {
      logProductFeedback(p.sku, p.name, 'selected', 1, p.confidence / 100);
    });
    
    // Log feedback for learning - rejected products
    rejected.forEach(p => {
      logProductFeedback(p.sku, p.name, 'rejected', 0, p.confidence / 100);
    });

    const currentLength = lineItems.length;
    const newItems: LineItem[] = selected.map((match, idx) => ({
      id: `item-${Date.now()}-${match.sku}`,
      lineNumber: currentLength + idx + 1,
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
      taxable: true,
    }));

    setLineItems(prev => [...prev, ...newItems]);
    addAceMessage(`Added ${selected.length} item${selected.length > 1 ? 's' : ''} to your estimate. Need anything else?`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const fetchProductWebInfo = async (msgId: string, product: AIProductMatch) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === msgId && msg.products) {
        return {
          ...msg,
          products: msg.products.map(p =>
            p.sku === product.sku ? { ...p, loadingInfo: true } : p
          ),
        };
      }
      return msg;
    }));

    try {
      const apiUrl = getLocalApiUrl();
      const response = await fetch(joinUrl(apiUrl, '/api/ai-product-search/web-info'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: product.name,
          manufacturer: product.manufacturer,
          partNumber: product.sku,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch info');

      const data = await response.json();

      setMessages(prev => prev.map(msg => {
        if (msg.id === msgId && msg.products) {
          return {
            ...msg,
            products: msg.products.map(p =>
              p.sku === product.sku ? { ...p, webInfo: data.webInfo, loadingInfo: false } : p
            ),
          };
        }
        return msg;
      }));

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('Failed to fetch web info:', error);
      setMessages(prev => prev.map(msg => {
        if (msg.id === msgId && msg.products) {
          return {
            ...msg,
            products: msg.products.map(p =>
              p.sku === product.sku ? { ...p, loadingInfo: false, webInfo: 'Unable to fetch additional info.' } : p
            ),
          };
        }
        return msg;
      }));
    }
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
      
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      audioRecorder.record();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      addAceMessage("I couldn't start recording. Please make sure you've granted microphone permissions and try again.");
    }
  };

  const stopRecording = async () => {
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

      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

      const isConnected = await checkNetworkConnection();
      if (!isConnected) {
        setIsTranscribing(false);
        addAceMessage("No internet connection. Please check your network and try again.");
        return;
      }

      const apiUrl = getLocalApiUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const transcribeResponse = await fetch(joinUrl(apiUrl, '/api/transcribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!transcribeResponse.ok) {
        setIsTranscribing(false);
        if (transcribeResponse.status >= 500) {
          addAceMessage("Our transcription service is busy right now. Please try typing your request instead.");
        } else {
          addAceMessage("I couldn't process your voice message. Please try again or type your request.");
        }
        return;
      }

      const transcribeData = await transcribeResponse.json();
      const description = transcribeData.text;
      setIsTranscribing(false);

      if (!description) {
        addAceMessage("I didn't catch that. Could you try speaking again or type what you need?");
        return;
      }

      setUserInput(description);
      
      await searchProductsWithAI(description);
    } catch (error: any) {
      console.error('Failed to process recording:', error);
      setIsTranscribing(false);
      setIsThinking(false);
      if (error.name === 'AbortError') {
        addAceMessage("Voice processing timed out. Please try again or type your request instead.");
      } else {
        addAceMessage("Sorry, I had trouble understanding that. Try typing your request instead.");
      }
    }
  };

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

  const generateDescriptionWithAce = async () => {
    if (lineItems.length === 0) {
      Alert.alert('No Items', 'Add some items to the estimate first, then Ace can help write a description.');
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const itemsList = lineItems.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
      const prompt = `Write a professional, concise quote description for a commercial pool repair estimate that includes: ${itemsList}. Keep it to 2-3 sentences describing the work to be performed.`;

      const apiUrl = getLocalApiUrl();
      const response = await fetch(joinUrl(apiUrl, '/api/ai-product-search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: prompt, generateDescription: true }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.description) {
          setEstimateDescription(data.description);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          const productNames = lineItems.map(item => item.product.name).join(', ');
          setEstimateDescription(`Repair and replacement services including: ${productNames}. All work performed by certified technicians with industry-standard equipment and materials.`);
        }
      } else {
        const productNames = lineItems.map(item => item.product.name).join(', ');
        setEstimateDescription(`Repair and replacement services including: ${productNames}. All work performed by certified technicians with industry-standard equipment and materials.`);
      }
    } catch (error) {
      console.error('Failed to generate description:', error);
      const productNames = lineItems.map(item => item.product.name).join(', ');
      setEstimateDescription(`Repair and replacement services including: ${productNames}. All work performed by certified technicians with industry-standard equipment and materials.`);
    } finally {
      setIsGeneratingDescription(false);
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

  const uploadPhotos = async (photosToUpload: PhotoAttachment[], authToken: string | null): Promise<string[]> => {
    if (photosToUpload.length === 0) return [];
    
    try {
      const apiUrl = getLocalApiUrl();
      const formData = new FormData();
      
      // Map file extensions to proper MIME types
      const getMimeType = (filename: string): string => {
        const ext = filename.split('.').pop()?.toLowerCase() || '';
        const mimeTypes: Record<string, string> = {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'gif': 'image/gif',
          'webp': 'image/webp',
          'heic': 'image/heic',
          'heif': 'image/heif',
          'tiff': 'image/tiff',
          'tif': 'image/tiff',
          'bmp': 'image/bmp',
        };
        return mimeTypes[ext] || 'image/jpeg';
      };
      
      for (const photo of photosToUpload) {
        const filename = photo.uri.split('/').pop() || `photo-${Date.now()}.jpg`;
        const type = getMimeType(filename);
        
        if (Platform.OS === 'web') {
          // On web, fetch the blob and create a File object
          try {
            const response = await fetch(photo.uri);
            const blob = await response.blob();
            const file = new File([blob], filename, { type });
            formData.append('photos', file);
          } catch (e) {
            console.error('[Photo Upload] Failed to fetch blob for web:', e);
            // Fallback: try base64 data URI approach
            formData.append('photos', {
              uri: photo.uri,
              name: filename,
              type,
            } as any);
          }
        } else {
          // On native (iOS/Android), use the React Native FormData format
          formData.append('photos', {
            uri: photo.uri,
            name: filename,
            type,
          } as any);
        }
      }
      
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      console.log('[Photo Upload] Uploading', photosToUpload.length, 'photos on', Platform.OS);
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

  const handleSubmit = async (sendToOffice: boolean) => {
    if (!selectedProperty) {
      setValidationErrorMessage('Please select a property for this estimate.');
      setShowValidationError(true);
      return;
    }
    if (lineItems.length === 0) {
      setValidationErrorMessage('Please add at least one item to the estimate.');
      setShowValidationError(true);
      return;
    }

    setIsSubmitting(true);
    console.log('[Estimate Submit] Starting submission, sendToOffice:', sendToOffice);
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
        description: estimateDescription,
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

      // If just saving draft (not sending to office), we're done - show success modal
      if (!sendToOffice) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowDraftSavedModal(true);
        return;
      }
      
      // If sending to office, also sync to server
      const estimateData = {
        estimateNumber,
        propertyId: selectedProp?.id || '',
        propertyName: selectedProperty,
        title: estimateDescription?.split('\n')[0]?.slice(0, 100) || `Field Estimate - ${selectedProperty}`,
        estimateDate: estimateDate.toISOString(),
        expirationDate: expirationDate.toISOString(),
        description: estimateDescription,
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
      console.log('[Estimate Submit] Server response:', result);
      
      // Update local copy with server ID
      const updatedEstimate = { ...localEstimate, id: result.estimate?.id || estimateNumber, status: 'pending_approval' };
      await storage.addEstimate(updatedEstimate as any);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show custom success modal (works on all platforms including web)
      setSubmittedEstimateNumber(estimateNumber);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving estimate:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorModalMessage('Failed to send estimate to office. The draft has been saved locally. Please try again when connected.');
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProperties = mockProperties.filter(p =>
    p.name.toLowerCase().includes(propertySearch.toLowerCase()) ||
    p.address?.toLowerCase().includes(propertySearch.toLowerCase())
  );

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return BrandColors.emerald;
    if (confidence >= 60) return BrandColors.vividTangerine;
    return BrandColors.danger;
  };

  return (
    <View style={[styles.container, { backgroundColor: ESTIMATE_COLORS.bgSlate50 }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>ESTIMATE</ThemedText>
          <ThemedText style={styles.headerSubtitle}>AI Assisted</ThemedText>
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
                <View style={styles.statusRow}>
                  <View style={[styles.statusBadge, { backgroundColor: STATUS_BADGES.draft.bg, borderColor: STATUS_BADGES.draft.border }]}>
                    <ThemedText style={[styles.statusText, { color: STATUS_BADGES.draft.text }]}>Draft</ThemedText>
                  </View>
                  {isSavingDraft ? (
                    <View style={styles.autosaveIndicator}>
                      <ActivityIndicator size="small" color={ESTIMATE_COLORS.textSlate400} />
                      <ThemedText style={styles.autosaveText}>Saving...</ThemedText>
                    </View>
                  ) : lastSavedAt ? (
                    <View style={styles.autosaveIndicator}>
                      <Feather name="check-circle" size={12} color={ESTIMATE_COLORS.statusGreen} />
                      <ThemedText style={styles.autosaveText}>
                        Saved {Math.floor((Date.now() - lastSavedAt.getTime()) / 1000) < 5 ? 'just now' : 
                          `${Math.floor((Date.now() - lastSavedAt.getTime()) / 1000)}s ago`}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.sectionCardOrange}>
            <View style={styles.sectionHeader}>
              <Feather name="clipboard" size={18} color={ESTIMATE_COLORS.accent} />
              <ThemedText style={[styles.sectionLabel, { color: ESTIMATE_COLORS.accent, marginBottom: 0 }]}>Work Order Tracking</ThemedText>
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
                <ThemedText style={[styles.sectionLabel, { marginBottom: 0 }]}>Line Items</ThemedText>
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
                <ThemedText style={styles.emptySubtext}>Tap "Add Item" or ask Ace to find products</ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.photoSectionHeader}>
              <Feather name="camera" size={18} color={ESTIMATE_COLORS.textDark} />
              <ThemedText style={styles.sectionLabel}>Photos</ThemedText>
              <ThemedText style={styles.photoCount}>
                {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? 's' : ''}` : ''}
              </ThemedText>
            </View>
            <View style={styles.photoUploadRow}>
              <Pressable onPress={takePhoto} style={styles.photoUploadButton}>
                <View style={styles.photoUploadIconCircle}>
                  <Feather name="camera" size={20} color={ESTIMATE_COLORS.secondary} />
                </View>
                <ThemedText style={styles.photoUploadLabel}>Take Photo</ThemedText>
              </Pressable>
              <Pressable onPress={pickPhoto} style={styles.photoUploadButton}>
                <View style={styles.photoUploadIconCircle}>
                  <Feather name="image" size={20} color={ESTIMATE_COLORS.secondary} />
                </View>
                <ThemedText style={styles.photoUploadLabel}>From Gallery</ThemedText>
              </Pressable>
            </View>
            {photos.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoThumbnailsRow}>
                {photos.map(photo => (
                  <View key={photo.id} style={styles.photoThumbItem}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumbImage} />
                    <Pressable onPress={() => removePhoto(photo.id)} style={styles.photoRemoveBtn}>
                      <Feather name="x" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noPhotosHint}>
                <ThemedText style={styles.noPhotosText}>No photos attached yet</ThemedText>
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.descriptionHeader}>
              <View style={styles.descriptionTitleRow}>
                <Feather name="file-text" size={18} color={ESTIMATE_COLORS.textDark} />
                <ThemedText style={[styles.sectionLabel, { marginBottom: 0 }]}>Quote Description</ThemedText>
              </View>
              <Pressable
                onPress={() => {
                  navigation.navigate('QuoteDescription', {
                    lineItems: lineItems.map(item => ({
                      id: item.id,
                      lineNumber: item.lineNumber,
                      product: {
                        sku: item.product.sku,
                        name: item.product.name,
                        category: item.product.category,
                        manufacturer: item.product.manufacturer,
                        price: item.product.price,
                        unit: item.product.unit,
                      },
                      description: item.description,
                      quantity: item.quantity,
                      rate: item.rate,
                      taxable: item.taxable,
                    })),
                    currentDescription: estimateDescription,
                    propertyName: selectedProperty,
                  });
                }}
                style={styles.editDescButton}
              >
                <Feather name="edit-2" size={14} color={ESTIMATE_COLORS.secondary} />
                <ThemedText style={styles.editDescText}>Edit</ThemedText>
              </Pressable>
            </View>
            <Pressable
              onPress={() => {
                navigation.navigate('QuoteDescription', {
                  lineItems: lineItems.map(item => ({
                    id: item.id,
                    lineNumber: item.lineNumber,
                    product: {
                      sku: item.product.sku,
                      name: item.product.name,
                      category: item.product.category,
                      manufacturer: item.product.manufacturer,
                      price: item.product.price,
                      unit: item.product.unit,
                    },
                    description: item.description,
                    quantity: item.quantity,
                    rate: item.rate,
                    taxable: item.taxable,
                  })),
                  currentDescription: estimateDescription,
                  propertyName: selectedProperty,
                });
              }}
              style={styles.descriptionPreview}
            >
              {estimateDescription ? (
                <ThemedText style={styles.descriptionPreviewText} numberOfLines={4}>
                  {estimateDescription}
                </ThemedText>
              ) : (
                <View style={styles.descriptionEmpty}>
                  <Feather name="mic" size={20} color={ESTIMATE_COLORS.textSlate400} />
                  <ThemedText style={styles.descriptionEmptyText}>
                    Tap to add description with voice or text
                  </ThemedText>
                </View>
              )}
            </Pressable>
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

          </ScrollView>

        <Animated.View style={[styles.aceFloatingButton, { transform: [{ scale: pulseAnim }] }]}>
          <Pressable onPress={() => setShowAceModal(true)} style={styles.aceButtonInner}>
            <Image
              source={require('../../../assets/images/ace-ai-button.png')}
              style={styles.aceButtonImage}
              resizeMode="contain"
            />
          </Pressable>
        </Animated.View>

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
                onPress={() => {
                  if (!selectedProperty) {
                    setValidationErrorMessage('Please select a property for this estimate.');
                    setShowValidationError(true);
                    return;
                  }
                  if (lineItems.length === 0) {
                    setValidationErrorMessage('Please add at least one item to the estimate.');
                    setShowValidationError(true);
                    return;
                  }
                  setShowSendConfirmModal(true);
                }}
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

      <Modal visible={showSendConfirmModal} animationType="fade" transparent onRequestClose={() => setShowSendConfirmModal(false)}>
        <View style={styles.sendConfirmOverlay}>
          <View style={styles.sendConfirmModal}>
            <View style={styles.sendConfirmIconContainer}>
              <Feather name="send" size={32} color={ESTIMATE_COLORS.primary} />
            </View>
            <ThemedText style={styles.sendConfirmTitle}>Submit to Office Admin</ThemedText>
            <ThemedText style={styles.sendConfirmMessage}>
              This estimate will be submitted to the office admin for review and approval. A copy will be saved to your estimates.
            </ThemedText>
            <ThemedText style={styles.sendConfirmQuestion}>Ready to submit?</ThemedText>
            <View style={styles.sendConfirmButtons}>
              <Pressable
                onPress={() => setShowSendConfirmModal(false)}
                style={styles.sendConfirmNoBtn}
              >
                <ThemedText style={styles.sendConfirmNoText}>No</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => {
                  setShowSendConfirmModal(false);
                  handleSubmit(true);
                }}
                style={styles.sendConfirmYesBtn}
              >
                <ThemedText style={styles.sendConfirmYesText}>Submit</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showSuccessModal} animationType="fade" transparent onRequestClose={() => {}}>
        <View style={styles.sendConfirmOverlay}>
          <View style={styles.sendConfirmModal}>
            <View style={[styles.sendConfirmIconContainer, { backgroundColor: '#E8F5E9' }]}>
              <Feather name="check-circle" size={32} color="#4CAF50" />
            </View>
            <ThemedText style={styles.sendConfirmTitle}>Submitted to Office Admin</ThemedText>
            <ThemedText style={styles.sendConfirmMessage}>
              Estimate {submittedEstimateNumber} has been submitted to the office for review and approval.
            </ThemedText>
            <ThemedText style={[styles.sendConfirmQuestion, { color: '#4CAF50' }]}>
              You will be notified when the admin responds.
            </ThemedText>
            <Pressable
              testID="success-ok-button"
              onPress={() => {
                setShowSuccessModal(false);
                navigation.goBack();
              }}
              style={[styles.sendConfirmYesBtn, { width: '100%', backgroundColor: '#4CAF50' }]}
            >
              <ThemedText style={styles.sendConfirmYesText}>OK</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showValidationError} animationType="fade" transparent onRequestClose={() => setShowValidationError(false)}>
        <View style={styles.sendConfirmOverlay}>
          <View style={styles.sendConfirmModal}>
            <View style={[styles.sendConfirmIconContainer, { backgroundColor: '#FFF3E0' }]}>
              <Feather name="alert-circle" size={32} color="#FF9800" />
            </View>
            <ThemedText style={styles.sendConfirmTitle}>Missing Information</ThemedText>
            <ThemedText style={styles.sendConfirmMessage}>
              {validationErrorMessage}
            </ThemedText>
            <Pressable
              onPress={() => setShowValidationError(false)}
              style={[styles.sendConfirmYesBtn, { width: '100%', backgroundColor: '#FF9800' }]}
            >
              <ThemedText style={styles.sendConfirmYesText}>OK</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showDraftSavedModal} animationType="fade" transparent onRequestClose={() => {}}>
        <View style={styles.sendConfirmOverlay}>
          <View style={styles.sendConfirmModal}>
            <View style={[styles.sendConfirmIconContainer, { backgroundColor: '#E3F2FD' }]}>
              <Feather name="save" size={32} color={ESTIMATE_COLORS.primary} />
            </View>
            <ThemedText style={styles.sendConfirmTitle}>Draft Saved!</ThemedText>
            <ThemedText style={styles.sendConfirmMessage}>
              Estimate {estimateNumber} has been saved as a draft.
            </ThemedText>
            <Pressable
              onPress={() => {
                setShowDraftSavedModal(false);
                navigation.goBack();
              }}
              style={[styles.sendConfirmYesBtn, { width: '100%', backgroundColor: ESTIMATE_COLORS.primary }]}
            >
              <ThemedText style={styles.sendConfirmYesText}>OK</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showErrorModal} animationType="fade" transparent onRequestClose={() => {}}>
        <View style={styles.sendConfirmOverlay}>
          <View style={styles.sendConfirmModal}>
            <View style={[styles.sendConfirmIconContainer, { backgroundColor: '#FFEBEE' }]}>
              <Feather name="x-circle" size={32} color="#F44336" />
            </View>
            <ThemedText style={styles.sendConfirmTitle}>Error</ThemedText>
            <ThemedText style={styles.sendConfirmMessage}>
              {errorModalMessage}
            </ThemedText>
            <Pressable
              onPress={() => {
                setShowErrorModal(false);
                navigation.goBack();
              }}
              style={[styles.sendConfirmYesBtn, { width: '100%', backgroundColor: '#F44336' }]}
            >
              <ThemedText style={styles.sendConfirmYesText}>OK</ThemedText>
            </Pressable>
          </View>
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

      <Modal visible={showAceModal} animationType="slide" onRequestClose={() => setShowAceModal(false)}>
        <View style={[styles.aceModal, { paddingTop: insets.top }]}>
          <View style={styles.aceModalHeader}>
            <View style={styles.aceModalTitleRow}>
              <Image
                source={require('../../../assets/images/ace-ai-button.png')}
                style={styles.aceModalAvatar}
                resizeMode="contain"
              />
              <View>
                <ThemedText style={styles.aceModalTitle}>Ask Ace</ThemedText>
                <ThemedText style={styles.aceModalSubtitle}>AI Product Assistant</ThemedText>
              </View>
            </View>
            <Pressable onPress={() => setShowAceModal(false)} style={styles.aceModalCloseBtn}>
              <Feather name="x" size={24} color={ESTIMATE_COLORS.textDark} />
            </Pressable>
          </View>

          <ScrollView
            ref={chatScrollRef}
            style={styles.chatArea}
            contentContainerStyle={{ paddingBottom: Spacing.lg }}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              <View key={msg.id} style={[
                styles.messageContainer,
                msg.type === 'user' && styles.userMessageContainer,
              ]}>
                {msg.type === 'ace' ? (
                  <View style={styles.aceMessageRow}>
                    <Image
                      source={require('../../../assets/images/ace-ai-button.png')}
                      style={styles.aceAvatar}
                      resizeMode="contain"
                    />
                    <View style={styles.aceBubble}>
                      <ThemedText style={styles.aceText}>{msg.text}</ThemedText>
                      {msg.showDoneButton ? (
                        <Pressable
                          onPress={handleFinishEstimate}
                          style={styles.doneEstimateButton}
                        >
                          <Feather name="check-circle" size={18} color="#fff" />
                          <ThemedText style={styles.doneEstimateText}>Done - Go to Estimate</ThemedText>
                        </Pressable>
                      ) : null}
                      {msg.products && msg.products.length > 0 ? (
                        <View style={styles.productResults}>
                          {msg.products.map((product) => (
                            <View key={product.sku} style={styles.productCardWrapper}>
                              <Pressable
                                onPress={() => toggleProductSelection(msg.id, product.sku)}
                                style={[
                                  styles.productCard,
                                  { borderColor: product.selected ? BrandColors.azureBlue : ESTIMATE_COLORS.borderLight },
                                ]}
                              >
                                <View style={styles.productCheckbox}>
                                  <View style={[
                                    styles.checkbox,
                                    product.selected && { backgroundColor: BrandColors.azureBlue, borderColor: BrandColors.azureBlue },
                                  ]}>
                                    {product.selected ? (
                                      <Feather name="check" size={14} color="#fff" />
                                    ) : null}
                                  </View>
                                </View>
                                <View style={styles.productInfo}>
                                  <ThemedText style={styles.productName} numberOfLines={2}>{product.name}</ThemedText>
                                  <ThemedText style={styles.productMeta}>
                                    {product.manufacturer} • {product.category}
                                  </ThemedText>
                                  <View style={styles.productReason}>
                                    <Feather name="zap" size={12} color={BrandColors.tropicalTeal} />
                                    <ThemedText style={styles.productReasonText}>
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
                              <Pressable
                                onPress={() => fetchProductWebInfo(msg.id, product)}
                                style={styles.moreInfoButton}
                                disabled={product.loadingInfo}
                              >
                                {product.loadingInfo ? (
                                  <ActivityIndicator size="small" color={BrandColors.azureBlue} />
                                ) : (
                                  <>
                                    <Feather name="globe" size={14} color={BrandColors.azureBlue} />
                                    <ThemedText style={styles.moreInfoText}>
                                      {product.webInfo ? 'Info Loaded' : 'Ask Ace for More Info'}
                                    </ThemedText>
                                  </>
                                )}
                              </Pressable>
                              {product.webInfo ? (
                                <View style={styles.webInfoBox}>
                                  <Feather name="info" size={14} color={BrandColors.tropicalTeal} style={{ marginRight: 6 }} />
                                  <ThemedText style={styles.webInfoText}>{product.webInfo}</ThemedText>
                                </View>
                              ) : null}
                            </View>
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
                  <View style={styles.userBubble}>
                    <ThemedText style={styles.userText}>{msg.text}</ThemedText>
                  </View>
                )}
              </View>
            ))}

            {isThinking ? (
              <View style={styles.messageContainer}>
                <View style={styles.aceMessageRow}>
                  <Image
                    source={require('../../../assets/images/ace-ai-button.png')}
                    style={styles.aceAvatar}
                    resizeMode="contain"
                  />
                  <Animated.View style={[styles.thinkingBubble, { opacity: thinkingAnim }]}>
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
          </ScrollView>

          <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
            {showWebWarning ? (
              <View style={styles.webWarningBanner}>
                <Feather name="info" size={14} color="#fff" />
                <ThemedText style={styles.webWarningText}>
                  Voice requires Expo Go. Type instead.
                </ThemedText>
              </View>
            ) : null}
            {isRecording ? (
              <View style={styles.recordingIndicator}>
                <Animated.View style={[styles.recordingDot, { transform: [{ scale: pulseAnim }] }]} />
                <ThemedText style={styles.recordingText}>Listening... Tap mic to stop</ThemedText>
              </View>
            ) : null}
            {isTranscribing ? (
              <View style={styles.transcribingIndicator}>
                <ActivityIndicator size="small" color={BrandColors.azureBlue} />
                <ThemedText style={styles.transcribingText}>Transcribing your voice...</ThemedText>
              </View>
            ) : null}
            <View style={styles.inputRow}>
              <Pressable
                onPress={isRecording ? stopRecording : startRecording}
                style={[styles.micButton, isRecording && { backgroundColor: BrandColors.danger }]}
              >
                <Feather name={isRecording ? 'stop-circle' : 'mic'} size={48} color="#fff" />
              </Pressable>
              <TextInput
                style={styles.textInput}
                placeholder="Tell Ace what you need..."
                placeholderTextColor={ESTIMATE_COLORS.textSlate400}
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
        </View>
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  autosaveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autosaveText: {
    fontSize: 10,
    color: ESTIMATE_COLORS.textSlate400,
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
    textAlign: 'center',
  },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: ESTIMATE_COLORS.borderLight,
    gap: Spacing.sm,
  },
  photoIconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumbnails: {
    flex: 1,
  },
  photoThumbSmall: {
    width: 36,
    height: 36,
    borderRadius: 6,
    marginRight: Spacing.xs,
    position: 'relative',
  },
  photoThumbSmallImg: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  photoRemoveSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: ESTIMATE_COLORS.statusRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHintInline: {
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate400,
    flex: 1,
  },
  photoSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  photoCount: {
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate400,
    marginLeft: 'auto',
  },
  photoUploadRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  photoUploadButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: ESTIMATE_COLORS.bgSlate50,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderStyle: 'dashed',
    gap: Spacing.sm,
  },
  photoUploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoUploadLabel: {
    fontSize: 13,
    color: ESTIMATE_COLORS.textDark,
    fontWeight: '500',
  },
  photoThumbnailsRow: {
    marginTop: Spacing.sm,
  },
  photoThumbItem: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
    position: 'relative',
  },
  photoThumbImage: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ESTIMATE_COLORS.statusRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noPhotosHint: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  noPhotosText: {
    fontSize: 13,
    color: ESTIMATE_COLORS.textSlate400,
  },
  descriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  descriptionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  askAceSmallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#E8F4FD',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.secondary,
  },
  askAceSmallImg: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  askAceSmallText: {
    fontSize: 14,
    fontWeight: '600',
    color: ESTIMATE_COLORS.secondary,
  },
  descriptionInput: {
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 8,
    padding: Spacing.md,
    fontSize: 14,
    color: ESTIMATE_COLORS.textDark,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editDescButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F4FD',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.secondary,
  },
  editDescText: {
    fontSize: 12,
    fontWeight: '600',
    color: ESTIMATE_COLORS.secondary,
  },
  descriptionPreview: {
    backgroundColor: ESTIMATE_COLORS.bgSlate50,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: 8,
    padding: Spacing.md,
    minHeight: 80,
  },
  descriptionPreviewText: {
    fontSize: 14,
    color: ESTIMATE_COLORS.textDark,
    lineHeight: 20,
  },
  descriptionEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  descriptionEmptyText: {
    fontSize: 13,
    color: ESTIMATE_COLORS.textSlate400,
    textAlign: 'center',
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
  aceFloatingButton: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 220,
    zIndex: 10,
  },
  aceButtonInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  aceButtonImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
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
  sendConfirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  sendConfirmModal: {
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderRadius: 16,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  sendConfirmIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ESTIMATE_COLORS.bgSlate100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sendConfirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ESTIMATE_COLORS.textDark,
    marginBottom: Spacing.sm,
  },
  sendConfirmMessage: {
    fontSize: 14,
    color: ESTIMATE_COLORS.textSlate500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  sendConfirmQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textDark,
    marginBottom: Spacing.lg,
  },
  sendConfirmButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  sendConfirmNoBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: ESTIMATE_COLORS.bgSlate100,
    alignItems: 'center',
  },
  sendConfirmNoText: {
    fontSize: 16,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textSlate500,
  },
  sendConfirmYesBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: ESTIMATE_COLORS.primary,
    alignItems: 'center',
  },
  sendConfirmYesText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  aceModal: {
    flex: 1,
    backgroundColor: ESTIMATE_COLORS.bgSlate50,
  },
  aceModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ESTIMATE_COLORS.borderLight,
  },
  aceModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aceModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  aceModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textDark,
  },
  aceModalSubtitle: {
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate500,
  },
  aceModalCloseBtn: {
    padding: Spacing.sm,
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: Spacing.md,
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
    backgroundColor: '#E8F4FD',
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
    backgroundColor: BrandColors.azureBlue,
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
    backgroundColor: '#E8F4FD',
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
    backgroundColor: ESTIMATE_COLORS.bgWhite,
  },
  productCheckbox: {
    justifyContent: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: ESTIMATE_COLORS.borderLight,
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
    color: ESTIMATE_COLORS.textDark,
  },
  productMeta: {
    fontSize: 12,
    marginBottom: 4,
    color: ESTIMATE_COLORS.textSlate500,
  },
  productReason: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  productReasonText: {
    fontSize: 11,
    flex: 1,
    color: ESTIMATE_COLORS.textSlate500,
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
  productCardWrapper: {
    marginBottom: Spacing.xs,
  },
  moreInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(0, 120, 212, 0.08)',
    borderRadius: BorderRadius.sm,
    marginTop: 4,
    gap: 6,
  },
  moreInfoText: {
    fontSize: 12,
    color: BrandColors.azureBlue,
    fontWeight: '500',
  },
  webInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(23, 190, 187, 0.08)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: BrandColors.tropicalTeal,
  },
  webInfoText: {
    flex: 1,
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate500,
    lineHeight: 18,
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
  doneEstimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22D69A',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  doneEstimateText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  inputContainer: {
    padding: Spacing.md,
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderTopWidth: 1,
    borderTopColor: ESTIMATE_COLORS.borderLight,
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
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.danger + '15',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: BrandColors.danger,
  },
  recordingText: {
    color: BrandColors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  transcribingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.azureBlue + '15',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  transcribingText: {
    color: BrandColors.azureBlue,
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: BrandColors.tropicalTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: 15,
    maxHeight: 100,
    backgroundColor: ESTIMATE_COLORS.bgSlate100,
    color: ESTIMATE_COLORS.textDark,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandColors.azureBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
