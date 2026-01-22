import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { SettingsRow } from '@/components/SettingsRow';
import { BPButton } from '@/components/BPButton';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { supervisorInfo, mockWeeklyMetrics, mockTechnicians } from '@/lib/supervisorMockData';

export default function SupervisorProfileScreen() {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setIsLoggingOut(true);
    await logout();
    setIsLoggingOut(false);
  };

  const activeTechnicians = mockTechnicians.filter((t) => t.status === 'active').length;

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: insets.top + Spacing.xl,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.screenPadding,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
        <Avatar name={user?.name || supervisorInfo.name} size="large" />
        <View style={styles.profileInfo}>
          <ThemedText style={styles.name}>{user?.name || supervisorInfo.name}</ThemedText>
          <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
            {user?.email || supervisorInfo.email}
          </ThemedText>
          <View style={styles.roleBadge}>
            <ThemedText style={styles.roleText}>Supervisor</ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.regionCard, { backgroundColor: theme.surface }]}>
        <View style={styles.regionHeader}>
          <View style={[styles.regionIcon, { backgroundColor: BrandColors.azureBlue + '15' }]}>
            <ThemedText style={[styles.regionIconText, { color: BrandColors.azureBlue }]}>
              {supervisorInfo.region.charAt(0)}
            </ThemedText>
          </View>
          <View style={styles.regionInfo}>
            <ThemedText style={[styles.regionLabel, { color: theme.textSecondary }]}>Region Assignment</ThemedText>
            <ThemedText style={styles.regionName}>{supervisorInfo.region}</ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.statsCard, { backgroundColor: theme.surface }]}>
        <ThemedText style={styles.sectionTitle}>Today's Stats</ThemedText>
        <View style={styles.statsGrid}>
          <View style={[styles.statItem, { borderColor: BrandColors.azureBlue }]}>
            <ThemedText style={[styles.statValue, { color: BrandColors.azureBlue }]}>{activeTechnicians}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Active Techs</ThemedText>
          </View>
          <View style={[styles.statItem, { borderColor: BrandColors.emerald }]}>
            <ThemedText style={[styles.statValue, { color: BrandColors.emerald }]}>{mockWeeklyMetrics.propertiesInspected}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Inspected</ThemedText>
          </View>
          <View style={[styles.statItem, { borderColor: BrandColors.vividTangerine }]}>
            <ThemedText style={[styles.statValue, { color: BrandColors.vividTangerine }]}>{mockWeeklyMetrics.pendingResponses}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Pending</ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
        <ThemedText style={styles.sectionTitle}>Preferences</ThemedText>
        <SettingsRow
          icon="bell"
          label="Push Notifications"
          isSwitch
          switchValue={notificationsEnabled}
          onSwitchChange={setNotificationsEnabled}
        />
      </View>

      <View style={[styles.settingsCard, { backgroundColor: theme.surface }]}>
        <ThemedText style={styles.sectionTitle}>Support</ThemedText>
        <SettingsRow
          icon="help-circle"
          label="Help Center"
          onPress={() => {}}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="message-circle"
          label="Contact Support"
          onPress={() => {}}
          color={BrandColors.vividTangerine}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="info"
          label="About"
          value="v1.0.0"
          onPress={() => {}}
          color={BrandColors.tropicalTeal}
        />
      </View>

      <BPButton
        variant="danger"
        onPress={handleLogout}
        fullWidth
        icon="log-out"
        loading={isLoggingOut}
        style={styles.logoutButton}
      >
        Sign Out
      </BPButton>
    </KeyboardAwareScrollViewCompat>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  profileInfo: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  email: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    backgroundColor: BrandColors.azureBlue + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: BrandColors.azureBlue,
  },
  regionCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regionIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  regionInfo: {
    marginLeft: Spacing.md,
  },
  regionLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  regionName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: BrandColors.textSecondary,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  settingsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  logoutButton: {
    marginTop: Spacing.sm,
  },
});
