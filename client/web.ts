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

const CONDUCTOR_SPACING_STYLE_ID = "taste-conductor-spacing";
const CONDUCTOR_SPACING_KEY = "taste:conductor-spacing";

// Conductor's sidebar and small-control metrics. Targets are Paseo testIDs (data-testid on web) and
// RN Web's `dir="auto"` on Text; `!important` because Paseo's atomic classes have the same specificity.
const NAV_SCROLL = '[data-testid="sidebar-nav-scroll"]';
const NAV_BUTTON = '[role="button"][data-testid]:not([data-testid="sidebar-close"])';
const NAV = `${NAV_SCROLL} ${NAV_BUTTON}`;
const SECTION_HEADERS = [
  // "Workspaces" has no testID: its title is followed by the actions holding this menu.
  'div:has(> [dir="auto"] + * [data-testid="sidebar-display-preferences-menu"])',
  'div:has(> [data-testid="sidebar-pinned-section-header"])',
];
const ROWS = ['[data-testid^="sidebar-project-row-"]', '[data-testid^="sidebar-workspace-row-"]'];
const ICON_BUTTONS = [
  '[data-testid="sidebar-display-preferences-menu"]',
  '[data-testid^="sidebar-project-new-worktree-"]',
  '[data-testid^="sidebar-project-kebab-"]',
  '[data-testid^="sidebar-workspace-archive-button-"]',
  '[data-testid^="sidebar-workspace-kebab-"]',
];
const HEADER = '[data-testid="composer-dock-header"]';

const within = (selectors: string[], descendant: string) =>
  selectors.map((selector) => `${selector} ${descendant}`).join(",");

const CONDUCTOR_SPACING_CSS = [
  `${NAV}{height:32px!important;min-height:32px!important;padding:6px!important;gap:8px!important;align-items:center!important}`,
  `${NAV_SCROLL} div:has(> ${NAV_BUTTON}){min-height:32px!important;border-radius:6px!important}`,
  `${NAV} .lucide{width:14px!important;height:14px!important}`,
  `${NAV} > [dir="auto"]{font-size:14px!important;font-weight:400!important;line-height:20px!important}`,
  `${SECTION_HEADERS.join(",")}{height:28px!important;min-height:28px!important;padding:0 6px!important}`,
  `${within(SECTION_HEADERS, '[dir="auto"]')}{font-size:12px!important;font-weight:600!important;line-height:16px!important}`,
  `${ROWS.join(",")}{height:36px!important;min-height:36px!important;padding:6px!important;border-radius:6px!important}`,
  `${within(ROWS, ".lucide")}{width:12px!important;height:12px!important}`,
  `${ROWS[0]} [dir="auto"]:not([data-testid="project-icon-only"] *),[data-testid^="sidebar-workspace-title-"]{font-size:14px!important;font-weight:600!important;line-height:20px!important}`,
  `${ICON_BUTTONS.join(",")}{width:24px!important;height:24px!important;border-radius:6px!important}`,
  `${within(ICON_BUTTONS, ".lucide")}{width:12px!important;height:12px!important}`,
  `${HEADER} div:has(> [data-testid="menu-button"]){gap:12px!important}`,
  `${HEADER} [role="button"] .lucide{width:16px!important;height:16px!important}`,
].join("");

export function readConductorSpacing(): boolean {
  if (!isWeb) return false;
  try {
    return localStorage.getItem(CONDUCTOR_SPACING_KEY) !== "off";
  } catch {
    return true;
  }
}

export function applyConductorSpacing(enabled: boolean): void {
  if (!isWeb) return;
  const existing = document.getElementById(CONDUCTOR_SPACING_STYLE_ID);
  if (!enabled) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const style = document.createElement("style");
  style.id = CONDUCTOR_SPACING_STYLE_ID;
  style.textContent = CONDUCTOR_SPACING_CSS;
  document.head.appendChild(style);
}

export function setConductorSpacing(enabled: boolean): void {
  if (!isWeb) return;
  try {
    localStorage.setItem(CONDUCTOR_SPACING_KEY, enabled ? "on" : "off");
  } catch {
    // Storage unavailable: the change still applies for this session.
  }
  applyConductorSpacing(enabled);
}

export const conductorSpacingSupported = isWeb;

const ANTHROPIC_FONT_STYLE_ID = "taste-anthropic-font";
const ANTHROPIC_FONT_KEY = "taste:anthropic-font";

// Paseo's web build points all UI text at `--paseo-ui-font`, set inline on <html> from
// Settings → Appearance (packages/app/src/appearance/apply-root-font.web.ts). An `!important`
// declaration beats that inline value; code surfaces keep their mono font. The font must be
// installed on the machine.
const ANTHROPIC_FONT_CSS =
  ':root{--paseo-ui-font:"Anthropic Sans", system-ui, -apple-system, sans-serif !important}';

export function readAnthropicFont(): boolean {
  if (!isWeb) return false;
  try {
    return localStorage.getItem(ANTHROPIC_FONT_KEY) === "on";
  } catch {
    return false;
  }
}

export function applyAnthropicFont(enabled: boolean): void {
  if (!isWeb) return;
  const existing = document.getElementById(ANTHROPIC_FONT_STYLE_ID);
  if (!enabled) {
    existing?.remove();
    return;
  }
  if (existing) return;
  const style = document.createElement("style");
  style.id = ANTHROPIC_FONT_STYLE_ID;
  style.textContent = ANTHROPIC_FONT_CSS;
  document.head.appendChild(style);
}

export function setAnthropicFont(enabled: boolean): void {
  if (!isWeb) return;
  try {
    localStorage.setItem(ANTHROPIC_FONT_KEY, enabled ? "on" : "off");
  } catch {
    // Storage unavailable: the change still applies for this session.
  }
  applyAnthropicFont(enabled);
}

export const anthropicFontSupported = isWeb;
