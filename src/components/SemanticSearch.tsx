"use client";

import { useState } from "react";
import { Search, Loader2, DatabaseZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

type SearchResult = {
  id: string;
  score: number;
  metadata: {
    title: string;
    description: string;
    lastModified: string;
  };
};

export function SemanticSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isDeepIndexing, setIsDeepIndexing] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) {
      setResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Search failed");
      
      setResults(data.data.results);
    } catch (err: any) {
      toast({
        title: "Search Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  }

  async function handleIndex(deep: boolean = false) {
    setIsIndexing(true);
    setIsDeepIndexing(deep);
    try {
      const res = await fetch(`/api/setup/index-vectors${deep ? '?deep=true' : ''}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Indexing failed");
      
      toast({
        title: "Indexing Complete",
        description: `Successfully indexed ${data.data.indexedCount} projects.`,
      });
    } catch (err: any) {
      toast({
        title: "Indexing Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsIndexing(false);
      setIsDeepIndexing(false);
    }
  }

  return (
    <div className="hud-card p-4 sm:p-5 mb-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Search className="h-4 w-4" /> Semantic Local Search
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleIndex(false)}
            disabled={isIndexing}
            className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-accent/50 hover:bg-accent text-accent-foreground disabled:opacity-50 transition-colors flex items-center gap-1"
            title="Fast rebuild (README only)"
          >
            {isIndexing && !isDeepIndexing ? <Loader2 className="h-3 w-3 animate-spin" /> : <DatabaseZap className="h-3 w-3" />}
            {isIndexing && !isDeepIndexing ? "Indexing..." : "Fast Index"}
          </button>
          
          <button
            onClick={() => handleIndex(true)}
            disabled={isIndexing}
            className="text-[10px] font-mono uppercase px-2 py-1 rounded bg-primary/20 hover:bg-primary/30 text-primary disabled:opacity-50 transition-colors flex items-center gap-1 border border-primary/30"
            title="Deep rebuild (Parses all code files in src/)"
          >
            {isIndexing && isDeepIndexing ? <Loader2 className="h-3 w-3 animate-spin" /> : <DatabaseZap className="h-3 w-3" />}
            {isIndexing && isDeepIndexing ? "Deep Indexing..." : "Deep Index"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., projects related to video processing..."
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 font-mono"
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </button>
      </form>

      {/* Results view */}
      {results && (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          {results.length === 0 ? (
            <p className="text-sm font-mono text-muted-foreground">No matches found.</p>
          ) : (
            results.map((r) => (
              <div key={r.id} className="p-3 bg-accent/30 rounded border border-accent flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-primary">{r.metadata.title}</span>
                  <span className="text-[10px] font-mono text-muted-foreground bg-background px-2 py-0.5 rounded">
                    Score: {(r.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{r.metadata.description}</p>
                <div className="text-[10px] font-mono text-muted-foreground/60 break-all truncate">
                  {r.id}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
