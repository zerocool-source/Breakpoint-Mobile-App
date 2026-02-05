import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Seeded random for consistent bubble positions (prevents flickering)
const seededRandom = (seed: number) => {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
};

interface BubbleProps {
  delay: number;
  size: number;
  startX: number;
  duration: number;
  index: number;
}

// Memoized Bubble component to prevent unnecessary re-renders
const Bubble = React.memo(({ delay, size, startX, duration, index }: BubbleProps) => {
  const progress = useSharedValue(0);
  const wobble = useSharedValue(0);

  useEffect(() => {
    // Reset values before starting
    progress.value = 0;
    wobble.value = 0;

    // Start vertical movement animation
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        true // FIXED: Reset to initial value on each loop
      )
    );

    // Start horizontal wobble animation
    wobble.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000 + (index * 100), easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, { duration: 2000 + (index * 100), easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // CRITICAL: Cleanup animations on unmount to prevent memory leaks
    return () => {
      cancelAnimation(progress);
      cancelAnimation(wobble);
    };
  }, [delay, duration, index]); // FIXED: Proper dependencies

  const animatedStyle = useAnimatedStyle(() => {
    'worklet';
    const translateY = interpolate(progress.value, [0, 1], [height + 50, -100]);
    const translateX = wobble.value * 12;
    const opacity = interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 0.35, 0.35, 0]);
    const scale = interpolate(progress.value, [0, 0.5, 1], [0.8, 1, 0.6]);

    return {
      transform: [
        { translateY },
        { translateX },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          left: startX,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
});

Bubble.displayName = 'LightBubble';

interface LightBubbleBackgroundProps {
  children: React.ReactNode;
  bubbleCount?: number;
}

// Memoized BubbleBackground to prevent parent re-renders from recreating bubbles
export const LightBubbleBackground = React.memo(({ children, bubbleCount = 12 }: LightBubbleBackgroundProps) => {
  // Generate bubble configs with seeded randomness for consistency
  const bubbles = useMemo(() => {
    const bubbleConfigs: (BubbleProps)[] = [];
    for (let i = 0; i < bubbleCount; i++) {
      // Use seeded random based on index for consistent positions
      const seed1 = seededRandom(i * 1);
      const seed2 = seededRandom(i * 2);
      const seed3 = seededRandom(i * 3);
      const seed4 = seededRandom(i * 4);

      bubbleConfigs.push({
        index: i,
        delay: seed1 * 4000,
        size: 8 + seed2 * 24,
        startX: seed3 * width,
        duration: 6000 + seed4 * 5000,
      });
    }
    return bubbleConfigs;
  }, [bubbleCount]);

  return (
    <LinearGradient
      colors={['#E8F4FC', '#F0F8FF', '#E8F4FC']}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      <View style={styles.poolEdgeLeft} />
      <View style={styles.poolEdgeRight} />
      <View style={styles.bubblesContainer}>
        {bubbles.map((bubble) => (
          <Bubble key={`light-bubble-${bubble.index}`} {...bubble} />
        ))}
      </View>
      {children}
    </LinearGradient>
  );
});

LightBubbleBackground.displayName = 'LightBubbleBackground';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  poolEdgeLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
  },
  poolEdgeRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'rgba(0, 180, 216, 0.08)',
  },
  bubblesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 180, 216, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.25)',
  },
});
