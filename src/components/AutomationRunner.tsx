"use client";

import { useState } from "react";
import { Play, Loader2, FileTerminal } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function AutomationRunner({ targetPath, label }: { targetPath: string, label: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ output: string; status: string; command: string; failed?: boolean } | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && jobId) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(\`/api/automations/status/\${jobId}\`);
          if (!res.ok) return;
          const data = await res.json();
          const job = data.data.job;
          
          setLogs({
            output: job.output || "Waiting for output...",
            status: job.status,
            command: job.script_path,
            failed: job.status === "failed"
          });

          if (job.status === "completed" || job.status === "failed") {
            setIsRunning(false);
            if (job.status === "failed") {
              toast({ title: "Workflow Failed", variant: "destructive" });
            } else {
              toast({ title: "Workflow Completed Successfully" });
            }
          }
        } catch (err) {
          console.error("Failed to poll status", err);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [isRunning, jobId]);

  async function handleRun() {
    setIsRunning(true);
    setJobId(null);
    setLogs(null);
    setShowLogs(true);
    
    try {
      const res = await fetch("/api/automations/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPath }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Execution failed");
      
      // We receive the pending job ID
      setJobId(data.data.jobId);
      setLogs({ output: "Job queued...", status: "pending", command: targetPath });
      
    } catch (err: any) {
      toast({
        title: "Workflow Error",
        description: err.message,
        variant: "destructive",
      });
      setLogs({ output: err.message, status: "failed", command: "Unknown", failed: true });
      setIsRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex items-center gap-2">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="inline-flex items-center justify-center rounded text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 bg-primary/20 text-primary hover:bg-primary/30 h-6 px-2 font-mono uppercase tracking-wider"
        >
          {isRunning ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Play className="h-3 w-3 mr-1" />}
          Run {label}
        </button>
        {logs && (
          <button 
            onClick={() => setShowLogs(!showLogs)}
            className="text-[10px] text-muted-foreground hover:text-foreground font-mono flex items-center gap-1"
          >
            <FileTerminal className="h-3 w-3" /> {showLogs ? "Hide Logs" : "View Logs"}
          </button>
        )}
      </div>

      {showLogs && (isRunning || logs) && (
        <div className="bg-black/50 border border-border/50 rounded-md p-3 font-mono text-[10px] overflow-hidden">
          {isRunning && !logs && <p className="text-amber-400 animate-pulse">Executing workflow...</p>}
          {logs && (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground">$ {logs.command}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase bg-accent px-2 py-0.5 rounded">
                    Status: {logs.status}
                  </span>
                  {isRunning && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                </div>
              </div>
              <pre className="text-emerald-400 whitespace-pre-wrap">{logs.output}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
