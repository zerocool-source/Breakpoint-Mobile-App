import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { extractItems, type Page } from '@/lib/query-client';
import {
  type SupervisorAssignment,
  type AssignmentStatus,
  type AssignmentPriority,
} from '@/lib/supervisorMockData';
import { CreateAssignmentModal } from '@/screens/Supervisor/Modals/CreateAssignmentModal';
import { EditAssignmentModal } from '@/screens/Supervisor/Modals/EditAssignmentModal';

type FilterTab = 'COMPLETED' | 'NOT_COMPLETED' | 'NEED_ASSISTANCE';

interface APIAssignment {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'need_assistance';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  notes: string | null;
  scheduledDate: string | null;
  createdAt: string;
  property: { id: string; name: string; address: string };
  technician: { id: string; name: string; email: string };
}

function mapAPIStatusToDisplayStatus(apiStatus: APIAssignment['status']): AssignmentStatus {
  switch (apiStatus) {
    case 'pending':
      return 'NOT_COMPLETED';
    case 'in_progress':
      return 'IN_PROGRESS';
    case 'completed':
      return 'COMPLETED';
    case 'need_assistance':
      return 'NEED_ASSISTANCE';
    default:
      return 'NOT_COMPLETED';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function mapAPIAssignmentToDisplay(apiAssignment: APIAssignment): SupervisorAssignment {
  return {
    id: apiAssignment.id,
    title: apiAssignment.title,
    type: apiAssignment.type,
    propertyName: apiAssignment.property?.name ?? 'Unknown Property',
    technicianName: apiAssignment.technician?.name ?? 'Unassigned',
    priority: apiAssignment.priority as AssignmentPriority,
    status: mapAPIStatusToDisplayStatus(apiAssignment.status),
    assignedDate: formatDate(apiAssignment.createdAt),
    completedDate: apiAssignment.status === 'completed' ? formatDate(apiAssignment.createdAt) : undefined,
    notes: apiAssignment.notes ?? undefined,
  };
}

interface AssignmentCardProps {
  assignment: SupervisorAssignment;
  onPress: () => void;
}

function AssignmentCard({ assignment, onPress }: AssignmentCardProps) {
  const { theme } = useTheme();
  
  const getStatusColor = (status: AssignmentStatus) => {
    switch (status) {
      case 'COMPLETED':
        return BrandColors.emerald;
      case 'NOT_COMPLETED':
        return BrandColors.vividTangerine;
      case 'NEED_ASSISTANCE':
        return BrandColors.danger;
      case 'IN_PROGRESS':
        return BrandColors.azureBlue;
      default:
        return theme.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return BrandColors.danger;
      case 'MEDIUM':
        return BrandColors.vividTangerine;
      case 'LOW':
        return BrandColors.azureBlue;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <Pressable style={[styles.assignmentCard, { backgroundColor: theme.surface }]} onPress={onPress}>
      <View style={styles.cardHeader}>
        <ThemedText style={styles.assignmentTitle}>{assignment.title}</ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(assignment.status) }]}>
          <ThemedText style={styles.statusBadgeText}>
            {assignment.status.replace('_', ' ')}
          </ThemedText>
        </View>
      </View>
      
      <View style={styles.cardRow}>
        <Feather name="user" size={14} color={BrandColors.azureBlue} />
        <ThemedText style={[styles.techLink, { color: BrandColors.azureBlue }]}>
          {assignment.technicianName}
        </ThemedText>
      </View>
      
      <View style={styles.cardRow}>
        <Feather name="map-pin" size={14} color={theme.textSecondary} />
        <ThemedText style={[styles.propertyName, { color: theme.textSecondary }]}>
          {assignment.propertyName}
        </ThemedText>
      </View>
      
      <View style={styles.cardDates}>
        <View style={styles.dateItem}>
          <ThemedText style={[styles.dateLabel, { color: theme.textSecondary }]}>Assigned:</ThemedText>
          <ThemedText style={styles.dateValue}>{assignment.assignedDate}</ThemedText>
        </View>
        {assignment.completedDate ? (
          <View style={styles.dateItem}>
            <ThemedText style={[styles.dateLabel, { color: theme.textSecondary }]}>Completed:</ThemedText>
            <ThemedText style={styles.dateValue}>{assignment.completedDate}</ThemedText>
          </View>
        ) : null}
      </View>
      
      {assignment.notes ? (
        <View style={[styles.notesContainer, { backgroundColor: theme.backgroundSecondary }]}>
          <ThemedText style={[styles.notesText, { color: theme.textSecondary }]}>
            {assignment.notes}
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(assignment.priority) + '20' }]}>
        <ThemedText style={[styles.priorityText, { color: getPriorityColor(assignment.priority) }]}>
          {assignment.priority} PRIORITY
        </ThemedText>
      </View>
    </Pressable>
  );
}

export default function SupervisorAssignScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('COMPLETED');
  const [sectionsExpanded, setSectionsExpanded] = useState<Record<FilterTab, boolean>>({
    COMPLETED: true,
    NOT_COMPLETED: true,
    NEED_ASSISTANCE: true,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<APIAssignment | null>(null);

  const { data: assignmentsData, isLoading, isError, error, refetch, isRefetching } = useQuery<Page<APIAssignment>>({
    queryKey: ['/api/assignments/created'],
  });

  const apiAssignments = useMemo(() => extractItems(assignmentsData, 'supervisor-assignments'), [assignmentsData]);

  const assignments: SupervisorAssignment[] = useMemo(() => {
    return apiAssignments.map(mapAPIAssignmentToDisplay);
  }, [apiAssignments]);

  const filteredAssignments = useMemo(() => {
    let filtered = assignments;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.technicianName.toLowerCase().includes(query) ||
          a.propertyName.toLowerCase().includes(query) ||
          a.title.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [searchQuery, assignments]);

  const groupedAssignments = useMemo(() => {
    return {
      COMPLETED: filteredAssignments.filter((a) => a.status === 'COMPLETED'),
      NOT_COMPLETED: filteredAssignments.filter((a) => a.status === 'NOT_COMPLETED' || a.status === 'IN_PROGRESS'),
      NEED_ASSISTANCE: filteredAssignments.filter((a) => a.status === 'NEED_ASSISTANCE'),
    };
  }, [filteredAssignments]);

  const handleFilterPress = (filter: FilterTab) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveFilter(filter);
  };

  const toggleSection = (section: FilterTab) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSectionsExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getFilterColor = (filter: FilterTab) => {
    switch (filter) {
      case 'COMPLETED':
        return BrandColors.emerald;
      case 'NOT_COMPLETED':
        return BrandColors.vividTangerine;
      case 'NEED_ASSISTANCE':
        return BrandColors.danger;
    }
  };

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleAssignmentPress = useCallback((apiAssignment: APIAssignment) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedAssignment(apiAssignment);
    setEditModalVisible(true);
  }, []);

  const handleEditModalClose = useCallback(() => {
    setEditModalVisible(false);
    setSelectedAssignment(null);
  }, []);

  const totalCount = assignments.length;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={BrandColors.azureBlue} />
        <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
          Loading assignments...
        </ThemedText>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="alert-circle" size={48} color={BrandColors.danger} />
        <ThemedText style={[styles.errorTitle, { color: theme.text }]}>
          Failed to load assignments
        </ThemedText>
        <ThemedText style={[styles.errorMessage, { color: theme.textSecondary }]}>
          {error instanceof Error ? error.message : 'An unexpected error occurred'}
        </ThemedText>
        <BPButton variant="primary" onPress={() => refetch()} style={styles.retryButton}>
          Retry
        </BPButton>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.md, backgroundColor: theme.surface }]}>
        <View style={styles.headerTitleRow}>
          <ThemedText style={styles.headerTitle}>Assignments</ThemedText>
          <View style={[styles.headerBadge, { backgroundColor: BrandColors.azureBlue }]}>
            <ThemedText style={styles.headerBadgeText}>{totalCount}</ThemedText>
          </View>
        </View>
        
        <View style={[styles.searchContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by technician name..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        
        <View style={styles.filterTabs}>
          {(['COMPLETED', 'NOT_COMPLETED', 'NEED_ASSISTANCE'] as FilterTab[]).map((filter) => (
            <Pressable
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && {
                  backgroundColor: getFilterColor(filter),
                },
                activeFilter !== filter && {
                  backgroundColor: theme.backgroundSecondary,
                },
              ]}
              onPress={() => handleFilterPress(filter)}
            >
              <ThemedText
                style={[
                  styles.filterTabText,
                  { color: activeFilter === filter ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {filter.replace('_', ' ')}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <BPButton
          variant="primary"
          icon="plus"
          onPress={() => setModalVisible(true)}
          fullWidth
          style={styles.createButton}
        >
          Create Assignment
        </BPButton>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={BrandColors.azureBlue}
            colors={[BrandColors.azureBlue]}
          />
        }
      >
        {(['COMPLETED', 'NOT_COMPLETED', 'NEED_ASSISTANCE'] as FilterTab[]).map((section) => {
          const sectionAssignments = groupedAssignments[section];
          if (sectionAssignments.length === 0) return null;
          
          return (
            <View key={section} style={styles.section}>
              <Pressable
                style={[
                  styles.sectionHeader,
                  { backgroundColor: getFilterColor(section) + '15' },
                ]}
                onPress={() => toggleSection(section)}
              >
                <View style={styles.sectionHeaderLeft}>
                  <Feather
                    name={sectionsExpanded[section] ? 'chevron-down' : 'chevron-right'}
                    size={18}
                    color={getFilterColor(section)}
                  />
                  <ThemedText style={[styles.sectionTitle, { color: getFilterColor(section) }]}>
                    {section.replace('_', ' ')} ({sectionAssignments.length})
                  </ThemedText>
                </View>
              </Pressable>
              
              {sectionsExpanded[section] ? (
                <View style={styles.assignmentsList}>
                  {sectionAssignments.map((assignment) => {
                    const apiAssignment = apiAssignments?.find(a => a.id === assignment.id);
                    return (
                      <AssignmentCard
                        key={assignment.id}
                        assignment={assignment}
                        onPress={() => apiAssignment && handleAssignmentPress(apiAssignment)}
                      />
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}

        {assignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="clipboard" size={48} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              No assignments found
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>

      <CreateAssignmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <EditAssignmentModal
        visible={editModalVisible}
        onClose={handleEditModalClose}
        assignment={selectedAssignment}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  errorMessage: {
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    minWidth: 120,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
    ...Shadows.header,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.xs,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  filterTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  createButton: {
    marginTop: Spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  assignmentsList: {
    gap: Spacing.md,
  },
  assignmentCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  assignmentTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  techLink: {
    fontSize: 14,
    fontWeight: '500',
  },
  propertyName: {
    fontSize: 14,
  },
  cardDates: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dateItem: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  dateLabel: {
    fontSize: 12,
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '500',
  },
  notesContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  notesText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  priorityIndicator: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyStateText: {
    marginTop: Spacing.md,
    fontSize: 16,
  },
});
