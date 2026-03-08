import { scanDrive } from "./scanner";
import { logger } from "./logger";

// Prevent multiple intervals in Next.js dev mode (HMR)
const globalForMonitor = global as unknown as { monitorInterval: NodeJS.Timeout };

const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function startBackgroundMonitor() {
  if (globalForMonitor.monitorInterval) {
    return; // Already running
  }

  logger.info("Starting background drive monitor (10m interval)");

  // Initial immediate run (optional, since the dashboard fetches on load anyway)
  // scanDrive().catch(err => logger.error("Initial background scan failed", { err }));

  globalForMonitor.monitorInterval = setInterval(async () => {
    try {
      logger.info("[Monitor] Running background drive scan...");
      await scanDrive();
      logger.info("[Monitor] Background scan completed");
    } catch (error) {
      logger.error("[Monitor] Background scan failed", { error });
    }
  }, POLL_INTERVAL_MS);
}

export function stopBackgroundMonitor() {
  if (globalForMonitor.monitorInterval) {
    clearInterval(globalForMonitor.monitorInterval);
    globalForMonitor.monitorInterval = undefined as any;
    logger.info("Stopped background drive monitor");
  }
}
