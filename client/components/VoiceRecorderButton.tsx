import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';
import { useVoiceRecorder, formatDuration } from '@/hooks/useVoiceRecorder';

interface VoiceRecorderButtonProps {
  onRecordingComplete?: (uri: string, duration: number) => void;
  onTranscriptionComplete?: (text: string) => void;
  compact?: boolean;
  label?: string;
}

export function VoiceRecorderButton({
  onRecordingComplete,
  onTranscriptionComplete,
  compact = false,
  label = 'Voice',
}: VoiceRecorderButtonProps) {
  const { theme } = useTheme();
  const pulseScale = useSharedValue(1);
  
  const {
    isRecording,
    duration,
    recordingUri,
    errorMessage,
    startRecording,
    stopRecording,
    playRecording,
    isPlaying,
  } = useVoiceRecorder({
    onRecordingComplete,
    onTranscriptionComplete,
  });

  React.useEffect(() => {
    if (isRecording) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withSpring(1);
    }
  }, [isRecording, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const handlePlayPress = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await playRecording();
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <Animated.View style={animatedStyle}>
          <Pressable
            style={[
              styles.compactButton,
              { backgroundColor: isRecording ? BrandColors.danger : BrandColors.azureBlue },
            ]}
            onPress={handlePress}
          >
            <Feather 
              name={isRecording ? 'square' : 'mic'} 
              size={16} 
              color="#FFFFFF" 
            />
            <ThemedText style={styles.compactButtonText}>
              {isRecording ? formatDuration(duration) : label}
            </ThemedText>
          </Pressable>
        </Animated.View>
        
        {recordingUri && !isRecording ? (
          <Pressable
            style={[styles.playButton, { backgroundColor: BrandColors.emerald }]}
            onPress={handlePlayPress}
          >
            <Feather 
              name={isPlaying ? 'pause' : 'play'} 
              size={14} 
              color="#FFFFFF" 
            />
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Pressable
          style={[
            styles.button,
            { backgroundColor: isRecording ? BrandColors.danger : BrandColors.azureBlue },
          ]}
          onPress={handlePress}
        >
          <Feather 
            name={isRecording ? 'square' : 'mic'} 
            size={20} 
            color="#FFFFFF" 
          />
          <ThemedText style={styles.buttonText}>
            {isRecording ? `Recording ${formatDuration(duration)}` : label}
          </ThemedText>
        </Pressable>
      </Animated.View>

      {isRecording ? (
        <View style={styles.recordingIndicator}>
          <View style={[styles.recordingDot, { backgroundColor: BrandColors.danger }]} />
          <ThemedText style={[styles.recordingText, { color: BrandColors.danger }]}>
            Tap to stop recording
          </ThemedText>
        </View>
      ) : null}

      {recordingUri && !isRecording ? (
        <View style={styles.playbackContainer}>
          <Pressable
            style={[styles.playbackButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={handlePlayPress}
          >
            <Feather 
              name={isPlaying ? 'pause' : 'play'} 
              size={18} 
              color={BrandColors.azureBlue} 
            />
            <ThemedText style={[styles.playbackText, { color: theme.text }]}>
              {isPlaying ? 'Playing...' : 'Play Recording'}
            </ThemedText>
          </Pressable>
          <View style={styles.durationBadge}>
            <ThemedText style={[styles.durationText, { color: theme.textSecondary }]}>
              {formatDuration(duration)}
            </ThemedText>
          </View>
        </View>
      ) : null}

      {errorMessage ? (
        <ThemedText style={[styles.errorText, { color: BrandColors.danger }]}>
          {errorMessage}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  compactButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  recordingText: {
    fontSize: 13,
    fontWeight: '500',
  },
  playbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  playbackText: {
    fontSize: 14,
    fontWeight: '500',
  },
  durationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  durationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    textAlign: 'center',
  },
});
