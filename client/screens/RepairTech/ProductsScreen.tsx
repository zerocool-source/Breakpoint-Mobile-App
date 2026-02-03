import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { ProductCatalog } from '@/components/ProductCatalog';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

export default function RepairTechProductsScreen() {
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight }]}>
      <View style={[styles.headerBanner, { backgroundColor: theme.surface }]}>
        <View style={styles.headerContent}>
          <Feather name="package" size={24} color={BrandColors.azureBlue} />
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>Products & Services</ThemedText>
            <ThemedText style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              Search and browse pool products catalog
            </ThemedText>
          </View>
        </View>
      </View>

      <ProductCatalog
        role="repair_tech"
        selectionMode={false}
      />
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
});
