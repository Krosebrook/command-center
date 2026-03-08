import type { ScanResult } from "@/lib/types";
import { generateSuggestions } from "@/lib/suggestions";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { safeParseBody } from "@/lib/security";
import { ValidationError } from "@/lib/errors";
import { SuggestionsRequestSchema } from "@/lib/validation";

export const POST = withErrorHandling(async (request: Request) => {
  const rawBody = await safeParseBody(request);
  const parsed = SuggestionsRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Invalid request", {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const { results } = parsed.data;

  const suggestions = generateSuggestions(results);
  return jsonSuccess(suggestions);
});
