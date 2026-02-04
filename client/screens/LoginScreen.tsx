import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, Dimensions, Platform, Pressable, Modal, Switch } from 'react-native';
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
import { BubbleBackground } from '@/components/BubbleBackground';
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
  const { login, register, isLoading, selectedRole, rememberMe, setRememberMe, savedEmail, requestPasswordReset } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, [savedEmail]);

  const emailFocus = useSharedValue(0);
  const passwordFocus = useSharedValue(0);
  const nameFocus = useSharedValue(0);

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

  const nameBorderStyle = useAnimatedStyle(() => ({
    borderColor: nameFocus.value === 1 ? roleColor : BrandColors.border,
    borderWidth: nameFocus.value === 1 ? 2 : 1,
  }));

  const handleSubmit = async () => {
    setError(null);
    console.log('[LoginScreen] handleSubmit called');
    console.log('[LoginScreen] API URL:', process.env.EXPO_PUBLIC_API_URL);
    
    if (!email.trim() || !password.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setError('Please enter your email and password');
      return;
    }

    if (isRegisterMode && !name.trim()) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setError('Please enter your name');
      return;
    }

    if (password.length < 6) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setError('Password must be at least 6 characters');
      return;
    }

    let result;
    if (isRegisterMode) {
      result = await register(email, password, name);
    } else {
      result = await login(email, password);
    }

    if (result.success) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      setError(result.error || 'Authentication failed. Please try again.');
    }
  };

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onBack?.();
  };

  const handleQuickAccess = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setError(null);
    
    const devEmail = `dev-${selectedRole}@breakpoint.com`;
    const devPassword = 'devpass123';
    const devName = `Dev ${roleName}`;
    
    let result = await login(devEmail, devPassword);
    
    if (!result.success) {
      result = await register(devEmail, devPassword, devName);
    }
    
    if (result.success) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      setError(result.error || 'Quick access failed. Please try again.');
    }
  };

  const toggleMode = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsRegisterMode(!isRegisterMode);
    setError(null);
  };

  const handleForgotPassword = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setResetEmail(email);
    setResetSuccess(false);
    setShowForgotPassword(true);
  };

  const handlePasswordReset = async () => {
    if (!resetEmail.trim()) {
      return;
    }
    setResetLoading(true);
    const result = await requestPasswordReset(resetEmail);
    setResetLoading(false);
    if (result.success) {
      setResetSuccess(true);
    }
  };

  const handleToggleRememberMe = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setRememberMe(!rememberMe);
  };

  return (
    <BubbleBackground bubbleCount={15}>
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
          <ThemedText style={styles.title}>
            {isRegisterMode ? 'Create Account' : 'Sign In'}
          </ThemedText>
          <View style={[styles.roleBadge, { backgroundColor: roleColor + '30' }]}>
            <ThemedText style={[styles.roleText, { color: roleColor }]}>
              {roleName}
            </ThemedText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
          {isRegisterMode ? (
            <View style={styles.inputWrapper}>
              <ThemedText style={styles.label}>Full Name</ThemedText>
              <Animated.View style={[styles.inputContainer, nameBorderStyle]}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={BrandColors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  onFocus={() => { nameFocus.value = withSpring(1); }}
                  onBlur={() => { nameFocus.value = withSpring(0); }}
                  testID="input-name"
                />
              </Animated.View>
            </View>
          ) : null}

          <View style={styles.inputWrapper}>
            <ThemedText style={styles.label}>
              {selectedRole === 'repair_tech' || selectedRole === 'repair_foreman' ? 'Email or Phone' : 'Email'}
            </ThemedText>
            <Animated.View style={[styles.inputContainer, emailBorderStyle]}>
              <TextInput
                style={styles.input}
                placeholder={selectedRole === 'repair_tech' || selectedRole === 'repair_foreman' 
                  ? "Enter email or phone number" 
                  : "Enter your email"}
                placeholderTextColor={BrandColors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType={selectedRole === 'repair_tech' || selectedRole === 'repair_foreman' ? "default" : "email-address"}
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
                placeholder={isRegisterMode ? 'Create a password (min 6 chars)' : 'Enter your password'}
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

          {!isRegisterMode ? (
            <View style={styles.loginOptionsRow}>
              <Pressable 
                style={styles.rememberMeContainer}
                onPress={handleToggleRememberMe}
                testID="remember-me-toggle"
              >
                <Switch
                  value={rememberMe}
                  onValueChange={setRememberMe}
                  trackColor={{ false: BrandColors.border, true: roleColor + '80' }}
                  thumbColor={rememberMe ? roleColor : '#f4f3f4'}
                  style={styles.switch}
                />
                <ThemedText style={styles.rememberMeText}>Remember Me</ThemedText>
              </Pressable>
              <Pressable onPress={handleForgotPassword} testID="forgot-password-link">
                <ThemedText style={[styles.forgotPasswordText, { color: roleColor }]}>
                  Forgot Password?
                </ThemedText>
              </Pressable>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorContainer}>
              <Feather name="alert-circle" size={16} color={BrandColors.danger} />
              <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
          ) : null}

          <BPButton
            onPress={handleSubmit}
            loading={isLoading}
            fullWidth
            size="large"
            style={[styles.loginButton, { backgroundColor: roleColor }]}
          >
            {isRegisterMode ? `Create ${roleName} Account` : `Sign In as ${roleName}`}
          </BPButton>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.footer}>
          <Pressable onPress={toggleMode} style={styles.toggleButton}>
            <ThemedText style={styles.footerText}>
              {isRegisterMode
                ? 'Already have an account? '
                : "Don't have an account? "}
              <ThemedText style={[styles.footerLink, { color: roleColor }]}>
                {isRegisterMode ? 'Sign In' : 'Create Account'}
              </ThemedText>
            </ThemedText>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).springify()} style={styles.quickAccessSection}>
          <View style={styles.quickAccessDivider}>
            <View style={styles.dividerLine} />
            <ThemedText style={styles.dividerText}>Quick Access</ThemedText>
            <View style={styles.dividerLine} />
          </View>
          <Pressable 
            style={[styles.quickAccessButton, { borderColor: roleColor }]}
            onPress={handleQuickAccess}
          >
            <Feather name="zap" size={18} color={roleColor} />
            <ThemedText style={[styles.quickAccessText, { color: roleColor }]}>
              Dev Login as {roleName}
            </ThemedText>
          </Pressable>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>

      <Modal
        visible={showForgotPassword}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowForgotPassword(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>
                {resetSuccess ? 'Check Your Email' : 'Reset Password'}
              </ThemedText>
              <Pressable 
                onPress={() => setShowForgotPassword(false)}
                style={styles.modalCloseButton}
              >
                <Feather name="x" size={24} color={BrandColors.textPrimary} />
              </Pressable>
            </View>

            {resetSuccess ? (
              <View style={styles.successContainer}>
                <View style={[styles.successIcon, { backgroundColor: roleColor + '20' }]}>
                  <Feather name="mail" size={32} color={roleColor} />
                </View>
                <ThemedText style={styles.successText}>
                  If an account exists with {resetEmail}, you will receive password reset instructions shortly.
                </ThemedText>
                <BPButton
                  onPress={() => setShowForgotPassword(false)}
                  fullWidth
                  style={[styles.modalButton, { backgroundColor: roleColor }]}
                >
                  Back to Login
                </BPButton>
              </View>
            ) : (
              <View>
                <ThemedText style={styles.modalDescription}>
                  Enter your email address and we'll send you instructions to reset your password.
                </ThemedText>
                <View style={styles.modalInputWrapper}>
                  <ThemedText style={styles.label}>Email Address</ThemedText>
                  <View style={styles.modalInputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="Enter your email"
                      placeholderTextColor={BrandColors.textSecondary}
                      value={resetEmail}
                      onChangeText={setResetEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      testID="reset-email-input"
                    />
                  </View>
                </View>
                <BPButton
                  onPress={handlePasswordReset}
                  loading={resetLoading}
                  fullWidth
                  disabled={!resetEmail.trim()}
                  style={[styles.modalButton, { backgroundColor: roleColor }]}
                >
                  Send Reset Link
                </BPButton>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </BubbleBackground>
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
    color: '#FFFFFF',
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.danger + '15',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: BrandColors.danger,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  loginButton: {
    marginTop: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
  },
  toggleButton: {
    padding: Spacing.sm,
  },
  footerText: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  footerLink: {
    fontWeight: '600',
  },
  quickAccessSection: {
    marginTop: Spacing['2xl'],
    alignItems: 'center',
  },
  quickAccessDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BrandColors.border,
  },
  dividerText: {
    paddingHorizontal: Spacing.md,
    fontSize: 12,
    color: BrandColors.textSecondary,
    fontWeight: '600',
  },
  quickAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    gap: Spacing.sm,
  },
  quickAccessText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loginOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
    marginRight: Spacing.xs,
  },
  rememberMeText: {
    fontSize: 14,
    color: BrandColors.textSecondary,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BrandColors.textPrimary,
  },
  modalCloseButton: {
    padding: Spacing.xs,
  },
  modalDescription: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  modalInputWrapper: {
    marginBottom: Spacing.xl,
  },
  modalInputContainer: {
    borderRadius: BorderRadius.sm,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: BrandColors.border,
  },
  modalButton: {
    marginTop: Spacing.sm,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  successText: {
    fontSize: 14,
    color: BrandColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
});
