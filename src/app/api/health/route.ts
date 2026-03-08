import fs from "fs/promises";
import { DRIVE_ROOT } from "@/lib/config";
import { jsonSuccess } from "@/lib/api-utils";
import { NextResponse } from "next/server";

const startTime = Date.now();

export async function GET() {
  let driveAccessible = false;
  try {
    await fs.access(DRIVE_ROOT);
    driveAccessible = true;
  } catch {
    // Drive not mounted
  }

  const status = driveAccessible ? "healthy" : "degraded";
  const statusCode = driveAccessible ? 200 : 503;

  return NextResponse.json(
    {
      status,
      uptime: Math.round((Date.now() - startTime) / 1000),
      driveAccessible,
      driveRoot: DRIVE_ROOT,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode },
  );
}
