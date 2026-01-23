import React, { useState } from 'react';
import { View, StyleSheet, Platform, Pressable, Modal } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { SettingsRow } from '@/components/SettingsRow';
import { BPButton } from '@/components/BPButton';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import { supervisorInfo, mockWeeklyMetrics, mockTechnicians } from '@/lib/supervisorMockData';
import { getApiUrl } from '@/lib/query-client';

type County = 'north_county' | 'south_county' | 'mid_county';

const COUNTY_LABELS: Record<County, string> = {
  north_county: 'North County',
  south_county: 'South County',
  mid_county: 'Mid County',
};

export default function SupervisorProfileScreen() {
  const { user, logout, token } = useAuth();
  const { theme } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showCountyPicker, setShowCountyPicker] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState<County | null>(
    (user?.county as County) || null
  );
  const [isSavingCounty, setIsSavingCounty] = useState(false);

  const handleCountySelect = async (county: County) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSavingCounty(true);
    try {
      const response = await fetch(new URL('/api/user/county', getApiUrl()).toString(), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ county }),
      });
      if (response.ok) {
        setSelectedCounty(county);
      }
    } catch (error) {
      console.error('Failed to update county:', error);
    } finally {
      setIsSavingCounty(false);
      setShowCountyPicker(false);
    }
  };

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

      <Pressable 
        style={[styles.regionCard, { backgroundColor: theme.surface }]}
        onPress={() => setShowCountyPicker(true)}
      >
        <View style={styles.regionHeader}>
          <View style={[styles.regionIcon, { backgroundColor: BrandColors.azureBlue + '15' }]}>
            <ThemedText style={[styles.regionIconText, { color: BrandColors.azureBlue }]}>
              {selectedCounty ? COUNTY_LABELS[selectedCounty].charAt(0) : '?'}
            </ThemedText>
          </View>
          <View style={styles.regionInfo}>
            <ThemedText style={[styles.regionLabel, { color: theme.textSecondary }]}>County Assignment</ThemedText>
            <ThemedText style={styles.regionName}>
              {selectedCounty ? COUNTY_LABELS[selectedCounty] : 'Tap to select county'}
            </ThemedText>
          </View>
          <Feather name="chevron-right" size={20} color={theme.textSecondary} />
        </View>
      </Pressable>

      <Modal
        visible={showCountyPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCountyPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Select County</ThemedText>
              <Pressable onPress={() => setShowCountyPicker(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>
            {(['north_county', 'south_county', 'mid_county'] as County[]).map((county) => (
              <Pressable
                key={county}
                style={[
                  styles.countyOption,
                  selectedCounty === county && { backgroundColor: BrandColors.azureBlue + '15' },
                ]}
                onPress={() => handleCountySelect(county)}
                disabled={isSavingCounty}
              >
                <View style={[styles.countyIconSmall, { backgroundColor: BrandColors.azureBlue + '20' }]}>
                  <ThemedText style={[styles.countyIconText, { color: BrandColors.azureBlue }]}>
                    {COUNTY_LABELS[county].charAt(0)}
                  </ThemedText>
                </View>
                <ThemedText style={styles.countyLabel}>{COUNTY_LABELS[county]}</ThemedText>
                {selectedCounty === county ? (
                  <Feather name="check" size={20} color={BrandColors.azureBlue} />
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>

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
    flex: 1,
  },
  regionLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  regionName: {
    fontSize: 16,
    fontWeight: '600',
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
