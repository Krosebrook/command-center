"use client";

import { useState } from "react";
import { Play, Loader2, FileTerminal } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function AutomationRunner({ targetPath, label }: { targetPath: string, label: string }) {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<{ stdout: string; stderr: string; command: string; failed?: boolean } | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  async function handleRun() {
    setIsRunning(true);
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
      
      setLogs(data.data);
      if (data.data.failed) {
         toast({ title: "Workflow Failed", variant: "destructive" });
      } else {
         toast({ title: "Workflow Completed Successfully" });
      }
    } catch (err: any) {
      toast({
        title: "Workflow Error",
        description: err.message,
        variant: "destructive",
      });
      setLogs({ stdout: "", stderr: err.message, command: "Unknown", failed: true });
    } finally {
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
              <p className="text-muted-foreground">$ {logs.command}</p>
              {logs.stdout && <pre className="text-emerald-400 whitespace-pre-wrap">{logs.stdout}</pre>}
              {logs.stderr && <pre className="text-red-400 whitespace-pre-wrap">{logs.stderr}</pre>}
              {logs.failed && <p className="text-red-500 font-bold mt-2">[Process exited with error]</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
