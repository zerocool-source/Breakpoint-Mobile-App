import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Image } from 'expo-image';
import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { BubbleBackground } from '@/components/BubbleBackground';
import type { RouteStop, BodyOfWater } from '@/lib/serviceTechMockData';
import repairsNeededIcon from '../../../assets/images/repairs-needed-icon.png';
import chemicalOrderIcon from '../../../assets/images/chemical-order-icon.png';
import windyCleanupIcon from '../../../assets/images/windy-cleanup-icon.png';
import serviceRepairsIcon from '../../../assets/images/service-repairs-icon.png';
import chemicalsDropoffIcon from '../../../assets/images/chemicals-dropoff-icon.png';
import completePropertyButton from '../../../assets/images/complete-property-button.png';
import bodiesOfWaterButton from '../../../assets/images/bodies-of-water-button.png';
import {
  RepairsNeededModal,
  ChemicalOrderModal,
  WindyDayCleanupModal,
  ServiceRepairModal,
} from './Modals';

type ServiceTechStackParamList = {
  PropertyDetail: { stop: RouteStop };
  BodyOfWaterDetail: { body: BodyOfWater; propertyName: string };
};

interface QuickActionProps {
  imageSource: any;
  label: string;
  color: string;
  onPress: () => void;
}

function QuickAction({ imageSource, color, onPress }: QuickActionProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable style={[styles.quickAction, { backgroundColor: theme.surface }]} onPress={onPress}>
      <Image source={imageSource} style={styles.quickActionImage} contentFit="contain" />
    </Pressable>
  );
}

interface ChecklistItemProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
}

function ChecklistItem({ label, checked, onToggle }: ChecklistItemProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable style={styles.checklistItem} onPress={onToggle}>
      <View style={[
        styles.checkbox,
        { borderColor: checked ? BrandColors.azureBlue : theme.border },
        checked && { backgroundColor: BrandColors.azureBlue },
      ]}>
        {checked && <Feather name="check" size={14} color="#FFFFFF" />}
      </View>
      <ThemedText style={[
        styles.checklistItemText,
        checked && styles.checklistItemTextChecked,
      ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

interface BodyOfWaterCardProps {
  body: BodyOfWater;
  onPress: () => void;
}

function BodyOfWaterCard({ body, onPress }: BodyOfWaterCardProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable 
      style={[styles.bodyCard, { backgroundColor: theme.surface }]} 
      onPress={onPress}
    >
      <View style={styles.bodyCardLeft}>
        <View style={styles.bodyIconContainer}>
          <ThemedText style={styles.bodyIcon}>
            {body.type === 'spa' ? '♨️' : '🏊'}
          </ThemedText>
        </View>
        <View style={styles.bodyInfo}>
          <ThemedText style={styles.bodyName}>{body.name}</ThemedText>
          <ThemedText style={[styles.bodyLocation, { color: theme.textSecondary }]}>
            {body.location}
          </ThemedText>
          <View style={[styles.bodyTypeBadge, { backgroundColor: BrandColors.azureBlue + '15' }]}>
            <ThemedText style={[styles.bodyTypeBadgeText, { color: BrandColors.azureBlue }]}>
              {body.type.charAt(0).toUpperCase() + body.type.slice(1)}
            </ThemedText>
          </View>
        </View>
      </View>
      <Feather name="arrow-right" size={20} color={BrandColors.vividTangerine} />
    </Pressable>
  );
}

const poolAreaChecklistItems = [
  'Clean Pump Basket',
  'Tile',
  'Vacuum',
  'Netted',
  'Check Handrails',
  'Deck Brushed Pool',
];

const pumpRoomChecklistItems = [
  'Clean Basket',
  'Backwashed',
  'Balance Chemicals',
  'Recalibrate Controller',
  'Clean Pump Room',
];

export default function PropertyDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<ServiceTechStackParamList>>();
  const route = useRoute<RouteProp<ServiceTechStackParamList, 'PropertyDetail'>>();
  const { theme } = useTheme();
  
  const { stop } = route.params;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [bodiesCompleted, setBodiesCompleted] = useState(0);
  const [propertyInfoExpanded, setPropertyInfoExpanded] = useState(false);
  const [poolAreaExpanded, setPoolAreaExpanded] = useState(false);
  const [poolAreaChecklist, setPoolAreaChecklist] = useState<Record<string, boolean>>({});
  const [pumpRoomExpanded, setPumpRoomExpanded] = useState(false);
  const [pumpRoomChecklist, setPumpRoomChecklist] = useState<Record<string, boolean>>({});
  const [newPumpRoomTask, setNewPumpRoomTask] = useState('');
  const [customPumpRoomTasks, setCustomPumpRoomTasks] = useState<string[]>([]);
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);
  
  const [repairsModalVisible, setRepairsModalVisible] = useState(false);
  const [chemicalModalVisible, setChemicalModalVisible] = useState(false);
  const [windyModalVisible, setWindyModalVisible] = useState(false);
  const [serviceRepairModalVisible, setServiceRepairModalVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleQuickAction = (action: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    switch (action) {
      case 'repairs':
        setRepairsModalVisible(true);
        break;
      case 'chemical':
        setChemicalModalVisible(true);
        break;
      case 'windy':
        setWindyModalVisible(true);
        break;
      case 'service':
        setServiceRepairModalVisible(true);
        break;
      case 'dropoff':
        break;
    }
  };

  const handleTogglePumpRoomItem = (item: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPumpRoomChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleAddPumpRoomTask = () => {
    if (newPumpRoomTask.trim()) {
      setCustomPumpRoomTasks(prev => [...prev, newPumpRoomTask.trim()]);
      setNewPumpRoomTask('');
    }
  };

  const handleToggleChecklistItem = (item: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setPoolAreaChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const handleBodyOfWaterPress = (body: BodyOfWater) => {
    navigation.navigate('BodyOfWaterDetail', { body, propertyName: stop.propertyName });
  };

  const handleCompleteProperty = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    navigation.goBack();
  };

  return (
    <BubbleBackground bubbleCount={12}>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-left" size={24} color={BrandColors.textPrimary} />
        </Pressable>
        <Pressable style={styles.notesButton}>
          <Feather name="file-text" size={22} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <ThemedText style={styles.propertyLabel}>Property</ThemedText>
          <ThemedText style={styles.propertyName}>{stop.propertyName}</ThemedText>
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={14} color={BrandColors.textSecondary} />
            <ThemedText style={[styles.addressText, { color: theme.textSecondary }]}>
              {stop.address}
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.timerCard}>
            <View style={styles.timerLeft}>
              <View style={styles.timerDot} />
              <ThemedText style={styles.timerLabel}>On Site Timer</ThemedText>
            </View>
            <ThemedText style={styles.timerValue}>{formatTime(elapsedSeconds)}</ThemedText>
            <View style={styles.timerRight}>
              <Feather name="droplet" size={14} color="rgba(255,255,255,0.7)" />
              <ThemedText style={styles.timerPoolCount}>
                {bodiesCompleted}/{stop.bodiesOfWater.length} pools
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <Pressable 
            style={[styles.expandableCard, { backgroundColor: theme.surface }]}
            onPress={() => setPropertyInfoExpanded(!propertyInfoExpanded)}
          >
            <View style={styles.expandableCardLeft}>
              <Feather name="info" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={styles.expandableCardText}>Property Info</ThemedText>
            </View>
            <Feather 
              name={propertyInfoExpanded ? 'chevron-down' : 'chevron-right'} 
              size={20} 
              color={BrandColors.textSecondary} 
            />
          </Pressable>
          {propertyInfoExpanded && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surface }]}>
              {stop.gateCode && (
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Gate Code:</ThemedText>
                  <ThemedText style={styles.infoValue}>{stop.gateCode}</ThemedText>
                </View>
              )}
              {stop.contactName && (
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Contact:</ThemedText>
                  <ThemedText style={styles.infoValue}>{stop.contactName}</ThemedText>
                </View>
              )}
              {stop.contactPhone && (
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Phone:</ThemedText>
                  <ThemedText style={styles.infoValue}>{stop.contactPhone}</ThemedText>
                </View>
              )}
              {stop.notes && (
                <View style={styles.infoRow}>
                  <ThemedText style={[styles.infoLabel, { color: theme.textSecondary }]}>Notes:</ThemedText>
                  <ThemedText style={styles.infoValue}>{stop.notes}</ThemedText>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Pressable 
            style={[styles.expandableCard, { backgroundColor: theme.surface }]}
            onPress={() => setPoolAreaExpanded(!poolAreaExpanded)}
          >
            <View style={styles.expandableCardLeft}>
              <Feather name="list" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={styles.expandableCardText}>Pool Area Checklist</ThemedText>
            </View>
            <Feather 
              name={poolAreaExpanded ? 'chevron-down' : 'chevron-right'} 
              size={20} 
              color={BrandColors.textSecondary} 
            />
          </Pressable>
          {poolAreaExpanded && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surface }]}>
              {poolAreaChecklistItems.map((item) => (
                <ChecklistItem
                  key={item}
                  label={item}
                  checked={poolAreaChecklist[item] || false}
                  onToggle={() => handleToggleChecklistItem(item)}
                />
              ))}
              <Pressable style={styles.addOtherButton}>
                <Feather name="plus" size={16} color={BrandColors.azureBlue} />
                <ThemedText style={styles.addOtherText}>Add Other</ThemedText>
              </Pressable>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(350).springify()}>
          <Pressable 
            style={[styles.expandableCard, { backgroundColor: theme.surface }]}
            onPress={() => setPumpRoomExpanded(!pumpRoomExpanded)}
          >
            <View style={styles.expandableCardLeft}>
              <Feather name="settings" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={styles.expandableCardText}>Pump Room Checklist</ThemedText>
            </View>
            <Feather 
              name={pumpRoomExpanded ? 'chevron-down' : 'chevron-right'} 
              size={20} 
              color={BrandColors.textSecondary} 
            />
          </Pressable>
          {pumpRoomExpanded && (
            <View style={[styles.expandedContent, { backgroundColor: theme.surface }]}>
              {pumpRoomChecklistItems.map((item) => (
                <ChecklistItem
                  key={item}
                  label={item}
                  checked={pumpRoomChecklist[item] || false}
                  onToggle={() => handleTogglePumpRoomItem(item)}
                />
              ))}
              {customPumpRoomTasks.map((item) => (
                <ChecklistItem
                  key={item}
                  label={item}
                  checked={pumpRoomChecklist[item] || false}
                  onToggle={() => handleTogglePumpRoomItem(item)}
                />
              ))}
              <View style={styles.addTaskRow}>
                <TextInput
                  style={[styles.addTaskInput, { 
                    backgroundColor: theme.backgroundSecondary,
                    borderColor: theme.border,
                    color: theme.text,
                  }]}
                  placeholder="Enter task name..."
                  placeholderTextColor={theme.textSecondary}
                  value={newPumpRoomTask}
                  onChangeText={setNewPumpRoomTask}
                />
                <Pressable 
                  style={[styles.addTaskButton, { backgroundColor: BrandColors.azureBlue }]} 
                  onPress={handleAddPumpRoomTask}
                >
                  <ThemedText style={styles.addTaskButtonText}>Add</ThemedText>
                </Pressable>
                <Pressable style={styles.cancelTaskButton} onPress={() => setNewPumpRoomTask('')}>
                  <Feather name="x" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={[styles.bodiesSection, { backgroundColor: theme.surface }]}>
            <View style={styles.bodiesHeader}>
              <View style={styles.bodiesHeaderLeft}>
                <Feather name="droplet" size={20} color={BrandColors.azureBlue} />
                <ThemedText style={styles.bodiesSectionTitle}>Bodies of Water</ThemedText>
              </View>
              <View style={styles.bodiesCountBadge}>
                <ThemedText style={styles.bodiesCountText}>
                  {bodiesCompleted}/{stop.bodiesOfWater.length}
                </ThemedText>
              </View>
              <Feather name="chevron-down" size={18} color={BrandColors.textSecondary} />
            </View>
            <View style={styles.bodiesList}>
              {stop.bodiesOfWater.map((body) => (
                <BodyOfWaterCard
                  key={body.id}
                  body={body}
                  onPress={() => handleBodyOfWaterPress(body)}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(450).springify()}>
          <View style={styles.quickActionsSection}>
            <Pressable 
              style={styles.quickActionsHeader}
              onPress={() => setQuickActionsExpanded(!quickActionsExpanded)}
            >
              <ThemedText style={styles.sectionTitle}>QUICK ACTIONS</ThemedText>
              <Feather 
                name={quickActionsExpanded ? 'chevron-down' : 'chevron-right'} 
                size={18} 
                color={BrandColors.textSecondary} 
              />
            </Pressable>
            {quickActionsExpanded && (
              <View style={styles.quickActionsGrid}>
                <QuickAction
                  imageSource={repairsNeededIcon}
                  label="Repairs Needed"
                  color={BrandColors.vividTangerine}
                  onPress={() => handleQuickAction('repairs')}
                />
                <QuickAction
                  imageSource={chemicalOrderIcon}
                  label="Chemical Order"
                  color={BrandColors.azureBlue}
                  onPress={() => handleQuickAction('chemical')}
                />
                <QuickAction
                  imageSource={windyCleanupIcon}
                  label="Windy Cleanup"
                  color={BrandColors.tropicalTeal}
                  onPress={() => handleQuickAction('windy')}
                />
                <QuickAction
                  imageSource={serviceRepairsIcon}
                  label="Service Repairs"
                  color={BrandColors.vividTangerine}
                  onPress={() => handleQuickAction('service')}
                />
                <QuickAction
                  imageSource={chemicalsDropoffIcon}
                  label="Chemicals Dropped Off"
                  color={BrandColors.emerald}
                  onPress={() => handleQuickAction('dropoff')}
                />
              </View>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()}>
          <Pressable onPress={handleCompleteProperty} style={styles.completePropertyButton}>
            <Image
              source={completePropertyButton}
              style={styles.completePropertyImage}
              contentFit="contain"
            />
          </Pressable>
        </Animated.View>
      </ScrollView>

      <RepairsNeededModal
        visible={repairsModalVisible}
        onClose={() => setRepairsModalVisible(false)}
        propertyName={stop.propertyName}
        propertyAddress={stop.address}
      />
      <ChemicalOrderModal
        visible={chemicalModalVisible}
        onClose={() => setChemicalModalVisible(false)}
        propertyName={stop.propertyName}
        propertyAddress={stop.address}
      />
      <WindyDayCleanupModal
        visible={windyModalVisible}
        onClose={() => setWindyModalVisible(false)}
        propertyName={stop.propertyName}
        propertyAddress={stop.address}
      />
      <ServiceRepairModal
        visible={serviceRepairModalVisible}
        onClose={() => setServiceRepairModalVisible(false)}
        propertyName={stop.propertyName}
        propertyAddress={stop.address}
      />
      </View>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.card,
  },
  notesButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: BrandColors.vividTangerine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
  },
  propertyLabel: {
    fontSize: 14,
    color: BrandColors.azureBlue,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  propertyName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  addressText: {
    fontSize: 14,
  },
  timerCard: {
    backgroundColor: '#3B5998',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  timerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  timerDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: BrandColors.emerald,
  },
  timerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  timerValue: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  timerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  timerPoolCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  expandableCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  expandableCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  expandableCardText: {
    fontSize: 16,
    fontWeight: '600',
  },
  expandedContent: {
    padding: Spacing.lg,
    paddingTop: 0,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.border,
  },
  infoLabel: {
    fontSize: 14,
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checklistItemText: {
    fontSize: 15,
  },
  checklistItemTextChecked: {
    textDecorationLine: 'line-through',
    color: BrandColors.textSecondary,
  },
  addOtherButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  addOtherText: {
    fontSize: 15,
    color: BrandColors.azureBlue,
    fontWeight: '500',
  },
  quickActionsSection: {
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  quickActionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: BrandColors.textSecondary,
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickAction: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Shadows.card,
  },
  quickActionImage: {
    width: 94,
    height: 94,
  },
  bodiesSection: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  bodiesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bodiesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  bodiesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bodiesCountBadge: {
    backgroundColor: BrandColors.azureBlue,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  bodiesCountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  bodiesList: {
    gap: Spacing.sm,
  },
  bodyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  bodyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bodyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.azureBlue + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  bodyIcon: {
    fontSize: 20,
  },
  bodyInfo: {
    flex: 1,
  },
  bodyName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  bodyLocation: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  bodyTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  bodyTypeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  bodiesOfWaterButton: {
    marginLeft: -Spacing.screenPadding - 4,
    marginRight: -Spacing.screenPadding - 4,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  bodiesOfWaterImage: {
    width: '100%',
    height: 220,
  },
  completePropertyButton: {
    marginTop: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  completePropertyImage: {
    width: '100%',
    height: 280,
  },
  addTaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  addTaskInput: {
    flex: 1,
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
  },
  addTaskButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  addTaskButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelTaskButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
