import { GetProps, Text as TamaguiText, styled } from 'tamagui';

export const ThemedText = styled(TamaguiText, {
  fontFamily: '$body',
  color: '$color',

  variants: {
    type: {
      default: {
        fontSize: '$3', // 16px
        lineHeight: '$5', // 1.4
        letterSpacing: '$2', // -0.14
        fontWeight: '$4', // 400
      },
      title: {
        fontFamily: '$heading',
        fontSize: '$9', // 64px
        lineHeight: '$2', // 1.1
        letterSpacing: '$4', // -0.96
        fontWeight: '$8', // 700
      },
      defaultSemiBold: {
        fontSize: '$3',
        lineHeight: '$5',
        letterSpacing: '$2',
        fontWeight: '$6', // 480 or 540 per Figma spec
      },
      subtitle: {
        fontFamily: '$heading',
        fontSize: '$7', // 26px
        lineHeight: '$4', // 1.35
        letterSpacing: '$3', // -0.26
        fontWeight: '$7', // 540
      },
      link: {
        fontSize: '$3',
        lineHeight: '$5',
        color: '$color',
        textDecorationLine: 'underline',
      },
      monoLabel: {
        fontFamily: '$mono',
        fontSize: '$4', // 18px
        lineHeight: '$3', // 1.3
        letterSpacing: '$1', // 0.54
        fontWeight: '$1', // 400
        textTransform: 'uppercase',
      },
    },
  } as const,

  defaultVariants: {
    type: 'default',
  },
});

export type ThemedTextProps = GetProps<typeof ThemedText>;
