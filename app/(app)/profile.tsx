import { useIsDesktop } from "@/hooks/useIsDesktop";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { View } from "react-native";

export default function ProfileScreen(): React.JSX.Element {
  const isDesktop = useIsDesktop();

  return (
    <ThemedView className="flex-1 items-center justify-center w-full bg-[#0A0A0A]">
      <View
        className="flex-1 w-full items-center justify-center px-5 self-center"
        style={{ maxWidth: isDesktop ? "100%" : 720 }}
      >
        <ThemedText type="title">Perfil</ThemedText>
      </View>
    </ThemedView>
  );
}
