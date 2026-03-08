import { getScanHistory } from "@/lib/db";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export const GET = withErrorHandling(async (request: Request) => {
  const start = Date.now();
  logger.info("Fetching scan history for analytics");

  const history = getScanHistory(30);
  
  return jsonSuccess({ history }, "Scan history retrieved", 200, start);
});
