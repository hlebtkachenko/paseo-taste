import type { PluginClientContext, PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { CustomizeScreen } from "./client/customize";
import { NewWorkspaceScreen } from "./client/new-workspace";
import {
  applyConductorSpacing,
  applyThinIcons,
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

function NewWorkspaceItem({ currentScreen, openScreen }: PluginSidebarItemProps) {
  return (
    <SidebarRow
      icon="Plus"
      active={currentScreen?.screenId === "new-workspace"}
      onPress={() => openScreen({ screenId: "new-workspace" })}
    />
  );
}

export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: "customize", title: "Customize", Component: CustomizeScreen });
  client.addSidebarHeaderItem({ id: "customize", title: "Customize", Component: CustomizeItem });
  client.addScreen({ id: "new-workspace", title: "New workspace", Component: NewWorkspaceScreen });
  client.addSidebarHeaderItem({
    id: "new-workspace",
    title: "New workspace",
    Component: NewWorkspaceItem,
  });
  applyThinIcons(readThinIcons());
  applyConductorSpacing(readConductorSpacing());
  return () => {
    applyThinIcons(false);
    applyConductorSpacing(false);
  };
}
