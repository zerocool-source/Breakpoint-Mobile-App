import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Dimensions, Alert, Platform, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useAuth, UserRole } from '@/context/AuthContext';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

const roleNames: Record<UserRole, string> = {
  service_tech: 'Service Technician',
  supervisor: 'Supervisor',
  repair_tech: 'Repair Technician',
  repair_foreman: 'Repair Foreman',
};

const roleColors: Record<UserRole, string> = {
  service_tech: BrandColors.azureBlue,
  supervisor: BrandColors.tropicalTeal,
  repair_tech: BrandColors.azureBlue,
  repair_foreman: BrandColors.vividTangerine,
};

interface LoginScreenProps {
  onBack?: () => void;
}

export default function LoginScreen({ onBack }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const { login, isLoading, selectedRole } = useAuth();

  const [email, setEmail] = useState('demo@breakpoint.com');
  const [password, setPassword] = useState('demo123');

  const emailFocus = useSharedValue(0);
  const passwordFocus = useSharedValue(0);

  const roleColor = selectedRole ? roleColors[selectedRole] : BrandColors.azureBlue;
  const roleName = selectedRole ? roleNames[selectedRole] : 'User';

  const emailBorderStyle = useAnimatedStyle(() => ({
    borderColor: emailFocus.value === 1 ? roleColor : BrandColors.border,
    borderWidth: emailFocus.value === 1 ? 2 : 1,
  }));

  const passwordBorderStyle = useAnimatedStyle(() => ({
    borderColor: passwordFocus.value === 1 ? roleColor : BrandColors.border,
    borderWidth: passwordFocus.value === 1 ? 2 : 1,
  }));

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    const success = await login(email, password);
    if (success) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('Error', 'Invalid credentials. Please try again.');
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onBack?.();
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        {onBack ? (
          <Animated.View entering={FadeInDown.delay(50).springify()}>
            <Pressable onPress={handleBack} style={styles.backButton}>
              <Feather name="arrow-left" size={24} color={BrandColors.azureBlue} />
              <ThemedText style={styles.backText}>Change Role</ThemedText>
            </Pressable>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/breakpoint-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText style={styles.title}>Sign In</ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '30' }]}>
            <ThemedText style={[styles.roleText, { color: roleColor }]}>
              {roleName}
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
          <View style={styles.inputWrapper}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <Animated.View style={[styles.inputContainer, emailBorderStyle]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={BrandColors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => { emailFocus.value = withSpring(1); }}
                onBlur={() => { emailFocus.value = withSpring(0); }}
                testID="input-email"
              />
            </Animated.View>
          </View>

          <View style={styles.inputWrapper}>
            <ThemedText style={styles.label}>Password</ThemedText>
            <Animated.View style={[styles.inputContainer, passwordBorderStyle]}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={BrandColors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => { passwordFocus.value = withSpring(1); }}
                onBlur={() => { passwordFocus.value = withSpring(0); }}
                testID="input-password"
              />
            </Animated.View>
          </View>

          <BPButton
            onPress={handleLogin}
            loading={isLoading}
            fullWidth
            size="large"
            style={[styles.loginButton, { backgroundColor: roleColor }]}
          >
            Sign In as {roleName}
          </BPButton>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.footer}>
          <ThemedText style={styles.footerText}>
            Demo credentials pre-filled - just tap Sign In
          </ThemedText>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BrandColors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  backText: {
    fontSize: 16,
    color: BrandColors.azureBlue,
    marginLeft: Spacing.sm,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logo: {
    width: width * 0.2,
    height: width * 0.2,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: BrandColors.textPrimary,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    marginBottom: Spacing['3xl'],
  },
  inputWrapper: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    color: BrandColors.textSecondary,
  },
  inputContainer: {
    borderRadius: BorderRadius.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  input: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
    color: BrandColors.textPrimary,
  },
  loginButton: {
    marginTop: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: BrandColors.textSecondary,
  },
});
