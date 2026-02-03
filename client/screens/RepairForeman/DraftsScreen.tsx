import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/context/AuthContext';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { getLocalApiUrl, joinUrl, apiRequest } from '@/lib/query-client';

interface DraftEstimate {
  id: string;
  estimateNumber: string;
  propertyId: string;
  propertyName?: string;
  status: 'draft';
  subtotal: string;
  tax: string;
  total: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  itemCount?: number;
}

export default function DraftsScreen() {
  const navigation = useNavigation<any>();
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const queryClient = useQueryClient();

  const { data: drafts = [], isLoading, refetch } = useQuery<DraftEstimate[]>({
    queryKey: ['/api/estimates', { status: 'draft' }],
    select: (data: any) => {
      if (Array.isArray(data)) return data;
      if (data?.items) return data.items;
      return [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (estimateId: string) => {
      const apiUrl = getLocalApiUrl();
      return apiRequest('DELETE', joinUrl(apiUrl, `/api/estimates/${estimateId}`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/estimates'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
  });

  const handleResumeDraft = (draft: DraftEstimate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('AceEstimateBuilder', { 
      estimateId: draft.id,
      propertyId: draft.propertyId,
      propertyName: draft.propertyName,
    });
  };

  const handleDeleteDraft = (draft: DraftEstimate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Draft',
      `Are you sure you want to delete ${draft.estimateNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate(draft.id),
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderDraft = ({ item }: { item: DraftEstimate }) => (
    <Pressable
      style={[styles.draftCard, { backgroundColor: theme.surface }]}
      onPress={() => handleResumeDraft(item)}
    >
      <View style={styles.draftMain}>
        <View style={styles.draftIcon}>
          <Feather name="file-text" size={24} color={BrandColors.azureBlue} />
        </View>
        <View style={styles.draftInfo}>
          <ThemedText style={styles.estimateNumber}>{item.estimateNumber}</ThemedText>
          <ThemedText style={[styles.propertyName, { color: theme.textSecondary }]}>
            {item.propertyName || 'No property selected'}
          </ThemedText>
          <View style={styles.draftMeta}>
            <ThemedText style={[styles.itemCount, { color: theme.textSecondary }]}>
              {item.itemCount || 0} items
            </ThemedText>
            <ThemedText style={[styles.dot, { color: theme.textSecondary }]}>•</ThemedText>
            <ThemedText style={[styles.lastEdited, { color: theme.textSecondary }]}>
              {formatDate(item.updatedAt)}
            </ThemedText>
          </View>
        </View>
      </View>
      <View style={styles.draftActions}>
        <ThemedText style={[styles.total, { color: BrandColors.azureBlue }]}>
          ${parseFloat(item.total || '0').toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </ThemedText>
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: BrandColors.azureBlue }]}
            onPress={() => handleResumeDraft(item)}
          >
            <Feather name="edit-2" size={16} color="#fff" />
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
            onPress={() => handleDeleteDraft(item)}
          >
            <Feather name="trash-2" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: 'rgba(0,120,212,0.1)' }]}>
        <Feather name="file-plus" size={48} color={BrandColors.azureBlue} />
      </View>
      <ThemedText style={styles.emptyTitle}>No Drafts</ThemedText>
      <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Start a new estimate and it will be saved here automatically
      </ThemedText>
      <Pressable
        style={[styles.newButton, { backgroundColor: BrandColors.vividTangerine }]}
        onPress={() => navigation.navigate('AceEstimateBuilder')}
      >
        <Feather name="plus" size={20} color="#fff" />
        <ThemedText style={styles.newButtonText}>New Estimate</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={drafts}
        renderItem={renderDraft}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingTop: headerHeight + Spacing.md, paddingBottom: insets.bottom + 100 },
          drafts.length === 0 && styles.emptyList,
        ]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => refetch()} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  emptyList: {
    flex: 1,
  },
  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  draftMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  draftIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,120,212,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftInfo: {
    flex: 1,
  },
  estimateNumber: {
    fontSize: 16,
    fontWeight: '600',
  },
  propertyName: {
    fontSize: 13,
    marginTop: 2,
  },
  draftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: Spacing.xs,
  },
  itemCount: {
    fontSize: 12,
  },
  dot: {
    fontSize: 12,
  },
  lastEdited: {
    fontSize: 12,
  },
  draftActions: {
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  newButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
