declare module '*.png' {
  const content: number;
  export default content;
}

declare module '*.jpg' {
  const content: number;
  export default content;
}

declare module '*.jpeg' {
  const content: number;
  export default content;
}

declare module '*.gif' {
  const content: number;
  export default content;
}

declare module '*.webp' {
  const content: number;
  export default content;
}

declare module '@react-native-community/datetimepicker' {
  import { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export interface DateTimePickerEvent {
    type: string;
    nativeEvent: {
      timestamp?: number;
      utcOffset?: number;
    };
  }

  export interface DateTimePickerProps extends ViewProps {
    value: Date;
    mode?: 'date' | 'time' | 'datetime' | 'countdown';
    display?: 'default' | 'spinner' | 'calendar' | 'clock' | 'compact' | 'inline';
    onChange?: (event: DateTimePickerEvent, date?: Date) => void;
    maximumDate?: Date;
    minimumDate?: Date;
    timeZoneName?: string;
    timeZoneOffsetInMinutes?: number;
    timeZoneOffsetInSeconds?: number;
    dayOfWeekFormat?: string;
    dateFormat?: string;
    firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    textColor?: string;
    accentColor?: string;
    themeVariant?: 'light' | 'dark';
    locale?: string;
    is24Hour?: boolean;
    minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
    disabled?: boolean;
    positiveButton?: { label?: string; textColor?: string };
    negativeButton?: { label?: string; textColor?: string };
    neutralButton?: { label?: string; textColor?: string };
  }

  const DateTimePicker: ComponentType<DateTimePickerProps>;
  export default DateTimePicker;
}
