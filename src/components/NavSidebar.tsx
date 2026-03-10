"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/projects", label: "Projects", icon: "folder" },
  { href: "/agents", label: "Agents", icon: "bot" },
  { href: "/automations", label: "Automations", icon: "zap" },
  { href: "/launch", label: "AI Launcher", icon: "rocket" },
  { href: "/cleanup", label: "Cleanup", icon: "trash" },
  { href: "/setup", label: "Setup", icon: "compass" },
];

const icons: Record<string, string> = {
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  folder: "M3 5a2 2 0 012-2h4l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5z",
  bot: "M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7v1H3v-1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2zM7 18a1 1 0 001 1h8a1 1 0 001-1",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  rocket: "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09zM12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z",
  trash: "M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14",
  compass: "M12 22a10 10 0 100-20 10 10 0 000 20zM16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z",
};

export function NavSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [watcherStatus, setWatcherStatus] = useState("idle");

  useEffect(() => {
    fetch("/api/setup/watcher-status")
      .then(res => res.json())
      .then(data => {
        if (data.status) setWatcherStatus(data.status);
      })
      .catch((e) => console.error("Watcher init failed", e));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Signal indicator */}
            <div className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight font-mono uppercase">
                <span className="text-primary text-glow">D:\</span>
                <span className="text-foreground/80"> CMD</span>
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mt-0.5">
                Control Center
              </p>
            </div>
          </div>
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation menu"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                isActive
                  ? "bg-primary/8 text-primary nav-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
              )}
            >
              <svg
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive && "drop-shadow-[0_0_6px_hsl(210_100%_52%/0.5)]",
                )}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={icons[item.icon]} />
              </svg>
              <span className="font-mono text-xs uppercase tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${watcherStatus === 'watching' ? 'bg-emerald-400 animate-pulse drop-shadow-[0_0_4px_rgba(52,211,153,0.8)]' : 'bg-muted'} `} aria-hidden="true" />
          <p className={`text-[10px] font-mono uppercase tracking-wider ${watcherStatus === 'watching' ? 'text-emerald-400/90' : 'text-muted-foreground'}`}>
            {watcherStatus === 'watching' ? 'Live Sink Active' : 'Live Sync Offline'}
          </p>
        </div>
        <button 
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            globalThis.location.href = '/login';
          }}
          className="text-[10px] font-mono uppercase text-muted-foreground hover:text-destructive flex items-center gap-2 transition-colors w-fit"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Lock Dashboard
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className={cn(
          "fixed top-3 left-3 z-50 lg:hidden p-2.5 rounded-lg",
          "bg-card/90 backdrop-blur border border-border",
          "hover:bg-accent hover:shadow-glow transition-all",
        )}
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen ? "true" : "false"}
        aria-controls="nav-sidebar"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="nav-sidebar"
        className={cn(
          "fixed left-0 top-0 h-screen w-60 flex flex-col z-50",
          "bg-card/95 backdrop-blur-xl border-r border-border/50",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Main"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
