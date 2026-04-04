"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lead } from "@/types";

interface UseLeadsReturn {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  addLead: (lead: Omit<Lead, "id" | "dateCreation" | "dateMiseAJour">) => Promise<Lead | null>;
  updateLead: (id: string, data: Partial<Lead>) => Promise<Lead | null>;
  deleteLead: (id: string) => Promise<boolean>;
  convertToContact: (id: string) => Promise<string | null>;
  refresh: () => Promise<void>;
}

/** Hook pour gérer les leads via l'API (Supabase / Prisma) */
export function useLeads(): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/leads");
      if (!res.ok) throw new Error("Erreur lors du chargement des leads");
      const data: Lead[] = await res.json();
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const addLead = useCallback(
    async (lead: Omit<Lead, "id" | "dateCreation" | "dateMiseAJour">): Promise<Lead | null> => {
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(lead),
        });
        if (!res.ok) throw new Error("Erreur lors de la création");
        const newLead: Lead = await res.json();
        setLeads((prev) => [newLead, ...prev]);
        return newLead;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        return null;
      }
    },
    []
  );

  const updateLead = useCallback(
    async (id: string, data: Partial<Lead>): Promise<Lead | null> => {
      try {
        const res = await fetch(`/api/leads/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Erreur lors de la mise à jour");
        const updated: Lead = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
        return null;
      }
    },
    []
  );

  const deleteLead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setLeads((prev) => prev.filter((l) => l.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return false;
    }
  }, []);

  const convertToContact = useCallback(async (id: string): Promise<string | null> => {
    try {
      const res = await fetch(`/api/leads/${id}/convert`, { method: "POST" });
      if (!res.ok) throw new Error("Erreur lors de la conversion");
      const data = await res.json();
      setLeads((prev) => prev.filter((l) => l.id !== id));
      return data.clientId;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    }
  }, []);

  return { leads, loading, error, addLead, updateLead, deleteLead, convertToContact, refresh: fetchLeads };
}
