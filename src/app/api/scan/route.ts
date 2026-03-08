import { scanDrive } from "@/lib/scanner";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";

export const GET = withErrorHandling(async () => {
  const stats = await scanDrive();
  return jsonSuccess(stats);
});
