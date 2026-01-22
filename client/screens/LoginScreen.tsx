import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Dimensions, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { ThemedText } from '@/components/ThemedText';
import { BPButton } from '@/components/BPButton';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { BrandColors, BorderRadius, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('demo@breakpoint.com');
  const [password, setPassword] = useState('demo123');

  const emailFocus = useSharedValue(0);
  const passwordFocus = useSharedValue(0);

  const emailBorderStyle = useAnimatedStyle(() => ({
    borderColor: emailFocus.value === 1 ? BrandColors.azureBlue : theme.border,
    borderWidth: emailFocus.value === 1 ? 2 : 1,
  }));

  const passwordBorderStyle = useAnimatedStyle(() => ({
    borderColor: passwordFocus.value === 1 ? BrandColors.azureBlue : theme.border,
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

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 60,
            paddingBottom: insets.bottom + 40,
          },
        ]}
      >
        <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/breakpoint-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
          <ThemedText style={styles.title}>Breakpoint</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Commercial Pool Systems
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.form}>
          <View style={styles.inputWrapper}>
            <ThemedText style={styles.label}>Email</ThemedText>
            <Animated.View style={[styles.inputContainer, emailBorderStyle]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your email"
                placeholderTextColor={theme.textSecondary}
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
                style={[styles.input, { color: theme.text }]}
                placeholder="Enter your password"
                placeholderTextColor={theme.textSecondary}
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
            style={styles.loginButton}
          >
            Sign In
          </BPButton>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.footer}>
          <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
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
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['4xl'],
  },
  logo: {
    width: width * 0.25,
    height: width * 0.25,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
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
  },
  inputContainer: {
    borderRadius: BorderRadius.sm,
    backgroundColor: '#FFFFFF',
  },
  input: {
    height: Spacing.inputHeight,
    paddingHorizontal: Spacing.lg,
    fontSize: 16,
  },
  loginButton: {
    marginTop: Spacing.lg,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
  },
});
