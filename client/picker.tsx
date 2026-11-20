import type { PluginTheme } from "@getpaseo/plugin";
import { Modal, ScrollView } from "@getpaseo/plugin/client/ui";
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

export interface PickerOption {
  id: string;
  label: string;
  description?: string;
}

// Tuning knobs for the chip and its option list.
const CHIP_HEIGHT = 28;
const CHIP_PADDING_X = 8;
const CHIP_GAP = 6;
const CHIP_RADIUS = 6;
const CHIP_FONT_SIZE = 13;
const ROW_PADDING_Y = 8;
const ROW_PADDING_X = 12;
const ROW_RADIUS = 6;

/** A chip showing the current value; pressing it lists the options in a modal. */
export function Picker({
  theme,
  title,
  icon,
  value,
  selectedId,
  options,
  onSelect,
  disabled,
}: {
  theme: PluginTheme;
  /** Field name: modal title and accessibility label. */
  title: string;
  icon: ReactNode;
  value: string;
  selectedId: string | null;
  options: readonly PickerOption[];
  onSelect(id: string): void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const styles = useMemo(
    () => ({
      chip: {
        flexDirection: "row" as const,
        alignItems: "center" as const,
        gap: CHIP_GAP,
        height: CHIP_HEIGHT,
        paddingHorizontal: CHIP_PADDING_X,
        borderRadius: CHIP_RADIUS,
        maxWidth: "100%" as const,
      },
      chipText: { color: theme.colors.foregroundMuted, fontSize: CHIP_FONT_SIZE, flexShrink: 1 },
      row: {
        paddingVertical: ROW_PADDING_Y,
        paddingHorizontal: ROW_PADDING_X,
        borderRadius: ROW_RADIUS,
      },
      rowLabel: { color: theme.colors.foreground, fontSize: 14 },
      rowDescription: { color: theme.colors.foregroundMuted, fontSize: 12, marginTop: 2 },
    }),
    [theme],
  );
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        disabled={disabled || options.length === 0}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.chip,
          pressed ? { backgroundColor: theme.colors.surface2 } : null,
          disabled ? { opacity: 0.5 } : null,
        ]}
      >
        {icon}
        <Text style={styles.chipText} numberOfLines={1}>
          {value}
        </Text>
      </Pressable>
      <Modal title={title} open={open} onOpenChange={setOpen}>
        <Modal.Content scrollable={false}>
          <ScrollView>
            {options.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                onPress={() => {
                  setOpen(false);
                  onSelect(option.id);
                }}
                style={({ pressed }) => [
                  styles.row,
                  pressed || option.id === selectedId
                    ? { backgroundColor: theme.colors.surface2 }
                    : null,
                ]}
              >
                <View>
                  <Text style={styles.rowLabel}>{option.label}</Text>
                  {option.description ? (
                    <Text style={styles.rowDescription}>{option.description}</Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Modal.Content>
      </Modal>
    </>
  );
}
