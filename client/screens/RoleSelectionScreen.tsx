import React from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

const { width } = Dimensions.get('window');

export type Role = 'service_tech' | 'supervisor' | 'repair_tech' | 'repair_foreman';

interface RoleOption {
  id: Role;
  title: string;
  subtitle: string;
  avatar: any;
  icon?: keyof typeof Feather.glyphMap;
  iconColor?: string;
  isHighlighted?: boolean;
  highlightColor?: string;
}

const roles: RoleOption[] = [
  {
    id: 'service_tech',
    title: 'Service Technician',
    subtitle: 'Routes, stops, voice entries',
    avatar: require('../../assets/images/avatar-service-tech.png'),
  },
  {
    id: 'supervisor',
    title: 'Supervisor',
    subtitle: 'Team overview, assignments',
    avatar: null,
    icon: 'headphones',
    iconColor: BrandColors.tropicalTeal,
  },
  {
    id: 'repair_tech',
    title: 'Repair Technician',
    subtitle: 'Estimates, repairs, jobs',
    avatar: require('../../assets/images/avatar-repair-tech.png'),
    isHighlighted: true,
    highlightColor: BrandColors.azureBlue,
  },
  {
    id: 'repair_foreman',
    title: 'Repair Foreman',
    subtitle: 'Team management, oversight',
    avatar: null,
    icon: 'tool',
    iconColor: BrandColors.vividTangerine,
    highlightColor: BrandColors.vividTangerine,
  },
];

interface RoleCardProps {
  role: RoleOption;
  index: number;
  onSelect: (role: Role) => void;
}

function RoleCard({ role, index, onSelect }: RoleCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onSelect(role.id);
  };

  const isHighlighted = role.isHighlighted;
  const hasBorder = role.highlightColor && !isHighlighted;

  const renderAvatar = () => {
    if (role.avatar) {
      return (
        <Image
          source={role.avatar}
          style={styles.roleAvatar}
          contentFit="cover"
        />
      );
    }
    
    const iconBgColor = isHighlighted 
      ? 'rgba(255,255,255,0.2)' 
      : (role.iconColor || BrandColors.azureBlue) + '20';
    const iconFgColor = isHighlighted 
      ? '#FFFFFF' 
      : (role.iconColor || BrandColors.azureBlue);

    return (
      <View style={[styles.iconPlaceholder, { backgroundColor: iconBgColor }]}>
        <Feather name={role.icon || 'user'} size={24} color={iconFgColor} />
      </View>
    );
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 100).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.roleCard,
          isHighlighted && { backgroundColor: role.highlightColor },
          hasBorder && { borderColor: role.highlightColor, borderWidth: 2 },
        ]}
        testID={`role-card-${role.id}`}
      >
        <View style={styles.roleAvatarContainer}>
          {renderAvatar()}
        </View>
        <View style={styles.roleContent}>
          <ThemedText
            style={[
              styles.roleTitle,
              isHighlighted && { color: '#FFFFFF' },
            ]}
          >
            {role.title}
          </ThemedText>
          <ThemedText
            style={[
              styles.roleSubtitle,
              isHighlighted && { color: 'rgba(255,255,255,0.8)' },
            ]}
          >
            {role.subtitle}
          </ThemedText>
        </View>
        <Feather
          name="chevron-right"
          size={20}
          color={isHighlighted ? 'rgba(255,255,255,0.7)' : '#CCCCCC'}
        />
      </Pressable>
    </Animated.View>
  );
}

interface RoleSelectionScreenProps {
  onSelectRole: (role: Role) => void;
}

export default function RoleSelectionScreen({ onSelectRole }: RoleSelectionScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.header}>
          <Image
            source={require('../../assets/images/breakpoint-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText style={styles.title}>Breakpoint Commercial Pools</ThemedText>
          <ThemedText style={styles.subtitle}>Select your role to continue</ThemedText>
        </Animated.View>

        <View style={styles.rolesContainer}>
          {roles.map((role, index) => (
            <RoleCard
              key={role.id}
              role={role}
              index={index}
              onSelect={onSelectRole}
            />
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(700).springify()} style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Quick demo access - no password required
          </ThemedText>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: BrandColors.textSecondary,
    textAlign: 'center',
  },
  rolesContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: Spacing.md,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  roleAvatarContainer: {
    marginRight: Spacing.md,
  },
  roleAvatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
  },
  iconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleContent: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: '#000000',
  },
  roleSubtitle: {
    fontSize: 13,
    color: '#666666',
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  footerText: {
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
});
