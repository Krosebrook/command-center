"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp } from "lucide-react";

interface ScanRecord {
  id: number;
  timestamp: string;
  totalSize: number;
  totalFiles: number;
  folderCount: number;
}

export function AnalyticsCharts() {
  const [data, setData] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        const json = await res.json();
        if (json.data?.history) {
          setData(json.data.history);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="hud-card p-5 animate-pulse h-32 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  }

  if (data.length < 2) {
    return (
      <div className="hud-card p-5 border-dashed border-muted flex flex-col items-center justify-center text-center py-8">
        <TrendingUp className="h-6 w-6 text-muted-foreground/50 mb-2" />
        <p className="text-sm font-mono text-muted-foreground">Not enough data to graph.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Background scans will populate this over time.</p>
      </div>
    );
  }

  // Normalize data for a simple SVG sparkline
  const maxFiles = Math.max(...data.map(d => d.totalFiles));
  const minFiles = Math.min(...data.map(d => d.totalFiles)) * 0.95; // 5% padding on bottom
  
  const width = 100;
  const height = 40;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d.totalFiles - minFiles) / (maxFiles - minFiles)) * height;
    return \`\${x},\${Math.max(0, y)}\`;
  }).join(" ");

  const latest = data[data.length - 1];
  const first = data[0];
  const diff = latest.totalFiles - first.totalFiles;
  const isUp = diff > 0;

  return (
    <div className="hud-card p-4 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-1">
            Total Files (30 Days)
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold stat-value">{latest.totalFiles.toLocaleString()}</span>
            <span className={\`text-xs font-mono px-2 py-0.5 rounded \${isUp ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}\`}>
              {isUp ? "+" : ""}{diff} files
            </span>
          </div>
        </div>
        
        <div className="w-32 h-12 relative">
           <svg viewBox={\`0 0 \${width} \${height}\`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
             {/* Gradient fill */}
             <defs>
               <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                 <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                 <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.0" />
               </linearGradient>
             </defs>
             <polyline
               fill="url(#chartGradient)"
               points={\`0,\${height} \${points} \${width},\${height}\`}
             />
             {/* Line */}
             <polyline
               fill="none"
               stroke="hsl(var(--primary))"
               strokeWidth="2"
               strokeLinejoin="round"
               strokeLinecap="round"
               points={points}
             />
           </svg>
        </div>
      </div>
    </div>
  );
}
