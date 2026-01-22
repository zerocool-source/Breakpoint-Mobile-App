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
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(-1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
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
}

interface BubbleBackgroundProps {
  children: React.ReactNode;
  bubbleCount?: number;
}

export function BubbleBackground({ children, bubbleCount = 15 }: BubbleBackgroundProps) {
  const bubbles = useMemo(() => {
    const bubbleConfigs: BubbleProps[] = [];
    for (let i = 0; i < bubbleCount; i++) {
      bubbleConfigs.push({
        delay: Math.random() * 3000,
        size: 6 + Math.random() * 20,
        startX: Math.random() * width,
        duration: 5000 + Math.random() * 4000,
      });
    }
    return bubbleConfigs;
  }, [bubbleCount]);

  return (
    <LinearGradient
      colors={['#0a1628', '#0d2137', '#0a1628']}
      style={styles.container}
    >
      <View style={styles.bubblesContainer} pointerEvents="none">
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
