import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Platform,
  Switch,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { getLocalApiUrl, joinUrl } from '@/lib/query-client';
import { mockProperties } from '@/lib/mockData';

interface PartItem {
  id: string;
  name: string;
  quantity: number;
}

interface OrderPartsModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

type UrgencyLevel = 'Low' | 'Normal' | 'High';

export function OrderPartsModal({ visible, onClose, onSubmit }: OrderPartsModalProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { token } = useAuth();
  const { height: windowHeight } = useWindowDimensions();

  const [property, setProperty] = useState('');
  const [propertySearch, setPropertySearch] = useState('');
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [parts, setParts] = useState<PartItem[]>([{ id: '1', name: '', quantity: 1 }]);
  const [urgency, setUrgency] = useState<UrgencyLevel>('Normal');
  const [notes, setNotes] = useState('');
  const [deliverToProperty, setDeliverToProperty] = useState(false);
  const [showUrgencyPicker, setShowUrgencyPicker] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [activeVoicePartId, setActiveVoicePartId] = useState<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const urgencyOptions: UrgencyLevel[] = ['Low', 'Normal', 'High'];

  const filteredProperties = useMemo(() => {
    if (!propertySearch.trim()) return mockProperties;
    return mockProperties.filter(p => 
      p.name.toLowerCase().includes(propertySearch.toLowerCase())
    );
  }, [propertySearch]);

  const selectProperty = (name: string) => {
    setProperty(name);
    setPropertySearch('');
    setShowPropertyPicker(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const getUrgencyColor = (level: UrgencyLevel) => {
    switch (level) {
      case 'High': return BrandColors.danger;
      case 'Low': return BrandColors.emerald;
      default: return BrandColors.azureBlue;
    }
  };

  const addPart = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setParts([...parts, { id: Date.now().toString(), name: '', quantity: 1 }]);
  };

  const removePart = (id: string) => {
    if (parts.length > 1) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setParts(parts.filter(p => p.id !== id));
    }
  };

  const updatePartName = (id: string, name: string) => {
    setParts(parts.map(p => p.id === id ? { ...p, name } : p));
  };

  const updatePartQuantity = (id: string, delta: number) => {
    setParts(parts.map(p => {
      if (p.id === id) {
        const newQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: newQty };
      }
      return p;
    }));
  };

  const startRecording = async (partId: string) => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      recordingRef.current = recording;
      setIsRecording(true);
      setActiveVoicePartId(partId);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current || !activeVoicePartId) return;

    setIsRecording(false);
    setIsTranscribing(true);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        const formData = new FormData();
        formData.append('audio', {
          uri,
          type: 'audio/m4a',
          name: 'recording.m4a',
        } as any);

        const apiUrl = getLocalApiUrl();
        const response = await fetch(joinUrl(apiUrl, '/api/transcribe'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.text) {
            updatePartName(activeVoicePartId, data.text);
          }
        }
      }
    } catch (error) {
      console.error('Failed to transcribe:', error);
    } finally {
      setIsTranscribing(false);
      setActiveVoicePartId(null);
    }
  };

  const handleSubmit = () => {
    const validParts = parts.filter(p => p.name.trim());
    if (validParts.length === 0) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSubmit({ 
      property, 
      parts: validParts, 
      urgency, 
      notes,
      deliverToProperty,
    });
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setProperty('');
    setPropertySearch('');
    setShowPropertyPicker(false);
    setParts([{ id: '1', name: '', quantity: 1 }]);
    setUrgency('Normal');
    setNotes('');
    setDeliverToProperty(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme.surface, maxHeight: windowHeight * 0.9 }]}>
          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.cancelButton}>
              <Feather name="chevron-left" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={styles.cancelText}>Cancel</ThemedText>
            </Pressable>
            <ThemedText style={styles.title}>Order Parts</ThemedText>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Property</ThemedText>
              <Pressable 
                style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}
                onPress={() => setShowPropertyPicker(!showPropertyPicker)}
              >
                <ThemedText style={property ? { color: theme.text } : { color: theme.textSecondary }}>
                  {property || 'Select a property...'}
                </ThemedText>
                <Feather name="chevron-down" size={18} color={theme.textSecondary} />
              </Pressable>
              
              {showPropertyPicker ? (
                <View style={[styles.propertyPicker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <View style={[styles.searchContainer, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                    <Feather name="search" size={16} color={theme.textSecondary} />
                    <TextInput
                      style={[styles.searchInput, { color: theme.text }]}
                      placeholder="Search properties..."
                      placeholderTextColor={theme.textSecondary}
                      value={propertySearch}
                      onChangeText={setPropertySearch}
                      autoFocus
                    />
                    {propertySearch ? (
                      <Pressable onPress={() => setPropertySearch('')}>
                        <Feather name="x" size={16} color={theme.textSecondary} />
                      </Pressable>
                    ) : null}
                  </View>
                  <FlatList
                    data={filteredProperties}
                    keyExtractor={(item) => item.id}
                    style={styles.propertyList}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <Pressable
                        style={[
                          styles.propertyOption,
                          property === item.name && { backgroundColor: theme.backgroundRoot }
                        ]}
                        onPress={() => selectProperty(item.name)}
                      >
                        <Feather 
                          name="home" 
                          size={16} 
                          color={property === item.name ? BrandColors.azureBlue : theme.textSecondary} 
                        />
                        <ThemedText 
                          style={[
                            styles.propertyOptionText,
                            property === item.name && { color: BrandColors.azureBlue, fontWeight: '600' }
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </ThemedText>
                      </Pressable>
                    )}
                    ListEmptyComponent={
                      <View style={styles.emptyList}>
                        <ThemedText style={{ color: theme.textSecondary }}>No properties found</ThemedText>
                      </View>
                    }
                  />
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              <View style={styles.sectionHeader}>
                <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Parts ({parts.length})</ThemedText>
                <Pressable onPress={addPart} style={[styles.addButton, { backgroundColor: BrandColors.azureBlue }]}>
                  <Feather name="plus" size={16} color="#FFFFFF" />
                  <ThemedText style={styles.addButtonText}>Add Part</ThemedText>
                </Pressable>
              </View>

              {parts.map((part, index) => (
                <View key={part.id} style={[styles.partCard, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                  <View style={styles.partHeader}>
                    <ThemedText style={[styles.partNumber, { color: theme.textSecondary }]}>Part {index + 1}</ThemedText>
                    {parts.length > 1 ? (
                      <Pressable onPress={() => removePart(part.id)} style={styles.removeButton}>
                        <Feather name="x" size={18} color={BrandColors.danger} />
                      </Pressable>
                    ) : null}
                  </View>
                  
                  <View style={styles.partInputRow}>
                    <TextInput
                      style={[styles.partNameInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                      placeholder="Enter part name or description..."
                      placeholderTextColor={theme.textSecondary}
                      value={part.name}
                      onChangeText={(text) => updatePartName(part.id, text)}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                    <Pressable
                      onPressIn={() => startRecording(part.id)}
                      onPressOut={stopRecording}
                      style={[
                        styles.voiceButton,
                        { backgroundColor: isRecording && activeVoicePartId === part.id ? BrandColors.danger : BrandColors.azureBlue }
                      ]}
                    >
                      {isTranscribing && activeVoicePartId === part.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Feather 
                          name={isRecording && activeVoicePartId === part.id ? "mic-off" : "mic"} 
                          size={20} 
                          color="#FFFFFF" 
                        />
                      )}
                    </Pressable>
                  </View>

                  <View style={styles.quantityRow}>
                    <ThemedText style={[styles.quantityLabel, { color: theme.textSecondary }]}>Qty:</ThemedText>
                    <View style={[styles.quantityField, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      <Pressable
                        onPress={() => updatePartQuantity(part.id, -1)}
                        style={styles.quantityButton}
                      >
                        <Feather name="minus" size={16} color={theme.textSecondary} />
                      </Pressable>
                      <ThemedText style={[styles.quantityValue, { color: theme.text }]}>{part.quantity}</ThemedText>
                      <Pressable
                        onPress={() => updatePartQuantity(part.id, 1)}
                        style={styles.quantityButton}
                      >
                        <Feather name="plus" size={16} color={theme.textSecondary} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Urgency</ThemedText>
              <Pressable 
                style={[styles.selectField, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}
                onPress={() => setShowUrgencyPicker(!showUrgencyPicker)}
              >
                <View style={styles.urgencyDisplay}>
                  <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(urgency) }]} />
                  <ThemedText style={{ color: theme.text }}>{urgency}</ThemedText>
                </View>
                <Feather name="chevron-down" size={18} color={theme.textSecondary} />
              </Pressable>
              
              {showUrgencyPicker ? (
                <View style={[styles.urgencyPicker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  {urgencyOptions.map((option) => (
                    <Pressable
                      key={option}
                      style={[
                        styles.urgencyOption,
                        urgency === option && { backgroundColor: theme.backgroundRoot }
                      ]}
                      onPress={() => {
                        setUrgency(option);
                        setShowUrgencyPicker(false);
                        if (Platform.OS !== 'web') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <View style={[styles.urgencyDot, { backgroundColor: getUrgencyColor(option) }]} />
                      <ThemedText style={{ color: theme.text }}>{option}</ThemedText>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            <View style={styles.field}>
              <View style={[styles.deliveryRow, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
                <View style={styles.deliveryInfo}>
                  <Feather name="truck" size={20} color={BrandColors.azureBlue} />
                  <ThemedText style={[styles.deliveryText, { color: theme.text }]}>Deliver to Property</ThemedText>
                </View>
                <Switch
                  value={deliverToProperty}
                  onValueChange={setDeliverToProperty}
                  trackColor={{ false: theme.border, true: BrandColors.azureBlue }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            <View style={styles.field}>
              <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Notes</ThemedText>
              <TextInput
                style={[styles.textArea, { backgroundColor: theme.backgroundRoot, borderColor: theme.border, color: theme.text }]}
                placeholder="Additional notes or instructions..."
                placeholderTextColor={theme.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md, backgroundColor: theme.surface }]}>
            <Pressable
              style={[
                styles.submitButton, 
                { backgroundColor: BrandColors.vividTangerine },
                parts.every(p => !p.name.trim()) && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={parts.every(p => !p.name.trim())}
            >
              <ThemedText style={styles.submitButtonText}>Submit Order</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.cancelActionButton, { borderColor: theme.border }]}
              onPress={handleClose}
            >
              <View style={[styles.handle, { backgroundColor: theme.textSecondary }]} />
              <ThemedText style={styles.cancelActionText}>Cancel</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    minHeight: '70%',
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 15,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  partCard: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  partHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  partNumber: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  removeButton: {
    padding: Spacing.xs,
  },
  partInputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  partNameInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 80,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  quantityField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  quantityButton: {
    padding: Spacing.sm,
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    minWidth: 40,
    textAlign: 'center',
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  urgencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  urgencyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  urgencyPicker: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  urgencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  propertyPicker: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: 250,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.xs,
  },
  propertyList: {
    maxHeight: 200,
  },
  propertyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  propertyOptionText: {
    fontSize: 15,
    flex: 1,
  },
  emptyList: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  deliveryText: {
    fontSize: 15,
    fontWeight: '500',
  },
  textArea: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 100,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  submitButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelActionButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.xs,
  },
  cancelActionText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
