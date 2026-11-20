import type { PluginClientContext, PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { CustomizeScreen } from "./client/customize";
import { NewWorkspaceScreen } from "./client/new-workspace";
import {
  applyAnthropicFont,
  applyConductorSpacing,
  applyThinIcons,
  readAnthropicFont,
  readConductorSpacing,
  readThinIcons,
} from "./client/web";

function CustomizeItem({ currentScreen, openScreen }: PluginSidebarItemProps) {
  return (
    <SidebarRow
      icon="Briefcase"
      active={currentScreen?.screenId === "customize"}
      onPress={() => openScreen({ screenId: "customize" })}
    />
  );
}

export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: "customize", title: "Customize", Component: CustomizeScreen });
  client.addSidebarHeaderItem({ id: "customize", title: "Customize", Component: CustomizeItem });
  client.addScreen({ id: "new-workspace", title: "New workspace", Component: NewWorkspaceScreen });
  applyThinIcons(readThinIcons());
  applyConductorSpacing(readConductorSpacing());
  applyAnthropicFont(readAnthropicFont());
  return () => {
    applyAnthropicFont(false);
    applyThinIcons(false);
    applyConductorSpacing(false);
  };
}
