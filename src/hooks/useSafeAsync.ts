"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseSafeAsyncOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export function useSafeAsync<T>(options: UseSafeAsyncOptions = {}) {
  const { timeoutMs = 30_000, retries = 0, retryDelayMs = 1000 } = options;
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, loading: false });
  const abortRef = useRef<AbortController | null>(null);

  const execute = useCallback(async (asyncFn: (signal: AbortSignal) => Promise<T>) => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ data: null, error: null, loading: true });

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (controller.signal.aborted) return;

      try {
        const result = await Promise.race([
          asyncFn(controller.signal),
          new Promise<never>((_, reject) => {
            const id = setTimeout(() => reject(new Error("Request timed out")), timeoutMs);
            controller.signal.addEventListener("abort", () => clearTimeout(id));
          }),
        ]);

        if (!controller.signal.aborted) {
          setState({ data: result, error: null, loading: false });
        }
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < retries && !controller.signal.aborted) {
          await new Promise(r => setTimeout(r, retryDelayMs * (attempt + 1)));
        }
      }
    }

    if (!controller.signal.aborted) {
      setState({ data: null, error: lastError, loading: false });
    }
  }, [timeoutMs, retries, retryDelayMs]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState({ data: null, error: null, loading: false });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  return { ...state, execute, reset };
}
