import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useTheme } from "@/hooks/useTheme";
import { KeyboardAwareScrollViewCompat } from "./KeyboardAwareScrollViewCompat";
import { Spacing } from "@/constants/theme";

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  hasTabBar?: boolean;
  hasHeader?: boolean;
  keyboardAware?: boolean;
}

export function Screen({
  children,
  scroll = false,
  edges = ["top", "bottom"],
  style,
  contentContainerStyle,
  hasTabBar = true,
  hasHeader = true,
  keyboardAware = false,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  let headerHeight = 0;
  let tabBarHeight = 0;

  try {
    if (hasHeader) {
      headerHeight = useHeaderHeight();
    }
  } catch {
    headerHeight = 0;
  }

  try {
    if (hasTabBar) {
      tabBarHeight = useBottomTabBarHeight();
    }
  } catch {
    tabBarHeight = 0;
  }

  const paddingTop = edges.includes("top")
    ? hasHeader
      ? headerHeight + Spacing.lg
      : insets.top + Spacing.lg
    : 0;

  const paddingBottom = edges.includes("bottom")
    ? hasTabBar
      ? tabBarHeight + Spacing.lg
      : insets.bottom + Spacing.lg
    : 0;

  const paddingLeft = edges.includes("left") ? Spacing.screenPadding : 0;
  const paddingRight = edges.includes("right") ? Spacing.screenPadding : 0;

  const containerPadding = {
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
  };

  if (scroll) {
    const ScrollComponent = keyboardAware
      ? KeyboardAwareScrollViewCompat
      : require("react-native").ScrollView;

    return (
      <ScrollComponent
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
        contentContainerStyle={[containerPadding, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollIndicatorInsets={{ bottom: insets.bottom }}
      >
        {children}
      </ScrollComponent>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundRoot },
        containerPadding,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Screen;
