"use client";

import { cn } from "@/lib/utils";

// -- Component --------------------------------------------------------------

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
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;
          const isFuture = i > currentStep;

          return (
            <div key={i} className="flex items-start flex-1 last:flex-none">
              {/* Step circle + text */}
              <div className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    isCompleted &&
                      "border-emerald-500 bg-emerald-500/10 text-emerald-400",
                    isCurrent &&
                      "border-primary bg-primary/10 text-primary",
                    isFuture &&
                      "border-border bg-accent text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    "mt-2 text-xs font-semibold leading-tight",
                    isCurrent && "text-primary",
                    isCompleted && "text-emerald-400",
                    isFuture && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 text-[10px] text-muted-foreground max-w-[100px] leading-tight">
                  {step.description}
                </span>
              </div>

              {/* Connecting line */}
              {i < steps.length - 1 && (
                <div className="flex-1 flex items-center pt-4 px-2">
                  <div
                    className={cn(
                      "h-0.5 w-full rounded-full transition-colors",
                      i < currentStep ? "bg-emerald-500" : "bg-border"
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
