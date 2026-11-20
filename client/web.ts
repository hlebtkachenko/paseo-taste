import { Platform } from "react-native";

// This plugin typechecks without the DOM library. Declare only what this module uses.
interface StyleElement {
  id: string;
  textContent: string | null;
  remove(): void;
}
declare const document: {
  getElementById(id: string): StyleElement | null;
  createElement(tag: "style"): StyleElement;
  head: { appendChild(node: StyleElement): unknown };
};
declare const localStorage: {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

const THIN_ICONS_STYLE_ID = "taste-thin-icons";
const THIN_ICONS_KEY = "taste:thin-icons";

// Conductor's icon rule: every Lucide icon drawn with a 1px line at any size.
// Paseo's icons carry the same `lucide` class; their children also set stroke-width, so they are matched too.
const THIN_ICONS_CSS =
  ".lucide,.lucide *{stroke-width:1px}.lucide *{vector-effect:non-scaling-stroke}";

const isWeb = Platform.OS === "web";

export function readThinIcons(): boolean {
  if (!isWeb) return false;
  try {
    return localStorage.getItem(THIN_ICONS_KEY) !== "off";
  } catch {
    return true;
  }
}

export function applyThinIcons(enabled: boolean): void {
  if (!isWeb) return;
  const existing = document.getElementById(THIN_ICONS_STYLE_ID);
  if (!enabled) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const style = document.createElement("style");
  style.id = THIN_ICONS_STYLE_ID;
  style.textContent = THIN_ICONS_CSS;
  document.head.appendChild(style);
}

export function setThinIcons(enabled: boolean): void {
  if (!isWeb) return;
  try {
    localStorage.setItem(THIN_ICONS_KEY, enabled ? "on" : "off");
  } catch {
    // Storage unavailable: the change still applies for this session.
  }
  applyThinIcons(enabled);
}

export const thinIconsSupported = isWeb;
