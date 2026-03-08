import { startBackgroundMonitor } from "./lib/monitor";

export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    startBackgroundMonitor();
  }
}
