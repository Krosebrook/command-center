"use client";

import { cn } from "@/lib/utils";

interface Step {
  label: string;
  description: string;
}

interface SetupStepperProps {
  currentStep: number;
  steps: Step[];
}

export function SetupStepper({ currentStep, steps }: SetupStepperProps) {
  return (
    <div className="hud-card p-4 sm:p-5" role="navigation" aria-label="Setup progress">
      <div className="flex items-start">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isFuture = i > currentStep;

          return (
            <div key={i} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-mono font-bold transition-all",
                    isCompleted && "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_8px_hsl(160_84%_39%/0.2)]",
                    isCurrent && "border-primary bg-primary/10 text-primary shadow-glow",
                    isFuture && "border-border bg-accent text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-[10px] font-mono font-semibold uppercase tracking-wider leading-tight",
                    isCurrent && "text-primary",
                    isCompleted && "text-emerald-400",
                    isFuture && "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 text-[9px] text-muted-foreground max-w-[80px] sm:max-w-[100px] leading-tight hidden sm:block">
                  {step.description}
                </span>
              </div>

              {i < steps.length - 1 && (
                <div className="flex-1 flex items-center pt-4 px-2">
                  <div
                    className={cn(
                      "h-px w-full rounded-full transition-all",
                      i < currentStep ? "bg-emerald-500 shadow-[0_0_4px_hsl(160_84%_39%/0.3)]" : "bg-border",
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
