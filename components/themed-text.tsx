import { Text, TextProps } from 'react-native';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'monoLabel';
  className?: string;
};

export function ThemedText({ type = 'default', className, style, ...props }: ThemedTextProps) {
  let typeStyles = '';
  switch (type) {
    case 'title':
      typeStyles = 'text-5xl font-bold tracking-tight';
      break;
    case 'subtitle':
      typeStyles = 'text-2xl font-semibold tracking-tight';
      break;
    case 'defaultSemiBold':
      typeStyles = 'text-base font-semibold';
      break;
    case 'link':
      typeStyles = 'text-base underline';
      break;
    case 'monoLabel':
      typeStyles = 'text-xs uppercase tracking-wider font-mono';
      break;
    default:
      typeStyles = 'text-base';
  }

  return (
    <Text
      className={`text-white ${typeStyles} ${className || ''}`}
      style={style}
      {...props}
    />
  );
}
