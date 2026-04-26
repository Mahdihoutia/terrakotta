"use client";

import { useCallback, useEffect, useState } from "react";

type SetValue<T> = T | ((prev: T) => T);

/**
 * Hook React typé pour persister un état dans localStorage.
 *
 * SSR-safe : le premier rendu retourne `initial`, puis le state est synchronisé
 * avec localStorage côté client dans un useEffect (évite les hydration mismatches).
 *
 * Synchronisation cross-onglets via l'event `storage`.
 *
 *   const [filters, setFilters] = useLocalStorage("terrakotta:projets:filters", {
 *     statut: "ALL", search: ""
 *   });
 */
export function useLocalStorage<T>(
  key: string,
  initial: T
): [T, (value: SetValue<T>) => void] {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);

  // Au mount : tenter de lire localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // Valeur corrompue : on garde l'initial
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Persister à chaque changement (après hydratation)
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota dépassé / mode privé : on ignore
    }
  }, [key, value, hydrated]);

  // Sync cross-onglets
  useEffect(() => {
    if (typeof window === "undefined") return;
    function onStorage(e: StorageEvent) {
      if (e.key !== key || e.newValue === null) return;
      try {
        setValue(JSON.parse(e.newValue) as T);
      } catch {
        /* noop */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  const set = useCallback((next: SetValue<T>) => {
    setValue((prev) =>
      typeof next === "function" ? (next as (p: T) => T)(prev) : next
    );
  }, []);

  return [value, set];
}
