import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { ExternalLink, Icon, SettingsCard, SettingsSwitch } from "@getpaseo/plugin/client/ui";
import { useMemo, useState } from "react";
import { readThinIcons, setThinIcons, thinIconsSupported } from "./web";
import { Text, View } from "react-native";

const REPO_URL = "https://github.com/hlebtkachenko/paseo-taste";

export function CustomizeScreen({ theme }: PluginScreenProps) {
  const [thinIcons, setThinIconsState] = useState(readThinIcons);
  const styles = useMemo(
    () => ({
      screen: {
        flex: 1,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: theme.colors.surface0,
      },
      title: {
        marginTop: 12,
        color: theme.colors.foreground,
        fontSize: 15,
        fontWeight: "500" as const,
      },
      description: { marginTop: 6, color: theme.colors.foregroundMuted, fontSize: 14 },
      settings: { marginTop: 24, width: 360, maxWidth: "100%" as const },
      linkText: { marginTop: 6, color: theme.colors.foregroundMuted, fontSize: 13 },
    }),
    [theme],
  );
  return (
    <View style={styles.screen}>
      <Icon name="Briefcase" size={24} color={theme.colors.foregroundMuted} />
      <Text style={styles.title}>Customize</Text>
      <Text style={styles.description}>Give Paseo some Taste.</Text>
      <ExternalLink href={REPO_URL} accessibilityLabel="See docs on GitHub">
        <Text style={styles.linkText}>See docs</Text>
      </ExternalLink>
      {thinIconsSupported ? (
        <View style={styles.settings}>
          <SettingsCard>
            <SettingsSwitch
              label="Thin icons"
              value={thinIcons}
              onValueChange={(next) => {
                setThinIconsState(next);
                setThinIcons(next);
              }}
            />
          </SettingsCard>
        </View>
      ) : null}
    </View>
  );
}
