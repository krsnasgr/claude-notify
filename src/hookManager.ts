import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), ".claude", "settings.json");
const SIGNAL_DIR = path.join(os.homedir(), ".claude", "claude-notify-signals");

const HOOK_MARKER = "# claude-notify-extension";

export type SignalType = "stop" | "notification" | "permission";

const SIGNAL_FILES: Record<SignalType, string> = {
  stop: path.join(SIGNAL_DIR, "stop"),
  notification: path.join(SIGNAL_DIR, "notification"),
  permission: path.join(SIGNAL_DIR, "permission"),
};

export function getSignalFilePath(type: SignalType): string {
  return SIGNAL_FILES[type];
}

export function getAllSignalTypes(): SignalType[] {
  return ["stop", "notification", "permission"];
}

export function installHook(): void {
  // Ensure signal directory exists
  if (!fs.existsSync(SIGNAL_DIR)) {
    fs.mkdirSync(SIGNAL_DIR, { recursive: true });
  }

  const settings = readSettings();

  if (!settings.hooks) {
    settings.hooks = {};
  }

  const hookConfigs: { event: string; signalType: SignalType }[] = [
    { event: "Stop", signalType: "stop" },
    { event: "Notification", signalType: "notification" },
    { event: "PermissionRequest", signalType: "permission" },
  ];

  for (const { event, signalType } of hookConfigs) {
    if (!settings.hooks[event]) {
      settings.hooks[event] = [];
    }

    const alreadyInstalled = settings.hooks[event].some((entry: any) =>
      entry.hooks?.some((h: any) => h.command?.includes(HOOK_MARKER))
    );

    if (!alreadyInstalled) {
      settings.hooks[event].push({
        hooks: [
          {
            type: "command",
            command: `touch ${SIGNAL_FILES[signalType]} ${HOOK_MARKER}`,
            async: true,
          },
        ],
      });
    }
  }

  writeSettings(settings);
}

export function removeHook(): void {
  const settings = readSettings();

  if (!settings.hooks) {
    return;
  }

  for (const event of ["Stop", "Notification", "PermissionRequest"]) {
    if (!settings.hooks[event]) {
      continue;
    }

    settings.hooks[event] = settings.hooks[event].filter(
      (entry: any) =>
        !entry.hooks?.some((h: any) => h.command?.includes(HOOK_MARKER))
    );

    if (settings.hooks[event].length === 0) {
      delete settings.hooks[event];
    }
  }

  if (Object.keys(settings.hooks).length === 0) {
    delete settings.hooks;
  }

  writeSettings(settings);
}

function readSettings(): any {
  try {
    const content = fs.readFileSync(CLAUDE_SETTINGS_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function writeSettings(settings: any): void {
  const dir = path.dirname(CLAUDE_SETTINGS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2) + "\n");
}
