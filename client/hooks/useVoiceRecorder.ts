import { useState, useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';
import { 
  useAudioRecorder, 
  AudioModule, 
  RecordingPresets,
  useAudioPlayer,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';

export type RecordingStatus = 'idle' | 'recording' | 'stopped' | 'error';

interface UseVoiceRecorderOptions {
  onRecordingComplete?: (uri: string, duration: number) => void;
  onTranscriptionComplete?: (text: string) => void;
}

interface UseVoiceRecorderReturn {
  isRecording: boolean;
  status: RecordingStatus;
  duration: number;
  recordingUri: string | null;
  errorMessage: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => Promise<void>;
  playRecording: () => Promise<void>;
  isPlaying: boolean;
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const player = useAudioPlayer(recordingUri || undefined);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isRecording = audioRecorder.isRecording;

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (player) {
      const handlePlaybackStatus = () => {
        if (player.currentTime >= player.duration && player.duration > 0) {
          setIsPlaying(false);
        }
      };
      
      const interval = setInterval(handlePlaybackStatus, 100);
      return () => clearInterval(interval);
    }
  }, [player]);

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const permissionStatus = await AudioModule.requestRecordingPermissionsAsync();
      if (!permissionStatus.granted) {
        setErrorMessage('Microphone permission is required for voice notes');
        setStatus('error');
        return;
      }

      audioRecorder.record();
      setStatus('recording');
      setDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setErrorMessage('Failed to start recording. Please try again.');
      setStatus('error');
    }
  }, [audioRecorder]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      
      setStatus('stopped');
      
      if (uri) {
        setRecordingUri(uri);
        options.onRecordingComplete?.(uri, duration);
        return uri;
      }

      return null;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setErrorMessage('Failed to save recording. Please try again.');
      setStatus('error');
      return null;
    }
  }, [audioRecorder, duration, options]);

  const cancelRecording = useCallback(async () => {
    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
      }

      setStatus('idle');
      setDuration(0);
      setRecordingUri(null);
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  }, [audioRecorder]);

  const playRecording = useCallback(async () => {
    try {
      if (!recordingUri || !player) {
        return;
      }

      player.play();
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to play recording:', error);
      setIsPlaying(false);
    }
  }, [recordingUri, player]);

  return {
    isRecording,
    status,
    duration,
    recordingUri,
    errorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
    playRecording,
    isPlaying,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
