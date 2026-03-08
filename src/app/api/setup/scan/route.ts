import { deepScanDrive } from "@/lib/deep-scanner";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";

export const GET = withErrorHandling(async () => {
  const results = await deepScanDrive();
  return jsonSuccess(results);
});
