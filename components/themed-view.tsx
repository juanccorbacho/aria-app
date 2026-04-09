import { GetProps, View as TamaguiView, styled } from 'tamagui';

export const ThemedView = styled(TamaguiView, {
  backgroundColor: '$background',
});

export type ThemedViewProps = GetProps<typeof ThemedView>;
