"use client";

import { useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { basename } from "@/lib/utils";

const ContextPreview = dynamic(
  () => import("@/components/ContextPreview").then((m) => ({ default: m.ContextPreview })),
  {
    ssr: false,
    loading: () => <div className="hud-card p-5 animate-pulse h-40" />,
  },
);

// Presets defined as plain strings — no Node.js path module in client components
const PRESETS = [
  {
    name: "FlashFusion",
    path: "D:\\01_Homebase\\01_Source-of-Truth\\FlashFusion",
    description: "Multi-provider AI integration and e-commerce platform",
  },
  {
    name: "KAR",
    path: "D:\\01_Homebase\\01_Source-of-Truth\\KAR",
    description: "KAR project",
  },
  {
    name: "INTINC",
    path: "D:\\03_INTInc\\INTINC",
    description: "INT Inc / Interact business platform",
  },
  {
    name: "AIaaS Rollout",
    path: "D:\\01_Homebase\\01_Source-of-Truth\\AIaaSRollOutAutomations",
    description: "AI-as-a-Service rollout automations",
  },
  {
    name: "nexus-app-factory",
    path: "D:\\01_Homebase\\00_Core\\nexus-app-factory",
    description: "Nexus app factory for scaffolding projects",
  },
  {
    name: "Fullstack Framework",
    path: "D:\\01_Homebase\\02_Frameworks\\fullstack-framework-2025",
    description: "Reusable full-stack project scaffold",
  },
  {
    name: "Command Center",
    path: "D:\\01_Homebase\\03_Projects\\Projects\\Active\\command-center",
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
    <Suspense fallback={<div className="max-w-6xl hud-card p-5 animate-pulse h-96" />}>
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-glow">
          AI Workspace Launcher
        </h1>
        <p className="text-muted-foreground mt-1">
          Generate context bundles for AI sessions
        </p>
      </div>

      {/* Presets */}
      <div>
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
          Project Presets
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setSelected(preset.name);
                loadContext(preset.path, preset.name);
              }}
              className={`hud-card p-4 text-left transition-colors ${
                selected === preset.name
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/30"
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
      <div className="hud-card p-5">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Custom Project Path
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="D:\path\to\project"
            aria-label="Custom project path"
            className="flex-1 px-3 py-2 rounded-lg font-mono bg-background/50 border border-border text-sm focus:outline-none focus:border-primary focus:shadow-glow"
          />
          <button
            onClick={() => {
              if (customPath) {
                const name = basename(customPath);
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
        <div className="hud-card border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="hud-card p-8 text-center">
          <div className="shimmer h-4 w-64 mx-auto rounded mb-2" />
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
    </Suspense>
  );
}
