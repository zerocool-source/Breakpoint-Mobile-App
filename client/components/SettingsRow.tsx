import React from 'react';
import { View, StyleSheet, Pressable, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, Spacing } from '@/constants/theme';

interface SettingsRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  color?: string;
  showChevron?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  isSwitch,
  switchValue,
  onSwitchChange,
  color = BrandColors.azureBlue,
  showChevron = true,
}: SettingsRowProps) {
  const { theme } = useTheme();
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (!isSwitch) {
      opacity.value = withTiming(0.7, { duration: 100 });
    }
  };

  const handlePressOut = () => {
    if (!isSwitch) {
      opacity.value = withTiming(1, { duration: 100 });
    }
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  const handleSwitchChange = (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSwitchChange?.(val);
  };

  return (
    <AnimatedPressable
      onPress={isSwitch ? undefined : handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isSwitch}
      style={[styles.container, animatedStyle]}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <ThemedText style={styles.label}>{label}</ThemedText>
      {isSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={handleSwitchChange}
          trackColor={{ false: theme.border, true: BrandColors.azureBlue + '50' }}
          thumbColor={switchValue ? BrandColors.azureBlue : '#F4F3F4'}
        />
      ) : (
        <>
          {value ? (
            <ThemedText style={[styles.value, { color: theme.textSecondary }]}>
              {value}
            </ThemedText>
          ) : null}
          {showChevron ? (
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          ) : null}
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  label: {
    flex: 1,
    fontSize: 16,
  },
  value: {
    fontSize: 14,
    marginRight: Spacing.sm,
  },
});
