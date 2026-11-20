import { getPaseoClient, useHosts, type PluginScreenProps } from "@getpaseo/plugin/client";
import { Icon, ScrollView, TextInput, useToast } from "@getpaseo/plugin/client/ui";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";
import { Picker } from "./picker";

// Layout tokens, kept here to tune against Conductor.
const COLUMN_MAX_WIDTH = 720;
const SCREEN_PADDING = 16;
const TITLE_FONT_SIZE = 24;
const TITLE_MARGIN_BOTTOM = 32;
const TITLE_PADDING_LEFT = 24;
const FIELD_ROW_GAP = 8;
const FIELD_ROW_MARGIN_BOTTOM = 16;
const FIELD_ROW_PADDING_X = 16;
const COMPOSER_RADIUS = 12;
const COMPOSER_PADDING = 12;
const COMPOSER_MIN_INPUT_HEIGHT = 64;
const COMPOSER_FONT_SIZE = 15;
const CONTROLS_GAP = 4;
const SEND_BUTTON_SIZE = 32;
const ICON_SIZE = 14;

// Paseo's own wording (packages/app/src/i18n/resources/en.ts).
const TEXT = {
  title: "New workspace",
  project: "Project",
  host: "Host",
  isolation: "Isolation",
  local: "Project directory",
  worktree: "New worktree",
  provider: "Provider",
  model: "Model",
  thinking: "Thinking",
  mode: "Mode",
  create: "Create",
  placeholder: "Message the agent, tag @files, or use /commands and /skills",
  placeholderCompact: "Message, @files, /commands",
  noProjects: "No projects available.",
  hostDisconnected: "Host is not connected",
  selectModel: "Select a model",
  unknownModel: "Unknown model",
};

type PaseoApi = ReturnType<typeof getPaseoClient>;
type PaseoProject = Awaited<ReturnType<PaseoApi["projects"]["list"]>>["projects"][number];
type ProviderEntry = Awaited<ReturnType<PaseoApi["providers"]["snapshot"]>>["entries"][number];
type Load<T> = { status: "loading" } | { status: "error"; error: string } | { status: "ready"; value: T };

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Runs `load` whenever `key` changes; a result for an older key is dropped. */
function useLoad<T>(key: string | null, load: () => Promise<T>): Load<T> | null {
  const [state, setState] = useState<Load<T> | null>(null);
  useEffect(() => {
    if (key === null) {
      setState(null);
      return;
    }
    let current = true;
    setState({ status: "loading" });
    load().then(
      (value) => current && setState({ status: "ready", value }),
      (error) => current && setState({ status: "error", error: errorMessage(error) }),
    );
    return () => {
      current = false;
    };
    // `load` reads only what `key` encodes.
  }, [key]);
  return state;
}

type Isolation = "local" | "worktree";

/** The first of `items` whose id matches a candidate, in candidate order; else the first item. */
function pick<T extends { id: string }>(
  items: readonly T[],
  ...candidates: (string | null | undefined)[]
): T | null {
  for (const id of candidates) {
    const match = id ? items.find((item) => item.id === id) : undefined;
    if (match) return match;
  }
  return items[0] ?? null;
}

/** Host, its projects, the chosen project and the isolation. */
function useProjectSelection(initialServerId: string) {
  const hosts = useHosts();
  const [serverId, setServerIdState] = useState(initialServerId);
  const selectedHost = hosts.find((h) => h.serverId === serverId) ?? null;
  const online = selectedHost?.status === "online";
  const projectsLoad = useLoad(online ? serverId : null, async () => {
    const { projects } = await getPaseoClient(serverId).projects.list();
    return projects;
  });
  const projects = projectsLoad?.status === "ready" ? projectsLoad.value : [];
  const [projectId, setProjectId] = useState<string | null>(null);
  const project: PaseoProject | null =
    projects.find((p) => p.projectId === projectId) ?? projects[0] ?? null;
  const canCreateWorktree = project?.projectKind === "git";
  const [isolationChoice, setIsolation] = useState<Isolation>("local");
  return {
    hosts,
    serverId,
    setServerId(id: string) {
      setServerIdState(id);
      setProjectId(null);
    },
    selectedHost,
    online,
    projectsLoad,
    projects,
    project,
    setProjectId,
    canCreateWorktree,
    isolation: canCreateWorktree ? isolationChoice : ("local" as Isolation),
    setIsolation,
  };
}

/** Provider, model, thinking option and mode for the first agent, with the provider's defaults. */
function useAgentSelection(serverId: string, cwd: string | null) {
  const providersLoad = useLoad(cwd ? `${serverId}\n${cwd}` : null, async () => {
    const { entries } = await getPaseoClient(serverId).providers.waitForReady({ cwd: cwd! });
    return entries.filter((entry) => entry.enabled !== false && entry.status === "ready");
  });
  const providers: readonly ProviderEntry[] =
    providersLoad?.status === "ready" ? providersLoad.value : [];
  const [choice, setChoice] = useState({
    provider: null as string | null,
    model: null as string | null,
    thinking: null as string | null,
    mode: null as string | null,
  });
  const provider = providers.find((p) => p.provider === choice.provider) ?? providers[0] ?? null;
  const models = (provider?.models ?? []).filter((m) => m.isSelectable !== false);
  const model = pick(models, choice.model, models.find((m) => m.isDefault)?.id);
  const thinkingOptions = model?.thinkingOptions ?? [];
  const thinking = pick(
    thinkingOptions,
    choice.thinking,
    model?.defaultThinkingOptionId,
    thinkingOptions.find((o) => o.isDefault)?.id,
  );
  const modes = provider?.modes ?? [];
  const mode = pick(modes, choice.mode, provider?.defaultModeId);
  return {
    providersLoad,
    providers,
    provider,
    models,
    model,
    thinkingOptions,
    thinking,
    modes,
    mode,
    selectProvider: (id: string) => setChoice({ provider: id, model: null, thinking: null, mode: null }),
    selectModel: (id: string) => setChoice((c) => ({ ...c, model: id, thinking: null })),
    selectThinking: (id: string) => setChoice((c) => ({ ...c, thinking: id })),
    selectMode: (id: string) => setChoice((c) => ({ ...c, mode: id })),
  };
}

/** Creates the workspace with its first agent; resolves to the workspace id. */
async function createWorkspace(input: {
  serverId: string;
  project: PaseoProject;
  isolation: Isolation;
  provider: string;
  model: string;
  modeId: string | null;
  thinkingOptionId: string | null;
  prompt: string;
}): Promise<string> {
  const { project, prompt } = input;
  const path = project.projectRootPath;
  const workspace = await getPaseoClient(input.serverId).workspaces.create({
    source:
      input.isolation === "worktree"
        ? { kind: "worktree", cwd: path, projectId: project.projectId }
        : { kind: "directory", path, projectId: project.projectId },
    ...(prompt ? { firstAgentContext: { prompt } } : {}),
    agent: {
      cwd: path,
      config: {
        provider: `${input.provider}/${input.model}`,
        ...(input.modeId ? { modeId: input.modeId } : {}),
        ...(input.thinkingOptionId ? { thinkingOptionId: input.thinkingOptionId } : {}),
      },
      ...(prompt ? { prompt } : {}),
    },
  });
  return workspace.id;
}

/** The state line under the composer: host, project or provider trouble. */
function noticeFor(
  selection: ReturnType<typeof useProjectSelection>,
  providersLoad: Load<unknown> | null,
): { text: string; isError: boolean } | null {
  const { online, projectsLoad, projects } = selection;
  if (!online) return { text: TEXT.hostDisconnected, isError: true };
  if (projectsLoad?.status === "error") return { text: projectsLoad.error, isError: true };
  if (projectsLoad?.status === "ready" && projects.length === 0)
    return { text: TEXT.noProjects, isError: false };
  if (providersLoad?.status === "error") return { text: providersLoad.error, isError: true };
  return null;
}

interface FieldProps {
  theme: PluginScreenProps["theme"];
  disabled: boolean;
}

/** Project, Host and Isolation, above the composer. */
function SetupFields({
  theme,
  selection,
  disabled,
}: FieldProps & { selection: ReturnType<typeof useProjectSelection> }) {
  const { hosts, serverId, selectedHost, online, projects, project, isolation } = selection;
  const muted = theme.colors.foregroundMuted;
  const hostDotColor = online
    ? theme.colors.statusSuccess
    : selectedHost?.status === "connecting"
      ? theme.colors.statusWarning
      : theme.colors.statusDanger;
  const dot = { width: 8, height: 8, borderRadius: 4, backgroundColor: hostDotColor };
  return (
    <>
      <Picker
        theme={theme}
        title={TEXT.project}
        icon={<Icon name="Folder" size={ICON_SIZE} color={muted} />}
        value={project ? (project.projectCustomName ?? project.projectDisplayName) : TEXT.project}
        selectedId={project?.projectId ?? null}
        options={projects.map((p) => ({
          id: p.projectId,
          label: p.projectCustomName ?? p.projectDisplayName,
          description: p.projectRootPath,
        }))}
        onSelect={selection.setProjectId}
        disabled={disabled}
      />
      <Picker
        theme={theme}
        title={TEXT.host}
        icon={<View style={dot} />}
        value={selectedHost?.label ?? TEXT.host}
        selectedId={serverId}
        options={hosts.map((h) => ({ id: h.serverId, label: h.label }))}
        onSelect={selection.setServerId}
        disabled={disabled}
      />
      {selection.canCreateWorktree ? (
        <Picker
          theme={theme}
          title={TEXT.isolation}
          icon={
            <Icon
              name={isolation === "worktree" ? "GitBranch" : "Folder"}
              size={ICON_SIZE}
              color={muted}
            />
          }
          value={isolation === "worktree" ? TEXT.worktree : TEXT.local}
          selectedId={isolation}
          options={[
            { id: "local", label: TEXT.local, description: project?.projectRootPath },
            { id: "worktree", label: TEXT.worktree },
          ]}
          onSelect={(id) => selection.setIsolation(id === "worktree" ? "worktree" : "local")}
          disabled={disabled}
        />
      ) : null}
    </>
  );
}

/** Provider, Model, Thinking and Mode, inside the composer. */
function AgentControls({
  theme,
  agent,
  disabled,
}: FieldProps & { agent: ReturnType<typeof useAgentSelection> }) {
  const { providers, provider, models, model, thinkingOptions, thinking, modes, mode } = agent;
  const muted = theme.colors.foregroundMuted;
  const providerIcon = provider?.iconSvg ? { svg: provider.iconSvg } : "Bot";
  return (
    <>
      {agent.providersLoad?.status === "loading" ? (
        <ActivityIndicator size="small" color={muted} />
      ) : null}
      {provider ? (
        <Picker
          theme={theme}
          title={TEXT.provider}
          icon={<Icon icon={providerIcon} size={ICON_SIZE} color={muted} />}
          value={provider.label ?? provider.provider}
          selectedId={provider.provider}
          options={providers.map((p) => ({
            id: p.provider,
            label: p.label ?? p.provider,
            description: p.description,
          }))}
          onSelect={agent.selectProvider}
          disabled={disabled}
        />
      ) : null}
      {provider ? (
        <Picker
          theme={theme}
          title={TEXT.model}
          icon={<Icon icon={providerIcon} size={ICON_SIZE} color={muted} />}
          value={model?.label ?? TEXT.unknownModel}
          selectedId={model?.id ?? null}
          options={models.map((m) => ({ id: m.id, label: m.label, description: m.description }))}
          onSelect={agent.selectModel}
          disabled={disabled}
        />
      ) : null}
      {thinking ? (
        <Picker
          theme={theme}
          title={TEXT.thinking}
          icon={<Icon name="Brain" size={ICON_SIZE} color={muted} />}
          value={thinking.label}
          selectedId={thinking.id}
          options={thinkingOptions.map((o) => ({
            id: o.id,
            label: o.label,
            description: o.description,
          }))}
          onSelect={agent.selectThinking}
          disabled={disabled}
        />
      ) : null}
      {mode ? (
        <Picker
          theme={theme}
          title={TEXT.mode}
          icon={<Icon name={mode.icon ?? "Bot"} size={ICON_SIZE} color={muted} />}
          value={mode.label}
          selectedId={mode.id}
          options={modes.map((m) => ({ id: m.id, label: m.label, description: m.description }))}
          onSelect={agent.selectMode}
          disabled={disabled}
        />
      ) : null}
    </>
  );
}

export function NewWorkspaceScreen({ theme, host, layout, navigation }: PluginScreenProps) {
  const toast = useToast();
  const selection = useProjectSelection(host.id);
  const { serverId, online, project, isolation } = selection;
  const agent = useAgentSelection(serverId, online ? (project?.projectRootPath ?? null) : null);
  const { provider, model, thinking, mode } = agent;

  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = online && project !== null && agent.providersLoad?.status === "ready";

  async function create() {
    if (pending || !ready || !project) return;
    if (!provider || !model) {
      setError(TEXT.selectModel);
      return;
    }
    setPending(true);
    setError(null);
    try {
      const workspaceId = await createWorkspace({
        serverId,
        project,
        isolation,
        provider: provider.provider,
        model: model.id,
        modeId: mode?.id ?? null,
        thinkingOptionId: thinking?.id ?? null,
        prompt: prompt.trim(),
      });
      setPrompt("");
      navigation?.openWorkspace({ workspaceId, serverId });
    } catch (cause) {
      const message = errorMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  const styles = useMemo(
    () => ({
      screen: { flex: 1, backgroundColor: theme.colors.surface0 },
      content: {
        flexGrow: 1,
        justifyContent: "center" as const,
        alignItems: "center" as const,
        padding: SCREEN_PADDING,
      },
      column: { width: "100%" as const, maxWidth: COLUMN_MAX_WIDTH },
      title: {
        marginBottom: TITLE_MARGIN_BOTTOM,
        paddingLeft: TITLE_PADDING_LEFT,
        color: theme.colors.foreground,
        fontSize: TITLE_FONT_SIZE,
        fontWeight: "400" as const,
      },
      fieldRow: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        alignItems: "center" as const,
        gap: FIELD_ROW_GAP,
        marginBottom: FIELD_ROW_MARGIN_BOTTOM,
        paddingHorizontal: FIELD_ROW_PADDING_X,
      },
      composer: {
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: COMPOSER_RADIUS,
        backgroundColor: theme.colors.surface1,
        padding: COMPOSER_PADDING,
      },
      input: {
        minHeight: COMPOSER_MIN_INPUT_HEIGHT,
        color: theme.colors.foreground,
        fontSize: COMPOSER_FONT_SIZE,
        textAlignVertical: "top" as const,
      },
      controls: {
        flexDirection: "row" as const,
        flexWrap: "wrap" as const,
        alignItems: "center" as const,
        gap: CONTROLS_GAP,
      },
      spacer: { flex: 1 },
      send: {
        width: SEND_BUTTON_SIZE,
        height: SEND_BUTTON_SIZE,
        borderRadius: SEND_BUTTON_SIZE / 2,
        alignItems: "center" as const,
        justifyContent: "center" as const,
        backgroundColor: theme.colors.accent,
      },
      message: { marginTop: 8, color: theme.colors.foregroundMuted, fontSize: 14 },
      error: { marginTop: 8, color: theme.colors.statusDanger, fontSize: 14 },
    }),
    [theme],
  );

  const muted = theme.colors.foregroundMuted;

  const notice = noticeFor(selection, agent.providersLoad);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.column}>
        {layout.compact ? null : <Text style={styles.title}>{TEXT.title}</Text>}
        <View style={styles.fieldRow}>
          <SetupFields theme={theme} selection={selection} disabled={pending} />
          {selection.projectsLoad?.status === "loading" ? (
            <ActivityIndicator size="small" color={muted} />
          ) : null}
        </View>
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={prompt}
            onChangeText={setPrompt}
            placeholder={layout.compact ? TEXT.placeholderCompact : TEXT.placeholder}
            placeholderTextColor={muted}
            multiline
            autoFocus
            editable={!pending}
            onKeyPress={(event) => {
              // Desktop: Enter creates, Shift+Enter adds a line.
              const native = event.nativeEvent as { key: string; shiftKey?: boolean };
              if (Platform.OS === "web" && native.key === "Enter" && !native.shiftKey) {
                event.preventDefault();
                void create();
              }
            }}
          />
          <View style={styles.controls}>
            <AgentControls theme={theme} agent={agent} disabled={pending} />
            <View style={styles.spacer} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={TEXT.create}
              disabled={!ready || pending}
              onPress={() => void create()}
              style={[styles.send, !ready ? { opacity: 0.5 } : null]}
            >
              {pending ? (
                <ActivityIndicator size="small" color={theme.colors.accentForeground} />
              ) : (
                <Icon name="CornerDownLeft" size={16} color={theme.colors.accentForeground} />
              )}
            </Pressable>
          </View>
        </View>
        {notice ? (
          <Text style={notice.isError ? styles.error : styles.message}>{notice.text}</Text>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </ScrollView>
  );
}
