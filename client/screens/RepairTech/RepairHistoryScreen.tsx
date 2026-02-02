import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { BubbleBackground } from '@/components/BubbleBackground';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { getAuthApiUrl, joinUrl } from '@/lib/query-client';

interface RepairHistoryEntry {
  id: string;
  propertyId: string;
  technicianId: string;
  title: string;
  description?: string;
  workPerformed: string;
  partsUsed?: string;
  laborHours?: string;
  totalCost?: string;
  completedAt: string;
  notes?: string;
  technician?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  property?: {
    name: string;
    address: string;
  };
}

interface RepairHistoryCardProps {
  entry: RepairHistoryEntry;
  onPress: () => void;
}

function RepairHistoryCard({ entry, onPress }: RepairHistoryCardProps) {
  const { theme } = useTheme();
  
  const techName = entry.technician?.firstName && entry.technician?.lastName
    ? `${entry.technician.firstName} ${entry.technician.lastName}`
    : entry.technician?.email || 'Unknown';
    
  const completedDate = new Date(entry.completedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  
  const parsedParts = entry.partsUsed ? JSON.parse(entry.partsUsed) : [];
  const partsCount = Array.isArray(parsedParts) ? parsedParts.length : 0;
  
  return (
    <Pressable 
      style={[styles.historyCard, { backgroundColor: theme.surface }]}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <ThemedText style={styles.cardTitle}>{entry.title}</ThemedText>
          <View style={[styles.dateBadge, { backgroundColor: BrandColors.azureBlue + '20' }]}>
            <ThemedText style={[styles.dateText, { color: BrandColors.azureBlue }]}>
              {completedDate}
            </ThemedText>
          </View>
        </View>
        {entry.property ? (
          <ThemedText style={[styles.propertyName, { color: BrandColors.vividTangerine }]}>
            {entry.property.name}
          </ThemedText>
        ) : null}
      </View>
      
      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Feather name="tool" size={14} color={theme.textSecondary} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]} numberOfLines={2}>
            {entry.workPerformed}
          </ThemedText>
        </View>
        
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="user" size={12} color={theme.textSecondary} />
            <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
              {techName}
            </ThemedText>
          </View>
          
          {partsCount > 0 ? (
            <View style={styles.metaItem}>
              <Feather name="package" size={12} color={theme.textSecondary} />
              <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                {partsCount} part{partsCount !== 1 ? 's' : ''}
              </ThemedText>
            </View>
          ) : null}
          
          {entry.totalCost ? (
            <View style={styles.metaItem}>
              <Feather name="dollar-sign" size={12} color={BrandColors.emerald} />
              <ThemedText style={[styles.metaText, { color: BrandColors.emerald }]}>
                ${parseFloat(entry.totalCost).toFixed(2)}
              </ThemedText>
            </View>
          ) : null}
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}

type RepairHistoryRouteParams = {
  RepairHistory: { propertyId?: string; propertyName?: string };
};

export default function RepairHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RepairHistoryRouteParams, 'RepairHistory'>>();
  const { user, token } = useAuth();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const propertyId = route.params?.propertyId;
  const propertyName = route.params?.propertyName;

  const { data: historyData, isLoading, refetch } = useQuery({
    queryKey: ['/api/repair-history', propertyId],
    queryFn: async () => {
      const url = propertyId 
        ? joinUrl(getAuthApiUrl(), `/api/repair-history?propertyId=${propertyId}`)
        : joinUrl(getAuthApiUrl(), '/api/repair-history');
      
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch repair history');
      }
      
      return response.json();
    },
    enabled: !!token,
  });

  const history: RepairHistoryEntry[] = historyData || [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleEntryPress = (entry: RepairHistoryEntry) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  return (
    <BubbleBackground bubbleCount={12}>
      <LinearGradient
        colors={['#0078D4', '#0066B8', '#005499']}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerContent}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <ThemedText style={styles.headerTitle}>Repair History</ThemedText>
            {propertyName ? (
              <ThemedText style={styles.headerSubtitle}>{propertyName}</ThemedText>
            ) : null}
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xl }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: theme.surface }]}>
              <Feather name="clipboard" size={24} color={BrandColors.azureBlue} />
              <ThemedText style={styles.statNumber}>{history.length}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total Repairs
              </ThemedText>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.emptyState}>
              <Feather name="loader" size={40} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Loading repair history...
              </ThemedText>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyState}>
              <Feather name="clipboard" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                No Repair History
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                {propertyName 
                  ? `No repairs have been recorded for ${propertyName} yet.`
                  : 'Completed repairs will appear here.'}
              </ThemedText>
            </View>
          ) : (
            history.map((entry, index) => (
              <Animated.View
                key={entry.id}
                entering={FadeInDown.delay(100 + index * 50).springify()}
              >
                <RepairHistoryCard
                  entry={entry}
                  onPress={() => handleEntryPress(entry)}
                />
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>
    </BubbleBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.card,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  historyCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  cardHeader: {
    marginBottom: Spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  dateBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
  },
  propertyName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  cardBody: {
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
});
