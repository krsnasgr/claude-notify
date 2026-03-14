import * as fs from "fs";
import * as path from "path";
import { EventEmitter } from "events";

export class SignalWatcher extends EventEmitter {
  private watcher: fs.FSWatcher | null = null;
  private lastSignalTime = 0;
  private cooldownMs: number;
  private signalPath: string;

  constructor(signalPath: string, cooldownMs: number = 3000) {
    super();
    this.signalPath = signalPath;
    this.cooldownMs = cooldownMs;
  }

  start(): void {
    this.ensureSignalFile();

    this.watcher = fs.watch(
      this.signalPath,
      { persistent: false },
      (eventType) => {
        if (eventType === "change" || eventType === "rename") {
          this.onSignal();
        }
      }
    );

    this.watcher.on("error", () => {
      // File may have been deleted; try to recreate and re-watch
      this.restart();
    });
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  setCooldown(ms: number): void {
    this.cooldownMs = ms;
  }

  private onSignal(): void {
    const now = Date.now();
    if (now - this.lastSignalTime < this.cooldownMs) {
      return;
    }
    this.lastSignalTime = now;
    this.emit("signal");
  }

  private ensureSignalFile(): void {
    const dir = path.dirname(this.signalPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.signalPath)) {
      fs.writeFileSync(this.signalPath, "");
    }
  }

  private restart(): void {
    this.stop();
    setTimeout(() => {
      try {
        this.start();
      } catch {
        // Give up silently — will retry on next activation
      }
    }, 1000);
  }
}
