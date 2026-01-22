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
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface BubbleProps {
  delay: number;
  size: number;
  startX: number;
  duration: number;
}

function Bubble({ delay, size, startX, duration }: BubbleProps) {
  const progress = useSharedValue(0);
  const wobble = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
    wobble.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
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
}

interface LightBubbleBackgroundProps {
  children: React.ReactNode;
  bubbleCount?: number;
}

export function LightBubbleBackground({ children, bubbleCount = 12 }: LightBubbleBackgroundProps) {
  const bubbles = useMemo(() => {
    const bubbleConfigs: BubbleProps[] = [];
    for (let i = 0; i < bubbleCount; i++) {
      bubbleConfigs.push({
        delay: Math.random() * 4000,
        size: 8 + Math.random() * 24,
        startX: Math.random() * width,
        duration: 6000 + Math.random() * 5000,
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
        {bubbles.map((bubble, index) => (
          <Bubble key={index} {...bubble} />
        ))}
      </View>
      {children}
    </LinearGradient>
  );
}

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
