import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { mockTruckInfo, type InventoryItem, type MaintenanceItem } from '@/lib/serviceTechMockData';

interface InventoryRowProps {
  item: InventoryItem;
  onIncrement: () => void;
  onDecrement: () => void;
}

function InventoryRow({ item, onIncrement, onDecrement }: InventoryRowProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.inventoryRow, { borderBottomColor: theme.border }]}>
      <ThemedText style={styles.inventoryName}>{item.name}</ThemedText>
      <View style={styles.inventoryControls}>
        <Pressable style={styles.inventoryButton} onPress={onDecrement}>
          <Feather name="minus" size={18} color={BrandColors.azureBlue} />
        </Pressable>
        <View style={styles.inventoryValueContainer}>
          <ThemedText style={styles.inventoryValue}>{item.quantity}</ThemedText>
          <ThemedText style={styles.inventoryUnit}>{item.unit}</ThemedText>
        </View>
        <Pressable style={[styles.inventoryButton, styles.inventoryButtonAdd]} onPress={onIncrement}>
          <Feather name="plus" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

interface MaintenanceCardProps {
  item: MaintenanceItem;
}

function MaintenanceCard({ item }: MaintenanceCardProps) {
  const { theme } = useTheme();
  const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
    truck: 'truck',
    wind: 'wind',
    thermometer: 'thermometer',
    circle: 'circle',
  };
  
  return (
    <View style={[
      styles.maintenanceCard, 
      { backgroundColor: theme.surface },
      item.isUrgent && styles.maintenanceCardUrgent,
    ]}>
      <View style={[styles.maintenanceIcon, { backgroundColor: BrandColors.azureBlue + '15' }]}>
        <Feather name={iconMap[item.icon] || 'tool'} size={20} color={BrandColors.azureBlue} />
      </View>
      <ThemedText style={styles.maintenanceName}>{item.name}</ThemedText>
      <ThemedText style={[styles.maintenanceMiles, { color: item.isUrgent ? BrandColors.danger : BrandColors.emerald }]}>
        {item.milesRemaining.toLocaleString()} miles
      </ThemedText>
      <ThemedText style={[styles.maintenanceDate, { color: theme.textSecondary }]}>
        {item.dueDate}
      </ThemedText>
    </View>
  );
}

export default function TruckScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  
  const [inventory, setInventory] = useState(mockTruckInfo.inventory);

  const handleIncrement = (itemId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInventory(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecrement = (itemId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setInventory(prev => 
      prev.map(item => 
        item.id === itemId && item.quantity > 0 
          ? { ...item, quantity: item.quantity - 1 } 
          : item
      )
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={['#3B5998', '#4A69BD', '#5D7ED3']}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.truckInfo}>
          <View style={styles.truckIconContainer}>
            <Feather name="truck" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.truckDetails}>
            <ThemedText style={styles.truckNumber}>Truck #{mockTruckInfo.number}</ThemedText>
            <ThemedText style={styles.truckModel}>{mockTruckInfo.model}</ThemedText>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Feather name="package" size={20} color={BrandColors.textPrimary} />
              <ThemedText style={styles.sectionTitle}>Inventory</ThemedText>
            </View>
            <Pressable style={styles.addButton}>
              <Feather name="plus" size={16} color="#FFFFFF" />
              <ThemedText style={styles.addButtonText}>Add Item</ThemedText>
            </Pressable>
          </View>

          <View style={[styles.inventoryCard, { backgroundColor: theme.surface }]}>
            {inventory.map((item) => (
              <InventoryRow
                key={item.id}
                item={item}
                onIncrement={() => handleIncrement(item.id)}
                onDecrement={() => handleDecrement(item.id)}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.maintenanceSection}>
            <View style={styles.maintenanceHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="tool" size={20} color={BrandColors.textPrimary} />
                <ThemedText style={styles.sectionTitle}>Performance Maintenance</ThemedText>
              </View>
              <ThemedText style={[styles.maintenanceSubtitle, { color: theme.textSecondary }]}>
                Synced with OneStep GPS
              </ThemedText>
            </View>

            <View style={styles.maintenanceGrid}>
              {mockTruckInfo.maintenance.map((item) => (
                <MaintenanceCard key={item.id} item={item} />
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
  },
  truckInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  truckIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  truckDetails: {
    flex: 1,
  },
  truckNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  truckModel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.azureBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inventoryCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
  },
  inventoryName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  inventoryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inventoryButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: BrandColors.azureBlue + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryButtonAdd: {
    backgroundColor: BrandColors.azureBlue,
  },
  inventoryValueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    minWidth: 70,
    justifyContent: 'center',
  },
  inventoryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.azureBlue,
    marginRight: Spacing.xs,
  },
  inventoryUnit: {
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
  maintenanceSection: {
    marginBottom: Spacing.lg,
  },
  maintenanceHeader: {
    marginBottom: Spacing.md,
  },
  maintenanceSubtitle: {
    fontSize: 13,
    marginTop: Spacing.xs,
    marginLeft: 28,
  },
  maintenanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  maintenanceCard: {
    width: '47%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  maintenanceCardUrgent: {
    borderWidth: 2,
    borderColor: BrandColors.vividTangerine,
  },
  maintenanceIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  maintenanceName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  maintenanceMiles: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  maintenanceDate: {
    fontSize: 12,
  },
});
