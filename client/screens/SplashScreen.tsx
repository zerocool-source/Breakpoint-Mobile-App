import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
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

import { ThemedText } from '@/components/ThemedText';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

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
    const opacity = interpolate(progress.value, [0, 0.1, 0.8, 1], [0, 0.6, 0.6, 0]);
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

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  const bubbles = useMemo(() => {
    const bubbleConfigs: BubbleProps[] = [];
    for (let i = 0; i < 20; i++) {
      bubbleConfigs.push({
        delay: Math.random() * 3000,
        size: 8 + Math.random() * 24,
        startX: Math.random() * width,
        duration: 4000 + Math.random() * 3000,
      });
    }
    return bubbleConfigs;
  }, []);

  useEffect(() => {
    logoOpacity.value = withDelay(500, withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) }));
    logoScale.value = withDelay(500, withSequence(
      withTiming(1.05, { duration: 500, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
    ));
    textOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));

    const timer = setTimeout(() => {
      onFinish();
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <LinearGradient
      colors={['#0a1628', '#0d2137', '#0a1628']}
      style={styles.container}
    >
      <View style={styles.bubblesContainer}>
        {bubbles.map((bubble, index) => (
          <Bubble key={index} {...bubble} />
        ))}
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require('../../assets/images/breakpoint-logo-clean.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </Animated.View>
        <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
          <ThemedText style={styles.title}>Breakpoint</ThemedText>
          <ThemedText style={styles.subtitle}>Commercial Pool Systems</ThemedText>
        </Animated.View>
      </View>
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
    backgroundColor: 'rgba(0, 180, 216, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(0, 180, 216, 0.5)',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 24,
  },
  logo: {
    width: width * 0.35,
    height: width * 0.35,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
