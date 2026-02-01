import React from 'react';
import {
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { ProductCatalog } from '@/components/ProductCatalog';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

export default function RepairTechProductsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const navigation = useNavigation<any>();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
      <View style={[styles.headerBanner, { backgroundColor: theme.surface }]}>
        <View style={styles.headerContent}>
          <Feather name="package" size={24} color={BrandColors.azureBlue} />
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>Heritage Products</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Browse 600+ pool products with full pricing
            </ThemedText>
          </View>
        </View>
        <Pressable 
          onPress={() => navigation.navigate('AceEstimateBuilder')}
          style={styles.createButton}
        >
          <Feather name="plus" size={18} color="#fff" />
          <ThemedText style={styles.createButtonText}>New Estimate</ThemedText>
        </Pressable>
      </View>

      <ProductCatalog
        role="repair_tech"
        selectionMode={false}
      />

      <Pressable
        onPress={() => navigation.navigate('AceEstimateBuilder')}
        style={styles.floatingButton}
      >
        <Feather name="file-plus" size={24} color="#fff" />
        <ThemedText style={styles.floatingButtonText}>Create Estimate</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.azureBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: BrandColors.azureBlue,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
