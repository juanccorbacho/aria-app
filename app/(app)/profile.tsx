import { StyleSheet, Text, View } from "react-native";

import { useIsDesktop } from "@/hooks/useIsDesktop";

export default function ProfileScreen(): React.JSX.Element {
  const isDesktop = useIsDesktop();

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.wrapper,
          isDesktop ? styles.wrapperDesktop : styles.wrapperMobile,
        ]}
      >
        <Text style={styles.text}>Perfil</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: "100%",
    alignItems: "stretch",
    justifyContent: "center",
  },
  wrapper: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  wrapperDesktop: {
    width: "100%",
  },
  wrapperMobile: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
  },
});
