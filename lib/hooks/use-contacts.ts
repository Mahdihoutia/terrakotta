"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientType, LeadStatus, LeadSource } from "@/types";

export interface Contact {
  id: string;
  nom: string;
  prenom: string | null;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  codePostal: string | null;
  departement: string | null;
  raisonSociale: string | null;
  siret: string | null;
  fonction: string | null;
  type: ClientType;
  source: LeadSource;
  statut: LeadStatus;
  budgetEstime: number | null;
  notes: string | null;
  projetsCount: number;
  devisCount: number;
  dateCreation: string;
  dateMiseAJour: string;
}

type ContactCreate = Omit<Contact, "id" | "projetsCount" | "devisCount" | "dateCreation" | "dateMiseAJour">;

interface UseContactsReturn {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  addContact: (contact: ContactCreate) => Promise<Contact | null>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useContacts(): UseContactsReturn {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Erreur lors du chargement des contacts");
      const data: Contact[] = await res.json();
      setContacts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const addContact = useCallback(async (contact: ContactCreate): Promise<Contact | null> => {
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contact),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? `Erreur ${res.status}`);
      }
      const newContact: Contact = await res.json();
      setContacts((prev) => [newContact, ...prev]);
      setError(null);
      return newContact;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    }
  }, []);

  const updateContact = useCallback(async (id: string, data: Partial<Contact>): Promise<Contact | null> => {
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      const updated: Contact = await res.json();
      setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return null;
    }
  }, []);

  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      setContacts((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      return false;
    }
  }, []);

  return { contacts, loading, error, addContact, updateContact, deleteContact, refresh: fetchContacts };
}
