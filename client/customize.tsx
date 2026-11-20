import type { PluginScreenProps } from "@getpaseo/plugin/client";
import { ExternalLink, Icon, SettingsCard, SettingsSwitch } from "@getpaseo/plugin/client/ui";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import {
  anthropicFontSupported,
  conductorSpacingSupported,
  readAnthropicFont,
  readConductorSpacing,
  readThinIcons,
  setAnthropicFont,
  setConductorSpacing,
  setThinIcons,
  thinIconsSupported,
} from "./web";

const REPO_URL = "https://github.com/hlebtkachenko/paseo-taste";

// Same layout and sizes as Paseo's Schedules empty state (packages/app/src/screens/schedules-screen.tsx):
// centered column, 20px muted icon, 14px title and description, built-in "See docs" link.
export function CustomizeScreen({ theme }: PluginScreenProps) {
  const [thinIcons, setThinIconsState] = useState(readThinIcons);
  const [conductorSpacing, setConductorSpacingState] = useState(readConductorSpacing);
  const [anthropicFont, setAnthropicFontState] = useState(readAnthropicFont);
  const styles = useMemo(
    () => ({
      screen: {
        flex: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        padding: 24,
        backgroundColor: theme.colors.surface0,
      },
      content: { alignItems: "center" as const, gap: 16, maxWidth: 420, width: "100%" as const },
      textStack: { alignItems: "center" as const, gap: 8 },
      title: { color: theme.colors.foreground, fontSize: 14, textAlign: "center" as const },
      description: { color: theme.colors.foregroundMuted, fontSize: 14, textAlign: "center" as const },
      settings: { width: "100%" as const },
    }),
    [theme],
  );
  const anySetting = thinIconsSupported || conductorSpacingSupported || anthropicFontSupported;
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Icon name="Briefcase" size={20} color={theme.colors.foregroundMuted} />
        <View style={styles.textStack}>
          <Text style={styles.title}>Customize</Text>
          <Text style={styles.description}>Give Paseo some Taste.</Text>
          <ExternalLink href={REPO_URL} accessibilityLabel="See docs on GitHub">
            See docs
          </ExternalLink>
        </View>
        {anySetting ? (
          <View style={styles.settings}>
            <SettingsCard>
              {thinIconsSupported ? (
                <SettingsSwitch
                  label="Thin icons"
                  value={thinIcons}
                  onValueChange={(next) => {
                    setThinIconsState(next);
                    setThinIcons(next);
                  }}
                />
              ) : null}
              {conductorSpacingSupported ? (
                <SettingsSwitch
                  label="Conductor spacing"
                  value={conductorSpacing}
                  onValueChange={(next) => {
                    setConductorSpacingState(next);
                    setConductorSpacing(next);
                  }}
                />
              ) : null}
              {anthropicFontSupported ? (
                <SettingsSwitch
                  label="Anthropic Sans"
                  value={anthropicFont}
                  onValueChange={(next) => {
                    setAnthropicFontState(next);
                    setAnthropicFont(next);
                  }}
                />
              ) : null}
            </SettingsCard>
          </View>
        ) : null}
      </View>
    </View>
  );
}
