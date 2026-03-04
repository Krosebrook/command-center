"use client";

import { useState } from "react";
import { ContextPreview } from "@/components/ContextPreview";
import { PROJECTS, FOLDERS } from "@/lib/config";
import path from "path";

// Derive presets from the canonical PROJECTS config plus this application itself
const PRESETS = [
  ...PROJECTS.map((p) => ({
    name: p.name,
    path: p.path,
    description: p.description,
  })),
  {
    name: "Command Center",
    path: path.join(FOLDERS.homebase, "03_Projects", "Projects", "Active", "command-center"),
    description: "This dashboard application",
  },
];

interface ContextBundle {
  projectName: string;
  context: string;
  files: string[];
}

export default function LaunchPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const [bundle, setBundle] = useState<ContextBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [customPath, setCustomPath] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadContext = async (projectPath: string, projectName: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectPath, projectName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed: ${res.statusText}`);
      }
      setBundle(data);
    } catch (err) {
      console.error("Failed to load context:", err);
      setError(err instanceof Error ? err.message : "Failed to load context");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          AI Workspace Launcher
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate context bundles for AI sessions
        </p>
      </div>

      {/* Presets */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Project Presets</h2>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setSelected(preset.name);
                loadContext(preset.path, preset.name);
              }}
              className={`rounded-xl border p-4 text-left transition-colors ${
                selected === preset.name
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <h3 className="font-semibold text-sm">{preset.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {preset.description}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground mt-2 truncate">
                {preset.path}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Path */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Custom Project Path</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="D:\path\to\project"
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono focus:outline-none focus:border-primary"
          />
          <button
            onClick={() => {
              if (customPath) {
                const name = customPath.split("\\").pop() ?? "Custom";
                setSelected(name);
                loadContext(customPath, name);
              }
            }}
            className="px-4 py-2 rounded-lg bg-accent text-sm font-medium hover:bg-accent/80 transition-colors"
          >
            Load Context
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Scanning project and collecting context files...
          </p>
        </div>
      )}

      {/* Preview */}
      {bundle && !loading && (
        <ContextPreview
          projectName={bundle.projectName}
          context={bundle.context}
          files={bundle.files}
        />
      )}
    </div>
  );
}
