import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { LightBubbleBackground } from '@/components/LightBubbleBackground';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockProperties } from '@/lib/mockData';

const EMERGENCY_TYPES = [
  { id: 'leak', label: 'Major Water Leak', icon: 'droplet' as const, color: '#0078D4' },
  { id: 'electrical', label: 'Electrical Hazard', icon: 'zap' as const, color: '#FF8000' },
  { id: 'chemical', label: 'Chemical Spill', icon: 'alert-triangle' as const, color: '#9C27B0' },
  { id: 'injury', label: 'Injury on Site', icon: 'heart' as const, color: '#FF3B30' },
  { id: 'equipment', label: 'Equipment Failure', icon: 'tool' as const, color: '#17BEBB' },
  { id: 'other', label: 'Other Emergency', icon: 'alert-circle' as const, color: '#8E8E93' },
];

interface EmergencyReport {
  id: string;
  propertyId: string;
  propertyName: string;
  emergencyType: string;
  description: string;
  timestamp: string;
  status: 'reported' | 'acknowledged' | 'resolved';
}

const mockEmergencyHistory: EmergencyReport[] = [
  {
    id: '1',
    propertyId: '1',
    propertyName: 'Sunset Valley Resort',
    emergencyType: 'leak',
    description: 'Major pipe burst in pump room, water flooding area',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'resolved',
  },
  {
    id: '2',
    propertyId: '2',
    propertyName: 'Desert Springs HOA',
    emergencyType: 'equipment',
    description: 'Main circulation pump seized up completely',
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'resolved',
  },
];

interface EmergencyCardProps {
  report: EmergencyReport;
  index: number;
}

function EmergencyCard({ report, index }: EmergencyCardProps) {
  const { theme } = useTheme();
  const typeConfig = EMERGENCY_TYPES.find(t => t.id === report.emergencyType) || EMERGENCY_TYPES[5];
  
  const statusConfig = {
    reported: { label: 'Reported', color: BrandColors.danger, bgColor: BrandColors.danger + '20' },
    acknowledged: { label: 'Acknowledged', color: BrandColors.vividTangerine, bgColor: BrandColors.vividTangerine + '20' },
    resolved: { label: 'Resolved', color: BrandColors.emerald, bgColor: BrandColors.emerald + '20' },
  };
  
  const status = statusConfig[report.status];
  const date = new Date(report.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeIcon, { backgroundColor: typeConfig.color + '20' }]}>
            <Feather name={typeConfig.icon} size={20} color={typeConfig.color} />
          </View>
          <View style={styles.cardInfo}>
            <ThemedText style={styles.cardProperty}>{report.propertyName}</ThemedText>
            <ThemedText style={[styles.cardType, { color: theme.textSecondary }]}>
              {typeConfig.label}
            </ThemedText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
            <ThemedText style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </ThemedText>
          </View>
        </View>
        <ThemedText style={[styles.cardDescription, { color: theme.textSecondary }]} numberOfLines={2}>
          {report.description}
        </ThemedText>
        <View style={styles.cardFooter}>
          <Feather name="clock" size={12} color={theme.textSecondary} />
          <ThemedText style={[styles.cardDate, { color: theme.textSecondary }]}>
            {formattedDate}
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  
  const [showModal, setShowModal] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [showPropertyPicker, setShowPropertyPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emergencyHistory, setEmergencyHistory] = useState<EmergencyReport[]>(mockEmergencyHistory);

  const selectedPropertyData = mockProperties.find(p => p.id === selectedProperty);

  const handleSubmit = () => {
    if (!selectedProperty || !selectedType) return;

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const property = mockProperties.find(p => p.id === selectedProperty);
      const newReport: EmergencyReport = {
        id: String(Date.now()),
        propertyId: selectedProperty,
        propertyName: property?.name || 'Unknown Property',
        emergencyType: selectedType,
        description,
        timestamp: new Date().toISOString(),
        status: 'reported',
      };

      setEmergencyHistory([newReport, ...emergencyHistory]);
      setIsSubmitting(false);
      setSelectedProperty(null);
      setSelectedType(null);
      setDescription('');
      setShowModal(false);

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1500);
  };

  const handleOpenModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    setShowModal(true);
  };

  const activeCount = emergencyHistory.filter(e => e.status !== 'resolved').length;
  const resolvedCount = emergencyHistory.filter(e => e.status === 'resolved').length;

  return (
    <LightBubbleBackground bubbleCount={12}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <View style={styles.headerContent}>
          <View>
            <ThemedText style={styles.headerTitle}>Emergency</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Report emergencies immediately</ThemedText>
          </View>
          <View style={styles.alertIcon}>
            <Feather name="alert-triangle" size={24} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <View style={[styles.statsRow, { backgroundColor: theme.surface }]}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: BrandColors.danger, fontVariant: ['tabular-nums'] }]}>
            {activeCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Active</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: BrandColors.emerald, fontVariant: ['tabular-nums'] }]}>
            {resolvedCount}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Resolved</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: BrandColors.azureBlue, fontVariant: ['tabular-nums'] }]}>
            {emergencyHistory.length}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total</ThemedText>
        </View>
      </View>

      <View style={styles.reportButtonContainer}>
        <Pressable
          style={[styles.reportButton, { backgroundColor: BrandColors.danger }]}
          onPress={handleOpenModal}
        >
          <Feather name="alert-circle" size={24} color="#FFFFFF" />
          <ThemedText style={styles.reportButtonText}>Report Emergency</ThemedText>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <ThemedText style={styles.sectionTitle}>Recent Reports</ThemedText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {emergencyHistory.length > 0 ? (
          emergencyHistory.map((report, index) => (
            <EmergencyCard key={report.id} report={report} index={index} />
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <Feather name="check-circle" size={48} color={BrandColors.emerald} />
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No Emergencies</ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No emergency reports have been filed
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <Animated.View 
            entering={ZoomIn.springify()}
            style={[styles.modalContainer, { backgroundColor: theme.surface, maxHeight: windowHeight * 0.9 }]}
          >
            <View style={[styles.emergencyHeader, { backgroundColor: BrandColors.danger }]}>
              <View style={styles.emergencyIconContainer}>
                <Feather name="alert-triangle" size={32} color="#FFFFFF" />
              </View>
              <ThemedText style={styles.emergencyTitle}>Emergency Report</ThemedText>
              <ThemedText style={styles.emergencySubtitle}>Admin will be notified immediately</ThemedText>
            </View>

            <ScrollView 
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedText style={styles.label}>Property Location</ThemedText>
              <Pressable
                style={[styles.propertySelector, { borderColor: theme.border }]}
                onPress={() => setShowPropertyPicker(!showPropertyPicker)}
              >
                <Feather name="map-pin" size={18} color={theme.textSecondary} />
                <ThemedText style={[styles.propertySelectorText, { color: selectedPropertyData ? theme.text : theme.textSecondary }]}>
                  {selectedPropertyData?.name || 'Select a property'}
                </ThemedText>
                <Feather name={showPropertyPicker ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
              </Pressable>

              {showPropertyPicker ? (
                <View style={[styles.propertyList, { borderColor: theme.border }]}>
                  {mockProperties.map((property) => (
                    <Pressable
                      key={property.id}
                      style={[
                        styles.propertyOption,
                        selectedProperty === property.id && { backgroundColor: BrandColors.azureBlue + '10' },
                      ]}
                      onPress={() => {
                        setSelectedProperty(property.id);
                        setShowPropertyPicker(false);
                      }}
                    >
                      <ThemedText style={[
                        styles.propertyOptionText,
                        selectedProperty === property.id && { color: BrandColors.azureBlue, fontWeight: '600' },
                      ]}>
                        {property.name}
                      </ThemedText>
                      {selectedProperty === property.id ? (
                        <Feather name="check" size={18} color={BrandColors.azureBlue} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}

              <ThemedText style={styles.label}>Emergency Type</ThemedText>
              <View style={styles.typeGrid}>
                {EMERGENCY_TYPES.map((type) => (
                  <Pressable
                    key={type.id}
                    style={[
                      styles.typeButton,
                      { borderColor: selectedType === type.id ? type.color : theme.border },
                      selectedType === type.id && { backgroundColor: type.color + '10' },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.selectionAsync();
                      }
                      setSelectedType(type.id);
                    }}
                  >
                    <View style={[styles.typeIconSmall, { backgroundColor: type.color + '20' }]}>
                      <Feather name={type.icon} size={20} color={type.color} />
                    </View>
                    <ThemedText style={[
                      styles.typeLabel,
                      selectedType === type.id && { color: type.color, fontWeight: '600' },
                    ]}>
                      {type.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <ThemedText style={styles.label}>Description</ThemedText>
              <TextInput
                style={[styles.textArea, { borderColor: theme.border, color: theme.text }]}
                placeholder="Describe the emergency situation..."
                placeholderTextColor={theme.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
              <Pressable
                style={[styles.cancelButton, { borderColor: theme.border }]}
                onPress={() => {
                  setShowModal(false);
                  setSelectedProperty(null);
                  setSelectedType(null);
                  setDescription('');
                }}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.submitButton,
                  { backgroundColor: BrandColors.danger },
                  (!selectedProperty || !selectedType) && { opacity: 0.5 },
                ]}
                onPress={handleSubmit}
                disabled={!selectedProperty || !selectedType || isSubmitting}
              >
                {isSubmitting ? (
                  <ThemedText style={styles.submitButtonText}>Sending...</ThemedText>
                ) : (
                  <>
                    <Feather name="alert-circle" size={18} color="#FFFFFF" />
                    <ThemedText style={styles.submitButtonText}>Report Emergency</ThemedText>
                  </>
                )}
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </LightBubbleBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BrandColors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: '100%',
  },
  reportButtonContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  reportButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  cardProperty: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardType: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 4,
  },
  cardDate: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['3xl'],
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  emergencyHeader: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emergencyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emergencyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emergencySubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalScrollContent: {
    padding: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  propertySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  propertySelectorText: {
    flex: 1,
    fontSize: 15,
  },
  propertyList: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    maxHeight: 150,
  },
  propertyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  propertyOptionText: {
    fontSize: 15,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  typeIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 12,
    flex: 1,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
