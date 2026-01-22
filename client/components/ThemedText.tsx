import { Text, type TextProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Typography } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: "display" | "h1" | "h2" | "h3" | "h4" | "body" | "bodyLarge" | "small" | "caption" | "captionSmall" | "link" | "badge" | "button" | "buttonLarge" | "metric" | "metricSmall";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();

  const getColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }

    if (!isDark && lightColor) {
      return lightColor;
    }

    if (type === "link") {
      return theme.link;
    }

    if (type === "caption" || type === "captionSmall") {
      return theme.textSecondary;
    }

    return theme.text;
  };

  const getTypeStyle = () => {
    switch (type) {
      case "display":
        return Typography.display;
      case "h1":
        return Typography.h1;
      case "h2":
        return Typography.h2;
      case "h3":
        return Typography.h3;
      case "h4":
        return Typography.h4;
      case "body":
        return Typography.body;
      case "bodyLarge":
        return Typography.bodyLarge;
      case "small":
        return Typography.small;
      case "caption":
        return Typography.caption;
      case "captionSmall":
        return Typography.captionSmall;
      case "link":
        return Typography.link;
      case "badge":
        return Typography.badge;
      case "button":
        return Typography.button;
      case "buttonLarge":
        return Typography.buttonLarge;
      case "metric":
        return Typography.metric;
      case "metricSmall":
        return Typography.metricSmall;
      default:
        return Typography.body;
    }
  };

  return (
    <Text style={[{ color: getColor() }, getTypeStyle(), style]} {...rest} />
  );
}
