import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

interface Customer {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  notes?: string;
  estimateCount: number;
  lastEstimateDate?: string;
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Sunset Valley HOA',
    address: '1234 Sunset Blvd, San Diego, CA 92101',
    phone: '(619) 555-0100',
    email: 'manager@sunsetvalley.com',
    estimateCount: 8,
    lastEstimateDate: '2026-02-01',
  },
  {
    id: '2',
    name: 'Marina Bay Apartments',
    address: '5678 Harbor Dr, San Diego, CA 92102',
    phone: '(619) 555-0200',
    estimateCount: 5,
    lastEstimateDate: '2026-01-28',
  },
  {
    id: '3',
    name: 'Hilltop Country Club',
    address: '9012 Mountain View Rd, San Diego, CA 92103',
    phone: '(619) 555-0300',
    email: 'facilities@hilltopcc.com',
    estimateCount: 12,
    lastEstimateDate: '2026-02-02',
  },
  {
    id: '4',
    name: 'Pacific Heights Condos',
    address: '3456 Ocean Ave, San Diego, CA 92104',
    estimateCount: 3,
    lastEstimateDate: '2026-01-15',
  },
];

export default function CustomersScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', address: '', phone: '', email: '' });

  const filteredCustomers = mockCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleAddCustomer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowAddModal(true);
  };

  const handleSaveCustomer = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowAddModal(false);
    setNewCustomer({ name: '', address: '', phone: '', email: '' });
  };

  const renderCustomer = ({ item }: { item: Customer }) => (
    <Pressable style={[styles.customerCard, { backgroundColor: theme.surface }]}>
      <View style={styles.customerMain}>
        <View style={[styles.avatar, { backgroundColor: BrandColors.azureBlue }]}>
          <ThemedText style={styles.avatarText}>
            {item.name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
          </ThemedText>
        </View>
        <View style={styles.customerInfo}>
          <ThemedText style={styles.customerName}>{item.name}</ThemedText>
          <ThemedText style={[styles.customerAddress, { color: theme.textSecondary }]} numberOfLines={1}>
            {item.address}
          </ThemedText>
          {item.phone ? (
            <ThemedText style={[styles.customerPhone, { color: theme.textSecondary }]}>
              {item.phone}
            </ThemedText>
          ) : null}
        </View>
      </View>
      <View style={styles.customerStats}>
        <ThemedText style={[styles.estimateCount, { color: BrandColors.azureBlue }]}>
          {item.estimateCount}
        </ThemedText>
        <ThemedText style={[styles.estimateLabel, { color: theme.textSecondary }]}>
          estimates
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.searchContainer, { marginTop: headerHeight + Spacing.md }]}>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search customers..."
            placeholderTextColor={theme.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Pressable
          style={[styles.addButton, { backgroundColor: BrandColors.azureBlue }]}
          onPress={handleAddCustomer}
        >
          <Feather name="plus" size={22} color="#fff" />
        </Pressable>
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              No customers found
            </ThemedText>
          </View>
        }
      />

      <Modal visible={showAddModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <Pressable style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.modalTitle}>Add Customer</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Name</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
                placeholder="Customer name"
                placeholderTextColor={theme.textSecondary}
                value={newCustomer.name}
                onChangeText={(text) => setNewCustomer({ ...newCustomer, name: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Address</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
                placeholder="Full address"
                placeholderTextColor={theme.textSecondary}
                value={newCustomer.address}
                onChangeText={(text) => setNewCustomer({ ...newCustomer, address: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
                placeholder="(555) 555-5555"
                placeholderTextColor={theme.textSecondary}
                keyboardType="phone-pad"
                value={newCustomer.phone}
                onChangeText={(text) => setNewCustomer({ ...newCustomer, phone: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: theme.textSecondary }]}>Email</ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: theme.backgroundRoot, color: theme.text, borderColor: theme.border }]}
                placeholder="email@example.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={newCustomer.email}
                onChangeText={(text) => setNewCustomer({ ...newCustomer, email: text })}
              />
            </View>

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: theme.backgroundRoot }]}
                onPress={() => setShowAddModal(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: BrandColors.azureBlue }]}
                onPress={handleSaveCustomer}
              >
                <ThemedText style={styles.saveButtonText}>Save</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
  customerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  customerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  customerAddress: {
    fontSize: 13,
    marginTop: 2,
  },
  customerPhone: {
    fontSize: 12,
    marginTop: 2,
  },
  customerStats: {
    alignItems: 'center',
  },
  estimateCount: {
    fontSize: 20,
    fontWeight: '700',
  },
  estimateLabel: {
    fontSize: 11,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 13,
    marginBottom: Spacing.xs,
  },
  input: {
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
