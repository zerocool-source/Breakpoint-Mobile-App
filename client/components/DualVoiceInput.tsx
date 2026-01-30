import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Platform, TextInput } from 'react-native';
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

type VoiceMode = 'text' | 'audio';

interface DualVoiceInputProps {
  onTextChange?: (text: string) => void;
  onAudioRecorded?: (uri: string, duration: number) => void;
  placeholder?: string;
  value?: string;
  textInputStyle?: object;
}

export function DualVoiceInput({
  onTextChange,
  onAudioRecorded,
  placeholder = 'Describe the issue...',
  value = '',
  textInputStyle,
}: DualVoiceInputProps) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<VoiceMode>('text');
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const recognitionRef = useRef<any>(null);
  const pulseScale = useSharedValue(1);

  const {
    isRecording,
    duration,
    recordingUri,
    startRecording,
    stopRecording,
    playRecording,
    isPlaying,
  } = useVoiceRecorder({
    onRecordingComplete: onAudioRecorded,
  });

  React.useEffect(() => {
    if (isRecording || isListening) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseScale);
      pulseScale.value = withSpring(1);
    }
  }, [isRecording, isListening, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const startSpeechToText = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (Platform.OS === 'web' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const newText = value + finalTranscript + interimTranscript;
        setTranscribedText(interimTranscript);
        if (finalTranscript) {
          onTextChange?.(value + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.log('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setTranscribedText('');
      };

      recognitionRef.current.start();
    } else {
      setIsListening(false);
    }
  }, [value, onTextChange]);

  const stopSpeechToText = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setTranscribedText('');
  }, []);

  const handleVoiceToTextPress = () => {
    if (isListening) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  const handleAudioRecordPress = async () => {
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

  const isSpeechSupported = Platform.OS === 'web' && 'webkitSpeechRecognition' in (typeof window !== 'undefined' ? window : {});

  return (
    <View style={styles.container}>
      <View style={styles.modeSelector}>
        <Pressable
          style={[
            styles.modeButton,
            mode === 'text' && { backgroundColor: BrandColors.azureBlue },
            mode !== 'text' && { backgroundColor: theme.backgroundSecondary },
          ]}
          onPress={() => setMode('text')}
        >
          <Feather 
            name="type" 
            size={16} 
            color={mode === 'text' ? '#FFFFFF' : theme.textSecondary} 
          />
          <ThemedText style={[
            styles.modeButtonText, 
            { color: mode === 'text' ? '#FFFFFF' : theme.textSecondary }
          ]}>
            Voice to Text
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.modeButton,
            mode === 'audio' && { backgroundColor: BrandColors.vividTangerine },
            mode !== 'audio' && { backgroundColor: theme.backgroundSecondary },
          ]}
          onPress={() => setMode('audio')}
        >
          <Feather 
            name="mic" 
            size={16} 
            color={mode === 'audio' ? '#FFFFFF' : theme.textSecondary} 
          />
          <ThemedText style={[
            styles.modeButtonText, 
            { color: mode === 'audio' ? '#FFFFFF' : theme.textSecondary }
          ]}>
            Audio Message
          </ThemedText>
        </Pressable>
      </View>

      {mode === 'text' ? (
        <View style={styles.textModeContainer}>
          <View style={[styles.textInputContainer, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
            <TextInput
              style={[styles.textInput, { color: theme.text }, textInputStyle]}
              placeholder={placeholder}
              placeholderTextColor={theme.textSecondary}
              value={value + transcribedText}
              onChangeText={onTextChange}
              multiline
              numberOfLines={4}
            />
          </View>
          
          <View style={styles.voiceToTextControls}>
            {isSpeechSupported ? (
              <Animated.View style={animatedStyle}>
                <Pressable
                  style={[
                    styles.voiceButton,
                    { backgroundColor: isListening ? BrandColors.danger : BrandColors.azureBlue },
                  ]}
                  onPress={handleVoiceToTextPress}
                >
                  <Feather 
                    name={isListening ? 'mic-off' : 'mic'} 
                    size={20} 
                    color="#FFFFFF" 
                  />
                  <ThemedText style={styles.voiceButtonText}>
                    {isListening ? 'Listening...' : 'Tap to Speak'}
                  </ThemedText>
                </Pressable>
              </Animated.View>
            ) : (
              <View style={styles.mobileVoiceHint}>
                <View style={[styles.hintIconContainer, { backgroundColor: BrandColors.azureBlue + '15' }]}>
                  <Feather name="mic" size={20} color={BrandColors.azureBlue} />
                </View>
                <View style={styles.hintTextContainer}>
                  <ThemedText style={[styles.hintTitle, { color: theme.text }]}>
                    Voice Input Available
                  </ThemedText>
                  <ThemedText style={[styles.hintText, { color: theme.textSecondary }]}>
                    Tap the text field, then tap the microphone on your keyboard to dictate
                  </ThemedText>
                </View>
              </View>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.audioModeContainer}>
          <View style={[styles.audioRecordArea, { backgroundColor: theme.backgroundSecondary }]}>
            <Animated.View style={animatedStyle}>
              <Pressable
                style={[
                  styles.recordButton,
                  { backgroundColor: isRecording ? BrandColors.danger : BrandColors.vividTangerine },
                ]}
                onPress={handleAudioRecordPress}
              >
                <Feather 
                  name={isRecording ? 'square' : 'mic'} 
                  size={32} 
                  color="#FFFFFF" 
                />
              </Pressable>
            </Animated.View>
            
            <ThemedText style={[styles.recordLabel, { color: theme.text }]}>
              {isRecording ? `Recording ${formatDuration(duration)}` : 'Tap to Record Audio Message'}
            </ThemedText>
            
            {isRecording ? (
              <View style={styles.recordingIndicator}>
                <View style={[styles.recordingDot, { backgroundColor: BrandColors.danger }]} />
                <ThemedText style={[styles.recordingText, { color: BrandColors.danger }]}>
                  Tap again to stop
                </ThemedText>
              </View>
            ) : null}
          </View>

          {recordingUri && !isRecording ? (
            <View style={[styles.playbackArea, { backgroundColor: theme.surface }]}>
              <Pressable
                style={[styles.playbackButton, { backgroundColor: BrandColors.emerald }]}
                onPress={handlePlayPress}
              >
                <Feather 
                  name={isPlaying ? 'pause' : 'play'} 
                  size={20} 
                  color="#FFFFFF" 
                />
              </Pressable>
              <View style={styles.playbackInfo}>
                <ThemedText style={[styles.playbackLabel, { color: theme.text }]}>
                  Audio Message Ready
                </ThemedText>
                <ThemedText style={[styles.playbackDuration, { color: theme.textSecondary }]}>
                  Duration: {formatDuration(duration)}
                </ThemedText>
              </View>
              <View style={[styles.readyBadge, { backgroundColor: BrandColors.emerald + '20' }]}>
                <Feather name="check" size={14} color={BrandColors.emerald} />
              </View>
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  modeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  textModeContainer: {
    gap: Spacing.md,
  },
  textInputContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  textInput: {
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  voiceToTextControls: {
    alignItems: 'center',
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  voiceButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  mobileVoiceHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  hintIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintTextContainer: {
    flex: 1,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  hintText: {
    fontSize: 13,
    flex: 1,
  },
  audioModeContainer: {
    gap: Spacing.md,
  },
  audioRecordArea: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
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
  playbackArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
  },
  playbackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbackInfo: {
    flex: 1,
  },
  playbackLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  playbackDuration: {
    fontSize: 12,
    marginTop: 2,
  },
  readyBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
