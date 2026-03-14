# Claude Notify

Native OS notifications for [Claude Code](https://claude.ai/code) in VS Code.

Stop tab-checking — get notified when Claude finishes a task, needs your input, or requires permission to proceed.

## Features

- **Task Complete** — notifies you when Claude has finished its response
- **Input Required** — notifies you when Claude is waiting for your input
- **Permission Required** — notifies you when Claude needs approval to run a tool
- **Cross-platform** — macOS (`osascript`), Linux (`notify-send`), Windows (PowerShell toast)
- **Status bar toggle** — quickly enable/disable from the status bar
- **Configurable cooldown** — avoid duplicate notifications

## How It Works

Claude Notify uses Claude Code's [hook system](https://docs.anthropic.com/en/docs/claude-code/hooks) to detect state changes. On activation, it registers `Stop`, `Notification`, and `PermissionRequest` hooks in `~/.claude/settings.json` that write to signal files. The extension watches these files and sends native OS notifications when they change.

Hooks are automatically installed on activation and removed on deactivation.

## Requirements

- [Claude Code](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code) VS Code extension
- macOS, Linux, or Windows

## Settings

| Setting | Default | Description |
|---|---|---|
| `claudeNotifications.enabled` | `true` | Enable or disable notifications |
| `claudeNotifications.onlyWhenUnfocused` | `false` | Only send OS notifications when VS Code is not focused |
| `claudeNotifications.cooldownSeconds` | `3` | Minimum seconds between notifications |
| `claudeNotifications.sound` | `true` | Play a sound with the notification (macOS) |

## Commands

- **Claude Notify: Toggle** — toggle notifications on/off
- **Claude Notify: Send Test Notification** — send a test notification to verify setup

## Notification Messages

| Event | Message |
|---|---|
| Task complete | "Claude has completed the task. Awaiting further instructions." |
| Input required | "Claude requires your input to proceed further." |
| Permission required | "Claude requires your permission to proceed further." |

## License

MIT
