# AGENTS.md

Instructions for agents working in this repo. Keep this file current when the layout, commands or rules change.

## Project

| | |
|---|---|
| Name | Taste |
| Tagline | Give Paseo some Taste. |
| Type | Plugin for [Paseo](https://paseo.sh) |
| Plugin ID | `taste` |
| Repo | https://github.com/hlebtkachenko/paseo-taste |
| License | MIT |
| Paseo | `>=0.17.0-beta.1` (`requirements` in `paseo-plugin.json`) |
| Owner | Hleb Tkachenko: decides scope, features and wording |

## Status

First screen: "Customize" (sidebar item with a briefcase icon; page shows the icon, title, tagline, a "See docs" link to the repo, and a "Thin icons" switch). Thin icons: `client/web.ts` injects Conductor's rule (`.lucide` stroke 1px, non-scaling) on desktop/web; on by default, stored per device in localStorage; removed on plugin cleanup. Second screen: "New workspace" (`client/new-workspace.tsx`, sidebar item with a plus icon), built on `getPaseoClient`: Project, Host and Isolation pickers, a prompt, Provider, Model, Thinking and Mode pickers, and Create, which calls `workspaces.create` with a first agent and opens the new workspace. The `paseo plugin init` greeting RPC is still in `server/` and `shared/`, unused by the client. Scope is not decided: do not add features or write descriptions of what Taste does without Hleb.

## Layout

```text
paseo-plugin.json   manifest: id, name, description, Paseo version range
index.client.tsx    client entry, runs in the Paseo app (desktop, web, mobile)
index.server.ts     server entry, runs as a daemon subprocess (delete with server/ and shared/ if unused)
client/             app-only code (React Native); client/web.ts is the only file allowed browser APIs
server/             daemon-only code (Node)
shared/             RPC contracts and types used by both sides
OVERVIEW.md         registry listing page; rules are in its header comment
README.md           GitHub page: tagline, requirements, install, develop, license
```

Each entry default-exports a function that registers contributions and returns a cleanup function. The daemon compiles the source on install and on reload. Paseo supplies the runtime libraries (plugin SDK, React, React Native, TanStack Query, Zod), so `package.json` holds dev dependencies only.

## Rules

- **Docs first.** The plugin docs are the source of truth: https://paseo.sh/docs/plugins (index: https://paseo.sh/llms.txt, API: https://paseo.sh/docs/plugins/reference). Check an API there before using it.
- **Directory boundary.** The build enforces it: `client/` never imports `server/` or `node:` modules; no code files at the root besides the two entries.
- **Cross-platform.** Client code also runs on phones: no `document` or `window` outside `client/web.ts`.
- **Borrowed code.** Only from MIT or Apache-2.0 sources, keeping their license notice and crediting them in README. Unlicensed plugins are reference only.
- **Unsandboxed.** Plugin code runs with the user's permissions; add no network calls or file access without Hleb's approval.
- **Wording.** README, OVERVIEW.md and descriptions state facts only; Hleb approves any text about what Taste does.

## Commands

```bash
npm install
npm run typecheck              # must pass before every commit
paseo plugin install "$PWD"    # first install into the local daemon
paseo plugin reload taste      # after each change
paseo plugin ls                # status and errors
paseo plugin logs taste
```

Plugins run only when **Settings → Plugins → Enable plugins** is on (`pluginsEnabled` in `~/.paseo/config.json`). Do not change that switch without Hleb's permission.

## Release

1. Bump `version` in `package.json`.
2. Update `OVERVIEW.md`; add an icon and media for the registry listing.
3. Submit or update through https://github.com/getpaseo/plugins (publishing guide: https://paseo.sh/docs/plugins/publishing).

## Git

Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`), one logical unit per commit, on `main` until Hleb sets up another flow.
