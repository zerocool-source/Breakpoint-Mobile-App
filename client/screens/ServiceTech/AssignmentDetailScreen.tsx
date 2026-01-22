import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { BubbleBackground } from '@/components/BubbleBackground';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';
import type { Assignment } from '@/lib/serviceTechMockData';

type ServiceTechStackParamList = {
  AssignmentDetail: { assignment: Assignment };
};

export default function AssignmentDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<ServiceTechStackParamList, 'AssignmentDetail'>>();
  const { theme } = useTheme();

  const { assignment } = route.params;
  const [completionNotes, setCompletionNotes] = useState('');

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.goBack();
  };

  const handleComplete = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    navigation.goBack();
  };

  const handleDidNotComplete = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    navigation.goBack();
  };

  const handleNeedAssistance = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleAddPhoto = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Feather name="chevron-left" size={28} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerText}>
            <ThemedText style={styles.headerTitle}>Assignment Details</ThemedText>
            <ThemedText style={styles.headerSubtitle}>{assignment.propertyName}</ThemedText>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.cardTitle}>{assignment.type}</ThemedText>
            <ThemedText style={[styles.cardNotes, { color: BrandColors.azureBlue }]}>
              {assignment.notes}
            </ThemedText>
            <View style={styles.cardMeta}>
              <View style={styles.metaRow}>
                <Feather name="clock" size={14} color={theme.textSecondary} />
                <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                  Created {assignment.assignedAt}
                </ThemedText>
              </View>
              <View style={styles.metaRow}>
                <Feather name="user" size={14} color={theme.textSecondary} />
                <ThemedText style={[styles.metaText, { color: theme.textSecondary }]}>
                  Assigned by {assignment.assignedBy}
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.sectionTitle}>Attached by Supervisor</ThemedText>
            <View style={styles.attachmentContainer}>
              <Image
                source={require('../../../assets/images/avatar-supervisor.png')}
                style={styles.attachmentImage}
                contentFit="cover"
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <ThemedText style={styles.sectionTitle}>Completion Notes</ThemedText>
            <TextInput
              style={[styles.notesInput, { backgroundColor: theme.backgroundRoot, color: theme.text }]}
              placeholder="Add notes about the completed work..."
              placeholderTextColor={theme.textSecondary}
              value={completionNotes}
              onChangeText={setCompletionNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <Pressable 
            style={[styles.addPhotoCard, { backgroundColor: theme.surface }]}
            onPress={handleAddPhoto}
          >
            <Feather name="camera" size={20} color={theme.textSecondary} />
            <ThemedText style={[styles.addPhotoText, { color: theme.text }]}>Add Photos</ThemedText>
            <Feather name="chevron-right" size={20} color={theme.textSecondary} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500).springify()} style={styles.buttonContainer}>
          <BPButton
            onPress={handleComplete}
            fullWidth
            icon="check"
            style={styles.completeButton}
          >
            Complete
          </BPButton>

          <BPButton
            onPress={handleDidNotComplete}
            variant="secondary"
            fullWidth
            icon="x"
            style={styles.didNotCompleteButton}
          >
            Did Not Complete
          </BPButton>

          <Pressable 
            style={styles.needAssistanceButton}
            onPress={handleNeedAssistance}
          >
            <Feather name="alert-triangle" size={18} color={BrandColors.vividTangerine} />
            <ThemedText style={styles.needAssistanceText}>Need Assistance</ThemedText>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4A69BD',
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
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
    gap: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  cardNotes: {
    fontSize: 16,
    marginBottom: Spacing.md,
  },
  cardMeta: {
    gap: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metaText: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  attachmentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  attachmentImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
  },
  notesInput: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: 15,
  },
  addPhotoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  addPhotoText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: Spacing.md,
  },
  buttonContainer: {
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  completeButton: {
    backgroundColor: BrandColors.emerald,
  },
  didNotCompleteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  needAssistanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: BrandColors.vividTangerine,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  needAssistanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: BrandColors.vividTangerine,
  },
});
