import { GET as scanRoute } from "../health/route"; // Mock import for the style
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { getGitStatus } from "@/lib/git-utils";
import { PROJECTS } from "@/lib/config";
import { logger } from "@/lib/logger";

import { NextResponse } from "next/server";

export const GET = async (request: Request): Promise<NextResponse> => {
  return _GET(request);
};

const _GET = withErrorHandling(async (request: Request) => {
  const start = Date.now();
  logger.info("Starting Git status scan across all projects");

  const results = await Promise.all(
    PROJECTS.map(async (project) => {
      const gitStatus = await getGitStatus(project.path);
      return {
        name: project.name,
        git: gitStatus
      };
    })
  );

  logger.info(`Git scan complete in ${Date.now() - start}ms`);
  
  // Format as a map for easy frontend consumption
  const statusMap = results.reduce((acc, curr) => {
    acc[curr.name] = curr.git;
    return acc;
  }, {} as Record<string, any>);

  return jsonSuccess(statusMap);
});
