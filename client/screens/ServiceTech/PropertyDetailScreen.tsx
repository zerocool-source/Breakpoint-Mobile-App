import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import type { RouteStop, BodyOfWater } from '@/lib/serviceTechMockData';

type RootStackParamList = {
  PropertyDetail: { stop: RouteStop };
};

interface QuickActionProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}

function QuickAction({ icon, label, color, onPress }: QuickActionProps) {
  const { theme } = useTheme();
  
  return (
    <Pressable style={[styles.quickAction, { backgroundColor: theme.surface }]} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '15' }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <ThemedText style={styles.quickActionLabel}>{label}</ThemedText>
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

export default function PropertyDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'PropertyDetail'>>();
  const { theme } = useTheme();
  
  const { stop } = route.params;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [bodiesCompleted, setBodiesCompleted] = useState(0);

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
  };

  const handleCompleteProperty = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
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

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Pressable style={[styles.checklistCard, { backgroundColor: theme.surface }]}>
            <View style={styles.checklistLeft}>
              <Feather name="settings" size={20} color={BrandColors.azureBlue} />
              <ThemedText style={styles.checklistText}>Pump Room Checklist</ThemedText>
            </View>
            <Feather name="chevron-right" size={20} color={BrandColors.textSecondary} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActionsHeader}>
              <ThemedText style={styles.sectionTitle}>QUICK ACTIONS</ThemedText>
              <Feather name="chevron-down" size={18} color={BrandColors.textSecondary} />
            </View>
            <View style={styles.quickActionsGrid}>
              <QuickAction
                icon="tool"
                label="Repairs Needed"
                color={BrandColors.vividTangerine}
                onPress={() => handleQuickAction('repairs')}
              />
              <QuickAction
                icon="droplet"
                label="Chemical Order"
                color={BrandColors.azureBlue}
                onPress={() => handleQuickAction('chemical')}
              />
              <QuickAction
                icon="wind"
                label="Windy Cleanup"
                color={BrandColors.tropicalTeal}
                onPress={() => handleQuickAction('windy')}
              />
              <QuickAction
                icon="settings"
                label="Service Repairs"
                color={BrandColors.vividTangerine}
                onPress={() => handleQuickAction('service')}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()}>
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
                  onPress={() => {}}
                />
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <BPButton
          variant="success"
          onPress={handleCompleteProperty}
          fullWidth
          icon="check"
        >
          Complete Property
        </BPButton>
      </View>
    </View>
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
    backgroundColor: BrandColors.azureBlue,
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
    marginBottom: Spacing.lg,
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
  checklistCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  checklistText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsSection: {
    marginBottom: Spacing.lg,
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
    width: '22%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
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
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.screenPadding,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
});
