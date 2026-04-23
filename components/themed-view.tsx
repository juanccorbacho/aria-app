import { View, ViewProps } from 'react-native';

export type ThemedViewProps = ViewProps & { className?: string };

export function ThemedView({ className, style, ...props }: ThemedViewProps) {
  // Using pure NativeWind v4 className
  return <View className={`${className || ''}`} style={style} {...props} />;
}
