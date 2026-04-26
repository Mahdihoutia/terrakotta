"use client";

import { useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

export interface AutosaveResult {
  status: AutosaveStatus;
  lastSavedAt: Date | null;
  /** Force un save immédiat. Utile pour le bouton manuel. */
  flush: () => Promise<void>;
}

/**
 * Hook générique d'autosave debounced.
 *
 * - Surveille `value` ; après `delayMs` d'inactivité, appelle `saveFn(value)`.
 * - Le premier rendu n'enclenche pas d'autosave (évite de save l'état initial).
 * - `enabled = false` met le hook en pause (ex : tant que la donnée n'est pas chargée).
 *
 * Le `saveFn` doit throw en cas d'échec — le hook passera en `error`.
 */
export function useDebouncedAutosave<T>(
  value: T,
  saveFn: (value: T) => Promise<void>,
  options: { delayMs?: number; enabled?: boolean } = {}
): AutosaveResult {
  const { delayMs = 800, enabled = true } = options;

  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Refs pour éviter de re-trigger l'effet à chaque changement de saveFn
  const saveFnRef = useRef(saveFn);
  const valueRef = useRef(value);
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);

  saveFnRef.current = saveFn;
  valueRef.current = value;

  async function runSave(): Promise<void> {
    // S'il y a un save en cours, attendre qu'il se termine
    if (inFlightRef.current) {
      try {
        await inFlightRef.current;
      } catch {
        // ignore — on repart sur un nouveau save
      }
    }
    setStatus("saving");
    const promise = (async () => {
      try {
        await saveFnRef.current(valueRef.current);
        setStatus("saved");
        setLastSavedAt(new Date());
      } catch (err) {
        setStatus("error");
        throw err;
      }
    })();
    inFlightRef.current = promise;
    try {
      await promise;
    } finally {
      if (inFlightRef.current === promise) {
        inFlightRef.current = null;
      }
    }
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!enabled) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      runSave().catch(() => {
        /* status déjà à "error" */
      });
    }, delayMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delayMs, enabled]);

  async function flush(): Promise<void> {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await runSave();
  }

  return { status, lastSavedAt, flush };
}
