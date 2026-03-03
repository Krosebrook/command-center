"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SetupStepper } from "@/components/SetupStepper";
import { ScanResults } from "@/components/ScanResults";
import { SuggestionCard } from "@/components/SuggestionCard";
import type {
  ScanResult,
  DeepScanResult,
  Suggestion,
  SuggestionStatus,
} from "@/lib/types";

const steps = [
  { label: "Scan", description: "Deep scan drive for issues" },
  { label: "Review", description: "Review AI suggestions" },
  { label: "Execute", description: "Apply accepted changes" },
  { label: "Update", description: "Refresh governance docs" },
];

/** Clamp a raw URL param value to a valid wizard step index (0–3). */
function clampStep(value: number): number {
  return isNaN(value) || value < 0 || value > 3 ? 0 : value;
}

function SetupPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [step, setStep] = useState(() =>
    clampStep(Number(searchParams.get("step") ?? 0))
  );

  const updateStep = (newStep: number) => {
    setStep(newStep);
    router.push(`?step=${newStep}`, { scroll: false });
  };

  // Sync step from URL when user navigates with back/forward
  useEffect(() => {
    setStep(clampStep(Number(searchParams.get("step") ?? 0)));
  }, [searchParams]);
  const [scanResult, setScanResult] = useState<DeepScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionStatus, setSuggestionStatus] = useState<
    Record<string, SuggestionStatus>
  >({});
  const [executing, setExecuting] = useState(false);
  const [updateResult, setUpdateResult] = useState<{
    success: boolean;
    updated: string[];
  } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async (results: ScanResult[]) => {
    try {
      const res = await fetch("/api/setup/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ results }),
      });
      if (!res.ok) throw new Error(`Suggestions failed: ${res.statusText}`);
      const data = await res.json();
      setSuggestions(data);
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch suggestions"
      );
    }
  };

  const runScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/setup/scan");
      if (!res.ok) throw new Error(`Scan failed: ${res.statusText}`);
      const data: DeepScanResult = await res.json();
      setScanResult(data);
      await fetchSuggestions(data.results);
      updateStep(1);
    } catch (err) {
      console.error("Failed to run scan:", err);
      setError(err instanceof Error ? err.message : "Failed to run scan");
    } finally {
      setScanning(false);
    }
  };

  const acceptSuggestion = (id: string) => {
    setSuggestionStatus((prev) => ({ ...prev, [id]: "accepted" }));
  };

  const dismissSuggestion = (id: string) => {
    setSuggestionStatus((prev) => ({ ...prev, [id]: "dismissed" }));
  };

  const executeAccepted = async () => {
    setExecuting(true);
    setError(null);
    const accepted = suggestions.filter(
      (s) => suggestionStatus[s.id] === "accepted"
    );

    for (const suggestion of accepted) {
      setSuggestionStatus((prev) => ({ ...prev, [suggestion.id]: "executing" }));
      try {
        const res = await fetch("/api/setup/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: suggestion.action,
            source: suggestion.source,
            destination: suggestion.destination,
          }),
        });
        if (!res.ok) throw new Error(`Action failed: ${res.statusText}`);
        setSuggestionStatus((prev) => ({ ...prev, [suggestion.id]: "done" }));
      } catch (err) {
        console.error(`Failed to execute ${suggestion.id}:`, err);
        setSuggestionStatus((prev) => ({ ...prev, [suggestion.id]: "error" }));
      }
    }

    setExecuting(false);
    updateStep(3);
  };

  const updateDocs = async () => {
    setUpdating(true);
    setError(null);
    try {
      const executedActions = suggestions
        .filter((s) => suggestionStatus[s.id] === "done")
        .map((s) => ({
          action: s.action,
          source: s.source,
          destination: s.destination,
          title: s.title,
        }));

      const res = await fetch("/api/setup/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actions: executedActions }),
      });
      if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);
      const data = await res.json();
      setUpdateResult(data);
    } catch (err) {
      console.error("Failed to update docs:", err);
      setError(err instanceof Error ? err.message : "Failed to update docs");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Drive Walkthrough
        </h1>
        <p className="text-muted-foreground mt-1">
          Scan, review, and organize your drive
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Stepper */}
      <SetupStepper currentStep={step} steps={steps} />

      {/* Step 0: Scan */}
      {step === 0 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Deep Drive Scan</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Recursively scan all numbered folders for missing indexes,
              unsorted files, stale projects, and more.
            </p>
            <button
              onClick={runScan}
              disabled={scanning}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {scanning
                ? "Scanning..."
                : scanResult
                  ? "Re-scan Drive"
                  : "Scan Drive"}
            </button>
          </div>
          <ScanResults results={scanResult} loading={scanning} />
          {scanResult && (
            <div className="flex justify-end">
              <button
                onClick={() => updateStep(1)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Review Suggestions &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 1: Review suggestions */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              AI Suggestions ({suggestions.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => updateStep(0)}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-accent"
              >
                &larr; Back
              </button>
              <button
                onClick={() => updateStep(2)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Execute Accepted &rarr;
              </button>
            </div>
          </div>
          {suggestions.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              No suggestions generated
            </div>
          ) : (
            <div className="space-y-3">
              {suggestions.map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  status={suggestionStatus[s.id] || "pending"}
                  onAccept={acceptSuggestion}
                  onDismiss={dismissSuggestion}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Execute */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Execute Changes</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {
                Object.values(suggestionStatus).filter(
                  (s) => s === "accepted"
                ).length
              }{" "}
              suggestions accepted,{" "}
              {
                Object.values(suggestionStatus).filter(
                  (s) => s === "dismissed"
                ).length
              }{" "}
              dismissed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => updateStep(1)}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-accent"
              >
                &larr; Back to Review
              </button>
              <button
                onClick={executeAccepted}
                disabled={
                  executing ||
                  Object.values(suggestionStatus).filter(
                    (s) => s === "accepted"
                  ).length === 0
                }
                className="px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-medium hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {executing ? "Executing..." : "Execute All Accepted"}
              </button>
            </div>
          </div>
          {/* Show suggestion cards with their execution status */}
          <div className="space-y-3">
            {suggestions
              .filter(
                (s) =>
                  suggestionStatus[s.id] === "accepted" ||
                  suggestionStatus[s.id] === "executing" ||
                  suggestionStatus[s.id] === "done" ||
                  suggestionStatus[s.id] === "error"
              )
              .map((s) => (
                <SuggestionCard
                  key={s.id}
                  suggestion={s}
                  status={suggestionStatus[s.id]}
                  onAccept={() => {}}
                  onDismiss={() => {}}
                />
              ))}
          </div>
          {Object.values(suggestionStatus).some((s) => s === "done") && (
            <div className="flex justify-end">
              <button
                onClick={() => updateStep(3)}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
              >
                Update Docs &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Update governance */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold mb-3">Update Governance Docs</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Update TODO.md and CHANGELOG.md to reflect the changes made.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => updateStep(2)}
                className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:bg-accent"
              >
                &larr; Back
              </button>
              <button
                onClick={updateDocs}
                disabled={updating}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {updating ? "Updating..." : "Update Docs"}
              </button>
            </div>
          </div>
          {updateResult && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <h3 className="font-semibold text-emerald-400 mb-2">
                Docs Updated
              </h3>
              <p className="text-sm text-muted-foreground">
                Updated: {updateResult.updated.join(", ")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl"><p className="text-muted-foreground">Loading...</p></div>}>
      <SetupPageContent />
    </Suspense>
  );
}
