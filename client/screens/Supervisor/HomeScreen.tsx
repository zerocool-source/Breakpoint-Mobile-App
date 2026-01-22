import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { BubbleBackground } from '@/components/BubbleBackground';
import { QuickActionButton } from '@/components/QuickActionButton';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import {
  mockWeeklyMetrics,
  mockQCInspections,
  mockTechnicians,
  mockTechnicianAssignmentStats,
  mockProperties,
  supervisorInfo,
  type QCInspection,
  type Technician,
} from '@/lib/supervisorMockData';
import { RepairsNeededModal, ChemicalOrderModal } from '@/screens/ServiceTech/Modals';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

interface MetricCardBorderedProps {
  value: number;
  label: string;
  color: string;
}

function MetricCardBordered({ value, label, color }: MetricCardBorderedProps) {
  const { theme } = useTheme();
  
  return (
    <View style={[styles.metricCard, { backgroundColor: theme.surface, borderColor: color }]}>
      <ThemedText style={[styles.metricValue, { color }]}>{value}</ThemedText>
      <ThemedText style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
    </View>
  );
}

interface InspectionItemProps {
  inspection: QCInspection;
  onPress: () => void;
}

function InspectionItem({ inspection, onPress }: InspectionItemProps) {
  const { theme } = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return BrandColors.vividTangerine;
      case 'SCHEDULED':
        return '#9C27B0';
      case 'COMPLETED':
        return BrandColors.emerald;
      case 'IN_PROGRESS':
        return BrandColors.azureBlue;
      default:
        return theme.textSecondary;
    }
  };

  return (
    <Pressable style={[styles.inspectionItem, { backgroundColor: theme.surface }]} onPress={onPress}>
      <View style={styles.inspectionContent}>
        <ThemedText style={styles.inspectionProperty}>{inspection.propertyName}</ThemedText>
        <View style={styles.inspectionRow}>
          <Feather name="user" size={12} color={theme.textSecondary} />
          <ThemedText style={[styles.inspectionTech, { color: theme.textSecondary }]}>
            {inspection.technicianName}
          </ThemedText>
        </View>
        <View style={styles.inspectionRow}>
          <Feather name="clock" size={12} color={theme.textSecondary} />
          <ThemedText style={[styles.inspectionTime, { color: theme.textSecondary }]}>
            {inspection.time} - {inspection.date}
          </ThemedText>
        </View>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(inspection.status) + '20' }]}>
        <ThemedText style={[styles.statusText, { color: getStatusColor(inspection.status) }]}>
          {inspection.status}
        </ThemedText>
      </View>
    </Pressable>
  );
}

interface TechnicianCardProps {
  technician: Technician;
  onPress: () => void;
}

function TechnicianCard({ technician, onPress }: TechnicianCardProps) {
  const { theme } = useTheme();
  
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { label: 'Active', color: BrandColors.emerald };
      case 'running_behind':
        return { label: 'Running Behind', color: BrandColors.vividTangerine };
      case 'offline':
      case 'inactive':
        return { label: 'Offline', color: theme.textSecondary };
      case 'on_break':
        return { label: 'On Break', color: '#9C27B0' };
      default:
        return { label: status, color: theme.textSecondary };
    }
  };

  const statusInfo = getStatusInfo(technician.status);

  return (
    <Pressable 
      style={[styles.technicianCard, { backgroundColor: theme.surface }]} 
      onPress={onPress}
    >
      <View style={styles.technicianLeft}>
        <View style={styles.techAvatarContainer}>
          <View style={styles.techAvatar}>
            <Feather name="user" size={20} color="#FFFFFF" />
          </View>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
        </View>
        <View style={styles.techInfo}>
          <ThemedText style={styles.techName}>{technician.name}</ThemedText>
          <ThemedText style={[styles.techStatus, { color: statusInfo.color }]}>
            {statusInfo.label}
          </ThemedText>
        </View>
      </View>
      <View style={styles.technicianRight}>
        <ThemedText style={[styles.techProgress, { color: theme.text }]}>
          {technician.progress.completed}/{technician.progress.total} completed
        </ThemedText>
        <Feather name="chevron-down" size={20} color={theme.textSecondary} />
      </View>
    </Pressable>
  );
}

interface AssignmentBreakdownModalProps {
  visible: boolean;
  technician: Technician | null;
  onClose: () => void;
  onCreateAssignment: () => void;
  onSendMessage: () => void;
}

function AssignmentBreakdownModal({ 
  visible, 
  technician, 
  onClose,
  onCreateAssignment,
  onSendMessage 
}: AssignmentBreakdownModalProps) {
  const { theme } = useTheme();
  const stats = technician ? mockTechnicianAssignmentStats[technician.id] : null;

  if (!technician || !stats) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
          <View style={styles.modalHeader}>
            <View>
              <ThemedText style={styles.modalTitle}>{technician.name}</ThemedText>
              <ThemedText style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                Assignment Breakdown
              </ThemedText>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>

          <ThemedText style={styles.summaryLabel}>SUMMARY</ThemedText>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: theme.backgroundRoot }]}>
                <ThemedText style={[styles.summaryValue, { color: BrandColors.azureBlue }]}>
                  {stats.total}
                </ThemedText>
                <ThemedText style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>
                  Total
                </ThemedText>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: theme.backgroundRoot }]}>
                <ThemedText style={[styles.summaryValue, { color: BrandColors.emerald }]}>
                  {stats.completed}
                </ThemedText>
                <ThemedText style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>
                  Completed
                </ThemedText>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { backgroundColor: theme.backgroundRoot }]}>
                <ThemedText style={[styles.summaryValue, { color: BrandColors.danger }]}>
                  {stats.notDone}
                </ThemedText>
                <ThemedText style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>
                  Not Done
                </ThemedText>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: theme.backgroundRoot }]}>
                <ThemedText style={[styles.summaryValue, { color: BrandColors.vividTangerine }]}>
                  {stats.needHelp}
                </ThemedText>
                <ThemedText style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>
                  Need Help
                </ThemedText>
              </View>
            </View>
          </View>

          <ThemedText style={styles.myAssignmentsLabel}>My Assignments</ThemedText>
          
          <View style={[styles.assignmentsCard, { backgroundColor: theme.backgroundRoot }]}>
            <ThemedText style={[styles.totalAssignments, { color: BrandColors.azureBlue }]}>
              {stats.total}
            </ThemedText>
            <ThemedText style={[styles.totalAssignmentsLabel, { color: theme.textSecondary }]}>
              Total assignments this week
            </ThemedText>
            <View style={styles.assignmentBadges}>
              <View style={[styles.assignmentBadge, { backgroundColor: BrandColors.emerald + '20' }]}>
                <ThemedText style={[styles.assignmentBadgeText, { color: BrandColors.emerald }]}>
                  {stats.completed} Completed
                </ThemedText>
              </View>
              <View style={[styles.assignmentBadge, { backgroundColor: BrandColors.vividTangerine + '20' }]}>
                <ThemedText style={[styles.assignmentBadgeText, { color: BrandColors.vividTangerine }]}>
                  {stats.total - stats.completed} Pending
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.modalActions}>
            <Pressable 
              style={[styles.createAssignmentButton, { backgroundColor: BrandColors.azureBlue }]}
              onPress={onCreateAssignment}
            >
              <Feather name="plus" size={18} color="#FFFFFF" />
              <ThemedText style={styles.createAssignmentText}>Create Assignment</ThemedText>
            </Pressable>
            <Pressable 
              style={[styles.sendMessageButton, { borderColor: theme.border }]}
              onPress={onSendMessage}
            >
              <Feather name="message-square" size={18} color={theme.text} />
              <ThemedText style={styles.sendMessageText}>Send Message</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SupervisorHomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const [quickActionsExpanded, setQuickActionsExpanded] = useState(true);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showRepairsModal, setShowRepairsModal] = useState(false);
  const [showChemicalModal, setShowChemicalModal] = useState(false);
  
  const metrics = mockWeeklyMetrics;
  const inspections = mockQCInspections.slice(0, 4);
  const technicians = mockTechnicians;
  const defaultProperty = mockProperties[0];

  const handleChatPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleQuickAction = (action: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (action === 'repairs') {
      setShowRepairsModal(true);
    } else if (action === 'chemical') {
      setShowChemicalModal(true);
    }
  };

  const handleTechnicianPress = (technician: Technician) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedTechnician(technician);
    setShowBreakdownModal(true);
  };

  return (
    <BubbleBackground bubbleCount={18}>
      <View
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Avatar name={user?.name || supervisorInfo.name} size="medium" />
            <View style={styles.headerText}>
              <ThemedText style={styles.greeting}>{getGreeting()},</ThemedText>
              <ThemedText style={styles.userName}>
                {user?.name?.split(' ')[0] || 'Supervisor'}
              </ThemedText>
            </View>
          </View>
          <Pressable style={styles.chatButton} onPress={handleChatPress}>
            <Feather name="message-circle" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
        
        <View style={styles.regionBadge}>
          <Feather name="map-pin" size={14} color="#FFFFFF" />
          <ThemedText style={styles.regionText}>{supervisorInfo.region}</ThemedText>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>This Week</ThemedText>
          </View>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricsRow}>
              <MetricCardBordered
                value={metrics.assignmentsCreated}
                label="Assignments Created"
                color={BrandColors.azureBlue}
              />
              <MetricCardBordered
                value={metrics.propertiesInspected}
                label="Properties Inspected"
                color={BrandColors.emerald}
              />
            </View>
            <View style={styles.metricsRow}>
              <MetricCardBordered
                value={metrics.pendingResponses}
                label="Pending Responses"
                color={BrandColors.vividTangerine}
              />
              <MetricCardBordered
                value={metrics.qcInspections}
                label="QC Inspections"
                color="#9C27B0"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={[styles.teamTrackerCard, { backgroundColor: theme.surface }]}>
            <View style={styles.teamTrackerHeader}>
              <ThemedText style={styles.teamTrackerTitle}>Team Tracker</ThemedText>
              <ThemedText style={[styles.teamTrackerSubtitle, { color: theme.textSecondary }]}>
                Monitor technician progress
              </ThemedText>
            </View>
            
            <View style={styles.techniciansList}>
              {technicians.map((technician) => (
                <TechnicianCard
                  key={technician.id}
                  technician={technician}
                  onPress={() => handleTechnicianPress(technician)}
                />
              ))}
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionBullet, { backgroundColor: BrandColors.azureBlue }]} />
              <ThemedText style={styles.sectionTitle}>QC Inspections</ThemedText>
            </View>
          </View>
          
          <View style={styles.inspectionsList}>
            {inspections.map((inspection) => (
              <InspectionItem
                key={inspection.id}
                inspection={inspection}
                onPress={() => {}}
              />
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Pressable
            style={[styles.quickActionsHeader, { backgroundColor: theme.surface }]}
            onPress={() => setQuickActionsExpanded(!quickActionsExpanded)}
          >
            <ThemedText style={styles.quickActionsTitle}>QUICK ACTIONS</ThemedText>
            <Feather
              name={quickActionsExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.textSecondary}
            />
          </Pressable>
          
          {quickActionsExpanded ? (
            <View style={styles.quickActionsGrid}>
              <View style={styles.quickActionsRow}>
                <QuickActionButton
                  icon="tool"
                  label="Repairs Needed"
                  color={BrandColors.vividTangerine}
                  onPress={() => handleQuickAction('repairs')}
                />
                <QuickActionButton
                  icon="droplet"
                  label="Chemical Order"
                  color={BrandColors.azureBlue}
                  onPress={() => handleQuickAction('chemical')}
                />
                <QuickActionButton
                  icon="truck"
                  label="Chemicals Drop-Off"
                  color="#FF6B6B"
                  onPress={() => handleQuickAction('dropoff')}
                />
              </View>
              <View style={styles.quickActionsRow}>
                <QuickActionButton
                  icon="wind"
                  label="Windy Day Clean Up"
                  color={BrandColors.tropicalTeal}
                  onPress={() => handleQuickAction('windy')}
                />
                <QuickActionButton
                  icon="settings"
                  label="Service Repairs"
                  color={BrandColors.vividTangerine}
                  onPress={() => handleQuickAction('service')}
                />
                <QuickActionButton
                  icon="alert-triangle"
                  label="Report Issue"
                  color={BrandColors.danger}
                  onPress={() => handleQuickAction('report')}
                />
              </View>
              <View style={styles.quickActionsRow}>
                <QuickActionButton
                  icon="file-text"
                  label="Add Notes"
                  color={BrandColors.azureBlue}
                  onPress={() => handleQuickAction('notes')}
                />
                <QuickActionButton
                  icon="alert-circle"
                  label="Emergency"
                  color={BrandColors.danger}
                  onPress={() => handleQuickAction('emergency')}
                />
                <View style={styles.quickActionPlaceholder} />
              </View>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      <AssignmentBreakdownModal
        visible={showBreakdownModal}
        technician={selectedTechnician}
        onClose={() => setShowBreakdownModal(false)}
        onCreateAssignment={() => {
          setShowBreakdownModal(false);
        }}
        onSendMessage={() => {
          setShowBreakdownModal(false);
        }}
      />

      <RepairsNeededModal
        visible={showRepairsModal}
        onClose={() => setShowRepairsModal(false)}
        propertyName={defaultProperty.name}
        propertyAddress={defaultProperty.address}
        technicianName="Supervisor"
      />

      <ChemicalOrderModal
        visible={showChemicalModal}
        onClose={() => setShowChemicalModal(false)}
        propertyName={defaultProperty.name}
        propertyAddress={defaultProperty.address}
      />
    </BubbleBackground>
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: Spacing.md,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  regionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionBullet: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  metricsGrid: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  metricCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    ...Shadows.card,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  teamTrackerCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  teamTrackerHeader: {
    marginBottom: Spacing.lg,
  },
  teamTrackerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  teamTrackerSubtitle: {
    fontSize: 13,
  },
  techniciansList: {
    gap: Spacing.sm,
  },
  technicianCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  technicianLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  techAvatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  techAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BrandColors.azureBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  techInfo: {
    flex: 1,
  },
  techName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  techStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  technicianRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  techProgress: {
    fontSize: 13,
    fontWeight: '500',
  },
  inspectionsList: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  inspectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.card,
  },
  inspectionContent: {
    flex: 1,
  },
  inspectionProperty: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inspectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  inspectionTech: {
    fontSize: 13,
  },
  inspectionTime: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  quickActionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  quickActionsTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  quickActionsGrid: {
    gap: Spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  quickActionPlaceholder: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing["2xl"] + 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing.md,
  },
  summaryGrid: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  summaryCardLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  myAssignmentsLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  assignmentsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  totalAssignments: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  totalAssignmentsLabel: {
    fontSize: 13,
    marginBottom: Spacing.md,
  },
  assignmentBadges: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  assignmentBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  assignmentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  createAssignmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  createAssignmentText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sendMessageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  sendMessageText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
