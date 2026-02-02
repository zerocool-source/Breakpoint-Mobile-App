import React from 'react';
import { StyleSheet, Pressable, View, Platform, Image, ImageSourcePropType } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { BorderRadius, Spacing, Shadows, SpringConfigs } from '@/constants/theme';

interface QuickActionButtonProps {
  icon?: keyof typeof Feather.glyphMap;
  imageSource?: ImageSourcePropType;
  label: string;
  color: string;
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const sizeConfigs = {
  small: { iconContainer: 80, iconSize: 40, padding: Spacing.lg, labelSize: 14, borderRadius: BorderRadius.lg },
  medium: { iconContainer: 100, iconSize: 50, padding: Spacing.xl, labelSize: 16, borderRadius: BorderRadius.xl },
  large: { iconContainer: 120, iconSize: 60, padding: Spacing['2xl'], labelSize: 18, borderRadius: BorderRadius['2xl'] },
};

export function QuickActionButton({ icon, imageSource, label, color, onPress, size = 'medium' }: QuickActionButtonProps) {
  const scale = useSharedValue(1);
  const config = sizeConfigs[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, SpringConfigs.responsive);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SpringConfigs.responsive);
  };

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress();
  };

  const bgColor = color + '12';
  const imageSize = config.iconContainer * 1.6;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container, 
        { 
          backgroundColor: imageSource ? 'transparent' : bgColor,
          padding: config.padding,
          borderRadius: config.borderRadius,
        }, 
        animatedStyle
      ]}
    >
      {imageSource ? (
        <Image 
          source={imageSource}
          style={[
            styles.imageIcon,
            { 
              width: imageSize, 
              height: imageSize,
              borderRadius: BorderRadius.lg,
            }
          ]}
          resizeMode="contain"
        />
      ) : (
        <View 
          style={[
            styles.iconContainer, 
            { 
              backgroundColor: color,
              width: config.iconContainer,
              height: config.iconContainer,
              borderRadius: config.iconContainer / 2.5,
            },
            Shadows.card,
          ]}
        >
          {icon ? <Feather name={icon} size={config.iconSize} color="#FFFFFF" /> : null}
        </View>
      )}
      {!imageSource ? (
        <ThemedText 
          style={[styles.label, { fontSize: config.labelSize }]} 
          numberOfLines={2}
        >
          {label}
        </ThemedText>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  imageIcon: {
    alignSelf: 'center',
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
