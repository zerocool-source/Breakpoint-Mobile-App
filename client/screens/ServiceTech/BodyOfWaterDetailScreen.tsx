import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView, TextInput, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import type { BodyOfWater } from '@/lib/serviceTechMockData';

type RootStackParamList = {
  BodyOfWaterDetail: { body: BodyOfWater; propertyName: string };
};

export default function BodyOfWaterDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'BodyOfWaterDetail'>>();
  const { theme } = useTheme();
  
  const { body, propertyName } = route.params;
  const [photos, setPhotos] = useState<string[]>([]);
  const [voiceNote, setVoiceNote] = useState('');
  const maxPhotos = 10;

  const handleAddPhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRecordNote = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleComplete = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={['#3B5998', '#4A69BD', '#5D7ED3']}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerContent}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="chevron-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerText}>
            <View style={styles.headerTitleRow}>
              <ThemedText style={styles.headerIcon}>
                {body.type === 'spa' ? '♨️' : '🏊'}
              </ThemedText>
              <ThemedText style={styles.headerTitle}>{body.name}</ThemedText>
            </View>
            <ThemedText style={styles.headerSubtitle}>{body.location}</ThemedText>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="camera" size={18} color={BrandColors.textPrimary} />
                <ThemedText style={styles.sectionTitle}>Photos</ThemedText>
                <ThemedText style={[styles.photoCount, { color: theme.textSecondary }]}>
                  ({photos.length}/{maxPhotos})
                </ThemedText>
              </View>
              <Pressable style={styles.addPhotoButton} onPress={handleAddPhoto}>
                <Feather name="plus" size={14} color="#FFFFFF" />
                <ThemedText style={styles.addPhotoButtonText}>Add Photo</ThemedText>
              </Pressable>
            </View>
            <View style={[styles.photoPlaceholder, { borderColor: theme.border }]}>
              <Feather name="camera" size={32} color={theme.textSecondary} />
              <ThemedText style={[styles.photoPlaceholderText, { color: theme.textSecondary }]}>
                Tap "Add Photo" to capture images
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Feather name="mic" size={18} color={BrandColors.danger} />
                <ThemedText style={styles.sectionTitle}>Voice Notes</ThemedText>
              </View>
            </View>
            <Pressable style={styles.recordButton} onPress={handleRecordNote}>
              <Feather name="mic" size={16} color="#FFFFFF" />
              <ThemedText style={styles.recordButtonText}>Record Note</ThemedText>
            </Pressable>
            <TextInput
              style={[styles.voiceNoteInput, { 
                backgroundColor: theme.backgroundSecondary,
                color: theme.text,
                borderColor: theme.border,
              }]}
              placeholder="Your voice note will appear here, or type manually..."
              placeholderTextColor={theme.textSecondary}
              value={voiceNote}
              onChangeText={setVoiceNote}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <BPButton
          variant="success"
          onPress={handleComplete}
          fullWidth
          icon="check"
        >
          Complete {body.name}
        </BPButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerIcon: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.screenPadding,
  },
  section: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  photoCount: {
    fontSize: 14,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.azureBlue,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  addPhotoButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  photoPlaceholder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderText: {
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.azureBlue,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  voiceNoteInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 15,
    minHeight: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.screenPadding,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
});
