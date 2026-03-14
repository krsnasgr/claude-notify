import * as vscode from "vscode";
import { exec } from "child_process";

export function sendNotification(
  message: string,
  options: { sound: boolean }
): void {
  const focused = vscode.window.state.focused;
  const config = vscode.workspace.getConfiguration("claudeNotifications");
  const onlyWhenUnfocused = config.get<boolean>("onlyWhenUnfocused", false);

  // Send OS notification if window is unfocused (or if configured to always send)
  if (!onlyWhenUnfocused || !focused) {
    sendOSNotification(message, options.sound);
  }
}

function sendOSNotification(message: string, sound: boolean): void {
  const platform = process.platform;

  if (platform === "darwin") {
    const soundClause = sound ? ' sound name "default"' : "";
    const script = `display notification "${escapeAppleScript(message)}" with title "Claude Notify"${soundClause}`;
    exec(`osascript -e '${script}'`);
  } else if (platform === "linux") {
    exec(`notify-send "Claude Notify" "${escapeShell(message)}"`);
  } else if (platform === "win32") {
    const ps = `
      [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
      [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] | Out-Null
      $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
      $xml.LoadXml("<toast><visual><binding template='ToastGeneric'><text>Claude Code</text><text>${escapeShell(message)}</text></binding></visual></toast>")
      $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
      [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("Claude Notify").Show($toast)
    `.trim();
    exec(`powershell -Command "${ps.replace(/"/g, '\\"')}"`);
  }
}

function escapeAppleScript(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function escapeShell(str: string): string {
  return str.replace(/"/g, '\\"').replace(/\$/g, "\\$").replace(/`/g, "\\`");
}
