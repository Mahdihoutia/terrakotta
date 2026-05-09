"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { CheckCircle2, Loader2, ShieldAlert, Zap } from "lucide-react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

interface InvitationInfo {
  email: string;
  name: string | null;
  role: string;
  expiresAt: string;
}

function Form() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenError("Lien invalide — token manquant.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `/api/users/invite/accept?token=${encodeURIComponent(token)}`,
        );
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          setTokenError(j?.message ?? "Lien invalide ou expiré.");
          return;
        }
        const data = (await res.json()) as InvitationInfo;
        setInfo(data);
      } catch {
        setTokenError("Impossible de vérifier l'invitation. Réessayez.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (password.length < 8) {
      setSubmitError("Mot de passe : 8 caractères minimum.");
      return;
    }
    if (password !== confirm) {
      setSubmitError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/users/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setSubmitError(j?.message ?? "Activation impossible.");
        return;
      }
      // Connexion automatique
      const signed = await signIn("credentials", {
        redirect: false,
        email: info!.email,
        password,
      });
      if (signed?.ok) {
        router.replace("/dashboard");
      } else {
        // Le compte est créé — fallback vers la page de login.
        router.replace("/auth/login");
      }
    } catch {
      setSubmitError("Erreur réseau. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="mx-auto max-w-md rounded-lg border bg-card p-8 text-center shadow-sm">
        <ShieldAlert className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-xl font-semibold">Lien invalide</h1>
        <p className="mt-2 text-sm text-muted-foreground">{tokenError}</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Demandez à votre administrateur de vous renvoyer une invitation.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-lg border bg-card p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
          <Zap className="h-4 w-4 rotate-12 text-primary" />
        </div>
        <span className="text-sm font-semibold tracking-wide">KILOWATER</span>
      </div>

      <h1 className="text-2xl font-semibold">Activez votre compte</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Définissez votre mot de passe pour accéder au tableau de bord.
      </p>

      <div className="mt-6 rounded-md bg-muted/50 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{info?.email}</span>
        </div>
        {info?.name && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Nom</span>
            <span className="font-medium">{info.name}</span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between">
          <span className="text-muted-foreground">Rôle</span>
          <span className="font-medium">{info?.role}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="pw">
            Nouveau mot de passe
          </label>
          <input
            id="pw"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Minimum 8 caractères"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            required
            minLength={8}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="pw2">
            Confirmation
          </label>
          <input
            id="pw2"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            required
            minLength={8}
          />
        </div>
        {submitError && (
          <p className="text-sm text-red-600">{submitError}</p>
        )}
        <button
          type="submit"
          disabled={submitting || password.length < 8 || password !== confirm}
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
          )}
          Activer et me connecter
        </button>
      </form>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <div
      className={`${cormorant.variable} ${manrope.variable} flex min-h-screen items-center justify-center bg-tk-bg px-4 py-12`}
      style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
    >
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <Form />
      </Suspense>
    </div>
  );
}
