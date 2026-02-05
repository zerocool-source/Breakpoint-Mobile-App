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
          withTiming(1, { duration: 1500 + (index * 100), easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, { duration: 1500 + (index * 100), easing: Easing.inOut(Easing.ease) })
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
    const translateX = wobble.value * 15;
    const opacity = interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 0.5, 0.5, 0]);
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

Bubble.displayName = 'Bubble';

interface BubbleBackgroundProps {
  children: React.ReactNode;
  bubbleCount?: number;
}

// Memoized BubbleBackground to prevent parent re-renders from recreating bubbles
export const BubbleBackground = React.memo(({ children, bubbleCount = 15 }: BubbleBackgroundProps) => {
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
        delay: seed1 * 3000,
        size: 6 + seed2 * 20,
        startX: seed3 * width,
        duration: 5000 + seed4 * 4000,
      });
    }
    return bubbleConfigs;
  }, [bubbleCount]);

  return (
    <LinearGradient
      colors={['#0a1628', '#0d2137', '#0a1628']}
      style={styles.container}
    >
      <View style={[styles.bubblesContainer, { pointerEvents: 'none' }]}>
        {bubbles.map((bubble) => (
          <Bubble key={`bubble-${bubble.index}`} {...bubble} />
        ))}
      </View>
      {children}
    </LinearGradient>
  );
});

BubbleBackground.displayName = 'BubbleBackground';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bubblesContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 180, 216, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.4)',
  },
});
