import { NextResponse } from "next/server";
import { getWatcherStatus, startWatcher } from "@/lib/watcher";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    // Attempt to start the watcher on the first request if not running
    await startWatcher();
    
    const status = getWatcherStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    logger.error("Failed to get watcher status", { error: error.message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
