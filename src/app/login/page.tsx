"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Github, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Login Failed");
      }

      toast({
        title: "Access Granted",
        description: "Welcome to the Command Center.",
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
      });
      
      // Let the middleware register the cookie
      setTimeout(() => {
        router.push("/");
        router.refresh(); // Force a full re-evaluation of layout and edge middleware
      }, 500);

    } catch (err: any) {
      toast({
        title: "Access Denied",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 selection:bg-primary/30">
      
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-16 w-16 bg-accent border border-primary/20 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-mono tracking-tight font-bold">
            RESTRICTED AREA
          </h1>
          <p className="text-sm font-mono text-muted-foreground uppercase tracking-widest">
            Enter Master Password
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <input 
                type="password"
                placeholder="••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full h-12 bg-background border border-border rounded-lg px-4 font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-lg"
                autoFocus
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading || !password}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-mono uppercase tracking-wider font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-primary/20"
            >
              {isLoading ? "Authenticating..." : "Unlock"}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        {/* Footer Hint */}
        <p className="text-center font-mono text-[10px] text-muted-foreground uppercase">
          Requires ADMIN_PASSWORD defined in .env
        </p>

      </div>
    </div>
  );
}
