import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { useAudioRecorder, AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { ESTIMATE_COLORS, formatCurrencyDollars } from '@/constants/estimateDesign';
import { getLocalApiUrl, joinUrl } from '@/lib/query-client';


interface LineItem {
  id: string;
  lineNumber: number;
  product: {
    sku: string;
    name: string;
    category: string;
    manufacturer: string;
    price: number;
    unit: string;
  };
  description: string;
  quantity: number;
  rate: number;
  taxable: boolean;
}

type RouteParams = {
  QuoteDescription: {
    lineItems: LineItem[];
    currentDescription: string;
    propertyName: string;
  };
};

export default function QuoteDescriptionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RouteParams, 'QuoteDescription'>>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const { lineItems = [], currentDescription = '', propertyName = '' } = route.params || {};

  const [description, setDescription] = useState(currentDescription);
  const [voiceInput, setVoiceInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation;
    if (isRecording) {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      pulseAnimation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (pulseAnimation) pulseAnimation.stop();
    };
  }, [isRecording]);

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const buildItemsSummary = () => {
    return lineItems.map(item => 
      `${item.quantity}x ${item.product.name} (${item.product.manufacturer}) - $${(item.quantity * item.rate).toFixed(2)}`
    ).join('\n');
  };

  const startRecording = async () => {
    if (Platform.OS === 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    try {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
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

      setIsTranscribing(true);
      const base64Audio = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });

      const apiUrl = getLocalApiUrl();
      const transcribeResponse = await fetch(joinUrl(apiUrl, '/api/transcribe'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio }),
      });

      if (!transcribeResponse.ok) throw new Error('Transcription failed');

      const transcribeData = await transcribeResponse.json();
      const transcribedText = transcribeData.text;

      setIsTranscribing(false);

      if (transcribedText) {
        setVoiceInput(prev => prev ? `${prev} ${transcribedText}` : transcribedText);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to process recording:', error);
      setIsTranscribing(false);
    }
  };

  const generateDescription = async () => {
    if (lineItems.length === 0 && !voiceInput.trim()) {
      return;
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const itemsSummary = buildItemsSummary();
      
      // Extract unique product categories for pool code lookup
      const productCategories = [...new Set(lineItems.map(item => item.product.category))];
      
      // HOA-friendly with professional mix - no toggle needed
      const styleInstructions = `Write a quote description that is BOTH HOA-friendly AND professional.
         START THE DESCRIPTION WITH: "Dear HOA Manager,"
         
         Use simple, everyday language that a property manager or HOA board member would easily understand.
         AVOID excessive technical jargon, model numbers, and industry terms.
         Instead of technical terms, explain WHAT the equipment does and WHY it needs to be replaced.
         Example: Instead of "Replace Pentair IntelliFlo 3HP VSF pump", say "Replace the main water circulation pump that moves pool water through the filtration system."
         
         Focus on benefits: safety, efficiency, proper operation, and compliance.
         Keep sentences short and clear but maintain a professional business tone.
         Reference California pool codes where applicable to help HOA managers understand legal requirements.
         
         The tone should be respectful, informative, and reassuring - like a trusted contractor explaining necessary work to a property manager.`;
      
      const prompt = voiceInput.trim() 
        ? `Generate a quote description based on these instructions: "${voiceInput}"

${styleInstructions}

Line items:
${itemsSummary}

Property: ${propertyName}

Write 3-5 paragraphs explaining the work in a way that clearly communicates the scope, value, and any legal requirements. Start with "Dear HOA Manager,"`
        : `Generate a quote description for this commercial pool repair estimate.

${styleInstructions}

Line items:
${itemsSummary}

Property: ${propertyName}

Write 3-5 paragraphs explaining the work in a way that clearly communicates the scope, value, and any legal requirements. Start with "Dear HOA Manager,"`;

      const apiUrl = getLocalApiUrl();
      const response = await fetch(joinUrl(apiUrl, '/api/ai-product-search'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: prompt,
          generateDescription: true,
          languageStyle: 'hoa-friendly',
          productCategories: productCategories
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to generate description:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const routes = navigation.getState().routes;
    const aceRoute = routes.find((r: any) => r.name === 'AceEstimateBuilder');
    if (aceRoute) {
      navigation.dispatch({
        ...CommonActions.setParams({ updatedDescription: description }),
        source: aceRoute.key,
      });
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter}>
          <ThemedText style={styles.headerTitle}>Quote Description</ThemedText>
          <ThemedText style={styles.headerSubtitle}>Describe the work to be performed</ThemedText>
        </View>
        <Pressable onPress={handleSave} style={styles.saveButton}>
          <ThemedText style={styles.saveButtonText}>Save</ThemedText>
        </Pressable>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="list" size={18} color={ESTIMATE_COLORS.textSlate500} />
            <ThemedText style={styles.sectionTitle}>Line Items Summary</ThemedText>
          </View>
          <View style={styles.itemsList}>
            {lineItems.length > 0 ? (
              lineItems.map((item, idx) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={styles.itemNumber}>
                    <ThemedText style={styles.itemNumberText}>{idx + 1}</ThemedText>
                  </View>
                  <View style={styles.itemDetails}>
                    <ThemedText style={styles.itemName} numberOfLines={1}>{item.product.name}</ThemedText>
                    <ThemedText style={styles.itemMeta}>
                      Qty: {item.quantity} × ${item.rate.toFixed(2)}
                    </ThemedText>
                  </View>
                  <ThemedText style={styles.itemTotal}>
                    {formatCurrencyDollars(item.quantity * item.rate)}
                  </ThemedText>
                </View>
              ))
            ) : (
              <ThemedText style={styles.noItems}>No items added yet</ThemedText>
            )}
          </View>
          {lineItems.length > 0 ? (
            <View style={styles.totalRow}>
              <ThemedText style={styles.totalLabel}>Total</ThemedText>
              <ThemedText style={styles.totalValue}>{formatCurrencyDollars(calculateTotal())}</ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="mic" size={18} color={ESTIMATE_COLORS.textSlate500} />
            <ThemedText style={styles.sectionTitle}>Voice Instructions</ThemedText>
          </View>
          <ThemedText style={styles.sectionHint}>
            Tap the mic and tell Ace what you want in the quote description
          </ThemedText>
          
          <View style={styles.voiceArea}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Pressable
                onPressIn={startRecording}
                onPressOut={stopRecording}
                style={[
                  styles.micButton,
                  isRecording && styles.micButtonActive,
                ]}
                disabled={Platform.OS === 'web'}
              >
                {isTranscribing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather 
                    name="mic" 
                    size={28} 
                    color={isRecording ? '#fff' : BrandColors.azureBlue} 
                  />
                )}
              </Pressable>
            </Animated.View>
            <ThemedText style={styles.micHint}>
              {Platform.OS === 'web' 
                ? 'Voice input available on mobile' 
                : isRecording 
                  ? 'Listening... Release to stop' 
                  : isTranscribing
                    ? 'Transcribing...'
                    : 'Hold to speak'}
            </ThemedText>
          </View>

          {voiceInput ? (
            <View style={styles.voiceInputDisplay}>
              <ThemedText style={styles.voiceInputLabel}>Your instructions:</ThemedText>
              <TextInput
                style={styles.voiceInputText}
                value={voiceInput}
                onChangeText={setVoiceInput}
                multiline
                placeholder="Edit your voice input here..."
                placeholderTextColor={ESTIMATE_COLORS.textSlate400}
              />
              <Pressable 
                onPress={() => setVoiceInput('')}
                style={styles.clearVoiceButton}
              >
                <Feather name="x" size={16} color={ESTIMATE_COLORS.textSlate400} />
              </Pressable>
            </View>
          ) : null}

          <Pressable
            onPress={generateDescription}
            style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
            disabled={isGenerating || (lineItems.length === 0 && !voiceInput.trim())}
          >
            {isGenerating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="zap" size={18} color="#fff" />
                <ThemedText style={styles.generateButtonText}>
                  Generate with Ace
                </ThemedText>
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.descriptionSection}>
          <View style={styles.descriptionHeader}>
            <Feather name="file-text" size={22} color={BrandColors.azureBlue} />
            <ThemedText style={styles.descriptionTitle}>Quote Description</ThemedText>
          </View>
          <ThemedText style={styles.descriptionHint}>
            This is what the HOA Manager will read. Uses HOA-friendly language with professional tone.
          </ThemedText>
          
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Dear HOA Manager,

We will replace the main water pump that circulates water through the pool system. The current pump is no longer operating efficiently, which affects water quality and increases energy costs.

This repair is required per California Health & Safety Code..."
            placeholderTextColor={ESTIMATE_COLORS.textSlate400}
            textAlignVertical="top"
          />
          <ThemedText style={styles.charCount}>
            {description.length} characters
          </ThemedText>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.cancelButton}>
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </Pressable>
        <Pressable onPress={handleSave} style={styles.saveBottomButton}>
          <Feather name="check" size={18} color="#fff" />
          <ThemedText style={styles.saveBottomButtonText}>Save Description</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ESTIMATE_COLORS.bgSlate50,
  },
  header: {
    backgroundColor: ESTIMATE_COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textDark,
  },
  sectionHint: {
    fontSize: 13,
    color: ESTIMATE_COLORS.textSlate500,
    marginBottom: Spacing.md,
  },
  itemsList: {
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ESTIMATE_COLORS.bgSlate50,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  itemNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BrandColors.azureBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: ESTIMATE_COLORS.textDark,
  },
  itemMeta: {
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate500,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: ESTIMATE_COLORS.secondary,
  },
  noItems: {
    fontSize: 14,
    color: ESTIMATE_COLORS.textSlate400,
    textAlign: 'center',
    padding: Spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: ESTIMATE_COLORS.borderLight,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textDark,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: ESTIMATE_COLORS.secondary,
  },
  voiceArea: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F4FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: BrandColors.azureBlue,
  },
  micButtonActive: {
    backgroundColor: BrandColors.azureBlue,
    borderColor: BrandColors.azureBlue,
  },
  micHint: {
    fontSize: 13,
    color: ESTIMATE_COLORS.textSlate500,
    marginTop: Spacing.sm,
  },
  voiceInputDisplay: {
    backgroundColor: ESTIMATE_COLORS.bgSlate50,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  voiceInputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textSlate500,
    marginBottom: Spacing.xs,
  },
  voiceInputText: {
    fontSize: 14,
    color: ESTIMATE_COLORS.textDark,
    lineHeight: 20,
    minHeight: 60,
    paddingRight: Spacing.lg,
  },
  clearVoiceButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.azureBlue,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  descriptionSection: {
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: BrandColors.azureBlue,
  },
  descriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ESTIMATE_COLORS.textDark,
  },
  descriptionHint: {
    fontSize: 13,
    color: ESTIMATE_COLORS.textSlate500,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  languageToggleContainer: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  languageToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textDark,
    marginBottom: Spacing.sm,
  },
  languageToggle: {
    marginBottom: Spacing.sm,
  },
  languageHint: {
    fontSize: 12,
    color: ESTIMATE_COLORS.textSlate500,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  descriptionInput: {
    backgroundColor: ESTIMATE_COLORS.bgSlate50,
    borderWidth: 2,
    borderColor: BrandColors.azureBlue,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: 16,
    color: ESTIMATE_COLORS.textDark,
    minHeight: 380,
    lineHeight: 26,
  },
  charCount: {
    fontSize: 11,
    color: ESTIMATE_COLORS.textSlate400,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: ESTIMATE_COLORS.bgWhite,
    borderTopWidth: 1,
    borderTopColor: ESTIMATE_COLORS.borderLight,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: ESTIMATE_COLORS.borderLight,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: ESTIMATE_COLORS.textSlate500,
  },
  saveBottomButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22D69A',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  saveBottomButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
