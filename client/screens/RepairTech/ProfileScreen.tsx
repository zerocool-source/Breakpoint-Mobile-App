import React, { useState } from 'react';
import { View, StyleSheet, Alert, Platform } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ThemedText } from '@/components/ThemedText';
import { Avatar } from '@/components/Avatar';
import { SettingsRow } from '@/components/SettingsRow';
import { BPButton } from '@/components/BPButton';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

const roleNames: Record<UserRole, string> = {
  service_tech: 'Service Technician',
  supervisor: 'Supervisor',
  repair_tech: 'Repair Technician',
  repair_foreman: 'Repair Foreman',
};

export default function ProfileScreen() {
  const { user, logout, selectedRole } = useAuth();
  const { theme } = useTheme();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [batterySaver, setBatterySaver] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const roleName = selectedRole ? roleNames[selectedRole] : 'Technician';

  const handleLogout = async () => {
    // On web, Alert.alert doesn't work properly, so just logout directly
    if (Platform.OS === 'web') {
      setIsLoggingOut(true);
      await logout();
      setIsLoggingOut(false);
      return;
    }
    
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setIsLoggingOut(true);
            await logout();
            setIsLoggingOut(false);
          } 
        },
      ]
    );
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        paddingTop: headerHeight + Spacing.lg,
        paddingBottom: tabBarHeight + Spacing.xl,
        paddingHorizontal: Spacing.screenPadding,
      }}
      scrollIndicatorInsets={{ bottom: insets.bottom }}
    >
      <View style={[styles.profileCard, { backgroundColor: theme.surface }]}>
        <Avatar name={user?.name} size="large" />
        <View style={styles.profileInfo}>
          <ThemedText style={styles.name}>{user?.name || 'Technician'}</ThemedText>
          <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
            {user?.email || 'tech@breakpoint.com'}
          </ThemedText>
          <View style={styles.roleBadge}>
            <ThemedText style={styles.roleText}>{roleName}</ThemedText>
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
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="cloud-off"
          label="Offline Mode"
          isSwitch
          switchValue={offlineMode}
          onSwitchChange={setOfflineMode}
          color={BrandColors.vividTangerine}
        />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <SettingsRow
          icon="battery-charging"
          label="Save Battery 50%"
          isSwitch
          switchValue={batterySaver}
          onSwitchChange={setBatterySaver}
          color={BrandColors.emerald}
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
  settingsCard: {
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
  divider: {
    height: 1,
    marginVertical: Spacing.xs,
  },
  logoutButton: {
    marginTop: Spacing.sm,
  },
});
