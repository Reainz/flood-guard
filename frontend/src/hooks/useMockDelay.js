import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Drives the fake "computation" the placeholder screens perform: an idle state, a
 * skeleton phase of `ms`, then a settled result. There is nothing to compute — the
 * delay exists so the reveal reads as work rather than a jump cut.
 *
 * @returns {{ phase: "idle"|"running"|"done", start: () => void, reset: () => void }}
 */
export function useMockDelay(ms = 800) {
  const [phase, setPhase] = useState("idle");
  const timer = useRef(null);

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  useEffect(() => clear, [clear]);

  const start = useCallback(() => {
    clear();
    setPhase("running");
    timer.current = setTimeout(() => setPhase("done"), ms);
  }, [clear, ms]);

  const reset = useCallback(() => {
    clear();
    setPhase("idle");
  }, [clear]);

  return { phase, start, reset };
}
