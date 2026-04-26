import { toast } from "sonner";

interface ApiErrorPayload {
  error?: string;
  message?: string;
  issues?: Array<{ message?: string; path?: Array<string | number> }>;
}

/**
 * Affiche un toast d'erreur contextualisé à partir d'une réponse fetch.
 * À utiliser dans les handlers UI après un fetch (POST/PATCH/DELETE).
 *
 *   if (!res.ok) { await showApiError(res, "Sauvegarde impossible"); return; }
 */
export async function showApiError(
  res: Response,
  fallback = "Une erreur est survenue."
): Promise<void> {
  let payload: ApiErrorPayload | null = null;
  try {
    payload = (await res.clone().json()) as ApiErrorPayload;
  } catch {
    payload = null;
  }

  if (res.status === 401) {
    toast.error("Session expirée", {
      description: "Reconnectez-vous pour continuer.",
    });
    return;
  }
  if (res.status === 403) {
    toast.error("Action non autorisée", {
      description: "Votre rôle ne permet pas cette opération.",
    });
    return;
  }
  if (res.status === 404) {
    toast.error("Ressource introuvable", {
      description: payload?.error ?? "L'élément demandé n'existe plus.",
    });
    return;
  }
  if (res.status === 422 && payload?.issues?.length) {
    const first = payload.issues[0];
    toast.error("Données invalides", {
      description: first?.message ?? "Vérifiez les champs du formulaire.",
    });
    return;
  }
  if (res.status >= 500) {
    toast.error("Erreur serveur", {
      description: "Réessayez dans quelques instants.",
    });
    return;
  }

  toast.error(fallback, {
    description: payload?.error ?? payload?.message ?? undefined,
  });
}

/** Toast d'erreur générique (réseau, exception JS). */
export function showNetworkError(
  err: unknown,
  fallback = "Erreur réseau"
): void {
  const description = err instanceof Error ? err.message : undefined;
  toast.error(fallback, { description });
}
