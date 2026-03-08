import { NextResponse } from "next/server";
import { getJob } from "@/lib/db";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export const GET = withErrorHandling(async (
  request: Request,
  { params }: { params: Promise<{ jobId: string }> } // In Next.js 15 route params are Promises
) => {
  const start = Date.now();
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required" }, { status: 400 });
  }

  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return jsonSuccess({ job }, "Job retrieved", 200, start);
});
