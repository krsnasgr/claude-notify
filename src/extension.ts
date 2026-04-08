import * as vscode from "vscode";
import { installHook, removeHook, getSignalFilePath, getAllSignalTypes, SignalType } from "./hookManager";
import { SignalWatcher } from "./signalWatcher";
import { sendNotification } from "./notifier";

const signalWatchers: SignalWatcher[] = [];
let statusBarItem: vscode.StatusBarItem;

const MESSAGES: Record<SignalType, string> = {
  stop: "Claude has completed the task. Awaiting further instructions.",
  notification: "Claude requires your input to proceed further.",
  permission: "Claude requires your permission to proceed further.",
};

export function activate(context: vscode.ExtensionContext) {
  // Install the hooks into Claude Code settings
  try {
    installHook();
  } catch (err: any) {
    vscode.window.showWarningMessage(
      `Claude Notify: Could not read ~/.claude/settings.json — ${err.message}. Fix the file manually or remove it to start fresh.`
    );
  }

  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "claude-notifications.toggle";
  context.subscriptions.push(statusBarItem);
  updateStatusBar();

  // Start watching all signal files
  const config = vscode.workspace.getConfiguration("claudeNotifications");
  const cooldown = config.get<number>("cooldownSeconds", 3) * 1000;

  for (const signalType of getAllSignalTypes()) {
    const watcher = new SignalWatcher(getSignalFilePath(signalType), cooldown);
    watcher.on("signal", () => {
      const enabled = vscode.workspace
        .getConfiguration("claudeNotifications")
        .get<boolean>("enabled", true);
      if (!enabled) {
        return;
      }
      const sound = vscode.workspace
        .getConfiguration("claudeNotifications")
        .get<boolean>("sound", true);
      sendNotification(MESSAGES[signalType], { sound });
    });
    watcher.start();
    signalWatchers.push(watcher);
  }

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand("claude-notifications.toggle", () => {
      const config = vscode.workspace.getConfiguration("claudeNotifications");
      const current = config.get<boolean>("enabled", true);
      config.update("enabled", !current, vscode.ConfigurationTarget.Global);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("claude-notifications.test", () => {
      const sound = vscode.workspace
        .getConfiguration("claudeNotifications")
        .get<boolean>("sound", true);
      sendNotification("Test notification — Claude Notify works!", {
        sound,
      });
    })
  );

  // React to config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("claudeNotifications.enabled")) {
        updateStatusBar();
      }
      if (e.affectsConfiguration("claudeNotifications.cooldownSeconds")) {
        const newCooldown =
          vscode.workspace
            .getConfiguration("claudeNotifications")
            .get<number>("cooldownSeconds", 3) * 1000;
        signalWatchers.forEach((w) => w.setCooldown(newCooldown));
      }
    })
  );
}

export function deactivate() {
  signalWatchers.forEach((w) => w.stop());
  signalWatchers.length = 0;
  try {
    removeHook();
  } catch {
    // If settings can't be read, hooks can't be cleaned up.
    // User will need to remove entries containing "# claude-notify-extension" manually.
  }
}

function updateStatusBar() {
  const enabled = vscode.workspace
    .getConfiguration("claudeNotifications")
    .get<boolean>("enabled", true);

  if (enabled) {
    statusBarItem.text = "$(bell) Claude Notify";
    statusBarItem.tooltip = "Claude Notify: ON (click to toggle)";
  } else {
    statusBarItem.text = "$(bell-slash) Claude Notify";
    statusBarItem.tooltip = "Claude Notify: OFF (click to toggle)";
  }

  statusBarItem.show();
}
