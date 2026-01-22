import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/ThemedText';
import { BrandColors, Spacing } from '@/constants/theme';

interface HeaderTitleProps {
  title: string;
}

export function HeaderTitle({ title }: HeaderTitleProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/breakpoint-logo.png')}
        style={styles.icon}
        contentFit="contain"
      />
      <ThemedText style={styles.title}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: BrandColors.azureBlue,
  },
});
