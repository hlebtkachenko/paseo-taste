import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { Icon } from "@getpaseo/plugin/client/ui";
import { useMemo } from "react";
import { Text, View } from "react-native";

export function CustomizeScreen({ theme }: PluginScreenProps) {
  const styles = useMemo(
    () => ({
      screen: {
        flex: 1,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        gap: 12,
        backgroundColor: theme.colors.surface0,
      },
      title: { color: theme.colors.foreground, fontSize: 15, fontWeight: "500" as const },
    }),
    [theme],
  );
  return (
    <View style={styles.screen}>
      <Icon name="Briefcase" size={24} color={theme.colors.foregroundMuted} />
      <Text style={styles.title}>Customize</Text>
    </View>
  );
}
