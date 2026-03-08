import { z } from "zod";

export const ActionRequestSchema = z.object({
  action: z.enum(["move", "create-index", "create-file", "archive", "delete"]),
  source: z.string().min(1, "source is required"),
  destination: z.string().optional(),
});

export const ContextRequestSchema = z.object({
  projectPath: z.string().min(1, "projectPath is required"),
  projectName: z.string().optional(),
});

export const SuggestionsRequestSchema = z.object({
  results: z.array(
    z.object({
      type: z.enum([
        "missing-index",
        "orphaned",
        "stale",
        "unsorted",
        "large-file",
        "empty-dir",
        "missing-governance",
      ]),
      path: z.string(),
      severity: z.enum(["info", "warning", "action"]),
      details: z.string(),
      size: z.number().optional(),
      lastModified: z.string().optional(),
    }),
  ),
});

export const UpdateRequestSchema = z.object({
  actions: z
    .array(
      z.object({
        action: z.string(),
        source: z.string(),
        destination: z.string().optional(),
        title: z.string().optional(),
      }),
    )
    .optional(),
});

export type ActionRequest = z.infer<typeof ActionRequestSchema>;
export type ContextRequest = z.infer<typeof ContextRequestSchema>;
export type SuggestionsRequest = z.infer<typeof SuggestionsRequestSchema>;
export type UpdateRequest = z.infer<typeof UpdateRequestSchema>;
