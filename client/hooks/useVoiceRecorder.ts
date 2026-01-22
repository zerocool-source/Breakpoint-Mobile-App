import { useState, useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { 
  useAudioRecorder, 
  useAudioPlayer, 
  RecordingPresets,
  requestRecordingPermissionsAsync,
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
  const [isRecording, setIsRecording] = useState(false);

  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const player = useAudioPlayer(recordingUri ? { uri: recordingUri } : null);

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (player && player.playing === false && isPlaying) {
      setIsPlaying(false);
    }
  }, [player?.playing, isPlaying]);

  const startRecording = useCallback(async () => {
    try {
      setErrorMessage(null);
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      const permissionResult = await requestRecordingPermissionsAsync();
      if (!permissionResult.granted) {
        setErrorMessage('Microphone permission is required for voice notes');
        setStatus('error');
        return;
      }

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      
      setStatus('recording');
      setIsRecording(true);
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
      
      setIsRecording(false);
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
      setIsRecording(false);
      return null;
    }
  }, [audioRecorder, duration, options]);

  const cancelRecording = useCallback(async () => {
    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      if (isRecording) {
        await audioRecorder.stop();
      }

      setIsRecording(false);
      setStatus('idle');
      setDuration(0);
      setRecordingUri(null);
    } catch (error) {
      console.error('Failed to cancel recording:', error);
    }
  }, [audioRecorder, isRecording]);

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
