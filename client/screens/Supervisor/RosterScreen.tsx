import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { BubbleBackground } from '@/components/BubbleBackground';
import { Avatar } from '@/components/Avatar';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { getApiUrl } from '@/lib/query-client';
import type { User, County } from '@/types';

const COUNTY_LABELS: Record<County, string> = {
  north_county: 'North County',
  south_county: 'South County',
  mid_county: 'Mid County',
};

interface TechnicianRowProps {
  technician: User;
  index: number;
  onRemove: () => void;
  onCountyChange: (county: County) => void;
}

function TechnicianRow({ technician, index, onRemove, onCountyChange }: TechnicianRowProps) {
  const { theme } = useTheme();
  const [showCountyPicker, setShowCountyPicker] = useState(false);

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <View style={[styles.techCard, { backgroundColor: theme.surface }]}>
        <View style={styles.techLeft}>
          <Avatar name={technician.name} size="medium" />
          <View style={styles.techInfo}>
            <ThemedText style={styles.techName}>{technician.name}</ThemedText>
            <ThemedText style={[styles.techEmail, { color: theme.textSecondary }]}>
              {technician.email}
            </ThemedText>
            <Pressable
              style={[styles.countyBadge, { backgroundColor: BrandColors.azureBlue + '15' }]}
              onPress={() => setShowCountyPicker(true)}
            >
              <ThemedText style={[styles.countyText, { color: BrandColors.azureBlue }]}>
                {technician.county ? COUNTY_LABELS[technician.county] : 'Set County'}
              </ThemedText>
              <Feather name="chevron-down" size={12} color={BrandColors.azureBlue} />
            </Pressable>
          </View>
        </View>
        
        <Pressable
          style={[styles.removeButton, { backgroundColor: BrandColors.danger + '15' }]}
          onPress={onRemove}
        >
          <Feather name="user-minus" size={18} color={BrandColors.danger} />
        </Pressable>
      </View>

      <Modal
        visible={showCountyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select County for {technician.name}</ThemedText>
              <Pressable onPress={() => setShowCountyPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            {(['north_county', 'south_county', 'mid_county'] as County[]).map((county) => (
              <Pressable
                key={county}
                style={[
                  styles.countyOption,
                  technician.county === county && { backgroundColor: BrandColors.azureBlue + '15' },
                ]}
                onPress={() => {
                  onCountyChange(county);
                  setShowCountyPicker(false);
                }}
              >
                <View style={[styles.countyIconSmall, { backgroundColor: BrandColors.azureBlue + '20' }]}>
                  <ThemedText style={[styles.countyIconText, { color: BrandColors.azureBlue }]}>
                    {COUNTY_LABELS[county].charAt(0)}
                  </ThemedText>
                </View>
                <ThemedText style={styles.countyLabel}>{COUNTY_LABELS[county]}</ThemedText>
                {technician.county === county ? (
                  <Feather name="check" size={20} color={BrandColors.azureBlue} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

export default function RosterScreen() {
  const { theme } = useTheme();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [roster, setRoster] = useState<User[]>([]);
  const [availableTechs, setAvailableTechs] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchRoster = useCallback(async () => {
    try {
      const response = await fetch(new URL('/api/roster', getApiUrl()).toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRoster(data);
      }
    } catch (error) {
      console.error('Failed to fetch roster:', error);
    }
  }, [token]);

  const fetchAvailableTechs = useCallback(async () => {
    try {
      const response = await fetch(new URL('/api/available-technicians', getApiUrl()).toString(), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const notOnRoster = data.filter(
          (tech: User) => !tech.supervisorId || tech.supervisorId === user?.id
        );
        setAvailableTechs(notOnRoster);
      }
    } catch (error) {
      console.error('Failed to fetch available technicians:', error);
    }
  }, [token, user?.id]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchRoster(), fetchAvailableTechs()]);
    setIsLoading(false);
  }, [fetchRoster, fetchAvailableTechs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddToRoster = async (technicianId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    try {
      const response = await fetch(new URL(`/api/roster/${technicianId}`, getApiUrl()).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        await loadData();
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Failed to add to roster:', error);
    }
  };

  const handleRemoveFromRoster = async (technicianId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    try {
      const response = await fetch(new URL(`/api/roster/${technicianId}`, getApiUrl()).toString(), {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        await fetchRoster();
      }
    } catch (error) {
      console.error('Failed to remove from roster:', error);
    }
  };

  const handleCountyChange = async (technicianId: string, county: County) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    try {
      const response = await fetch(new URL(`/api/roster/${technicianId}/county`, getApiUrl()).toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ county }),
      });
      if (response.ok) {
        setRoster(prev => prev.map(tech => 
          tech.id === technicianId ? { ...tech, county } : tech
        ));
      }
    } catch (error) {
      console.error('Failed to update county:', error);
    }
  };

  const techsNotOnMyRoster = availableTechs.filter(
    tech => !roster.find(r => r.id === tech.id)
  );

  return (
    <BubbleBackground bubbleCount={15}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: insets.top + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          paddingHorizontal: Spacing.screenPadding,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
          <View style={styles.headerContent}>
            <ThemedText style={styles.title}>My Roster</ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
              Service Technicians on your team
            </ThemedText>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.statValue, { color: BrandColors.azureBlue }]}>
              {roster.length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              On Roster
            </ThemedText>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
            <ThemedText style={[styles.statValue, { color: BrandColors.emerald }]}>
              {roster.filter(t => t.county).length}
            </ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
              Assigned
            </ThemedText>
          </View>
        </View>

        <BPButton
          variant="primary"
          icon="user-plus"
          onPress={() => setShowAddModal(true)}
          fullWidth
          style={styles.addButton}
        >
          Add Technician to Roster
        </BPButton>

        {isLoading ? (
          <ActivityIndicator size="large" color={BrandColors.azureBlue} style={styles.loader} />
        ) : roster.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: theme.surface }]}>
            <Feather name="users" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No technicians on your roster yet
            </ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: theme.textSecondary }]}>
              Add service technicians to your team
            </ThemedText>
          </View>
        ) : (
          <View style={styles.rosterList}>
            {roster.map((tech, index) => (
              <TechnicianRow
                key={tech.id}
                technician={tech}
                index={index}
                onRemove={() => handleRemoveFromRoster(tech.id)}
                onCountyChange={(county) => handleCountyChange(tech.id, county)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.addModalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Add Technician</ThemedText>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            {techsNotOnMyRoster.length === 0 ? (
              <View style={styles.emptyModalState}>
                <Feather name="check-circle" size={48} color={BrandColors.emerald} />
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                  All available technicians are on your roster
                </ThemedText>
              </View>
            ) : (
              <ScrollView style={styles.addModalList}>
                {techsNotOnMyRoster.map((tech) => (
                  <Pressable
                    key={tech.id}
                    style={[styles.addTechRow, { borderColor: theme.border }]}
                    onPress={() => handleAddToRoster(tech.id)}
                  >
                    <Avatar name={tech.name} size="small" />
                    <View style={styles.addTechInfo}>
                      <ThemedText style={styles.addTechName}>{tech.name}</ThemedText>
                      <ThemedText style={[styles.addTechEmail, { color: theme.textSecondary }]}>
                        {tech.email}
                      </ThemedText>
                    </View>
                    <Feather name="plus-circle" size={24} color={BrandColors.azureBlue} />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.card,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  addButton: {
    marginBottom: Spacing.lg,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  rosterList: {
    gap: Spacing.md,
  },
  techCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  techLeft: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  techInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  techName: {
    fontSize: 16,
    fontWeight: '600',
  },
  techEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  countyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    marginTop: Spacing.xs,
    gap: 4,
  },
  countyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
    ...Shadows.card,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    minHeight: '40%',
  },
  addModalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    paddingBottom: Spacing['2xl'],
    maxHeight: '70%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  countyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  countyIconSmall: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  countyIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  countyLabel: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  emptyModalState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  addModalList: {
    flex: 1,
  },
  addTechRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  addTechInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  addTechName: {
    fontSize: 16,
    fontWeight: '600',
  },
  addTechEmail: {
    fontSize: 12,
    marginTop: 2,
  },
});
