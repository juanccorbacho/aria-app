import { useIsDesktop } from "@/hooks/useIsDesktop";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { YStack } from "tamagui";

export default function ProfileScreen(): React.JSX.Element {
  const isDesktop = useIsDesktop();

  return (
    <ThemedView f={1} ai="center" jc="center" w="100%">
      <YStack
        f={1}
        w="100%"
        ai="center"
        jc="center"
        px="$5"
        maxWidth={isDesktop ? "100%" : 720}
        als="center"
      >
        <ThemedText type="title">Perfil</ThemedText>
      </YStack>
    </ThemedView>
  );
}
