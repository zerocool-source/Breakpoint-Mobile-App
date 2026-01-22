declare module '@react-native-picker/picker' {
  import { ComponentType } from 'react';
  import { ViewProps, StyleProp, ViewStyle, TextStyle } from 'react-native';

  export interface PickerItemProps {
    label: string;
    value: any;
    color?: string;
    enabled?: boolean;
    style?: StyleProp<TextStyle>;
  }

  export interface PickerProps extends ViewProps {
    selectedValue?: any;
    onValueChange?: (value: any, index: number) => void;
    enabled?: boolean;
    mode?: 'dialog' | 'dropdown';
    prompt?: string;
    style?: StyleProp<ViewStyle>;
    itemStyle?: StyleProp<TextStyle>;
    dropdownIconColor?: string;
    dropdownIconRippleColor?: string;
    numberOfLines?: number;
  }

  export const Picker: ComponentType<PickerProps> & {
    Item: ComponentType<PickerItemProps>;
  };
}
