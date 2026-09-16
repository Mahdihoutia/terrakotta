"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { ArrowLeft, Loader2, ShieldAlert, Zap } from "lucide-react";

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

function BrandPanel({ subtitle }: { subtitle: string }) {
  return (
    <div
      className="hidden lg:flex lg:w-[44%] flex-col relative overflow-hidden"
      style={{ background: "#0D1B35" }}
    >
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,1) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -top-24 -left-24 w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)" }}
      />
      <div className="relative z-10 flex flex-1 flex-col items-start justify-center px-14">
        <div className="mb-12 flex items-center gap-3">
          <Zap
            className="h-8 w-8 rotate-12"
            style={{ fill: "#3B82F6", color: "#3B82F6", filter: "drop-shadow(0 0 12px rgba(59,130,246,0.6))" }}
          />
          <span
            className="text-[1.55rem] font-bold tracking-[0.12em] text-white"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            KILOWATER
          </span>
        </div>
        <h1
          className="mb-4 text-[3.2rem] font-light leading-[1.1] text-white"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Nouveau<br />
          <em className="font-semibold not-italic" style={{ color: "#3B82F6" }}>
            mot de passe
          </em>
        </h1>
        <p className="max-w-[280px] text-sm font-light leading-relaxed" style={{ color: "rgba(191,219,254,0.65)" }}>
          {subtitle}
        </p>
        <div className="mt-12 flex items-center gap-3">
          <div className="h-px w-8" style={{ background: "#3B82F6" }} />
          <div className="h-px w-24" style={{ background: "rgba(59,130,246,0.25)" }} />
          <div className="h-px w-4" style={{ background: "rgba(59,130,246,0.12)" }} />
        </div>
      </div>
      <div className="relative z-10 px-14 pb-10">
        <p className="text-[0.68rem] uppercase tracking-[0.2em]" style={{ color: "rgba(148,163,184,0.45)" }}>
          Espace privé · Accès restreint
        </p>
      </div>
    </div>
  );
}

const inputStyle = "w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#0D1B35] placeholder:text-[#9a8a7c] transition-all outline-none";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [emailMasked, setEmailMasked] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setTokenError("Lien invalide — jeton manquant.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          const j = await res.json().catch(() => null);
          setTokenError(j?.message ?? "Lien invalide ou expiré.");
          return;
        }
        const data = (await res.json()) as { emailMasked: string };
        setEmailMasked(data.emailMasked);
      } catch {
        setTokenError("Impossible de vérifier le lien. Réessayez.");
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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setSubmitError(j?.message ?? "Réinitialisation impossible.");
        return;
      }
      // Succès — retour au login avec bannière de confirmation.
      router.replace("/auth/login?reset=success");
    } catch {
      setSubmitError("Erreur réseau. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex w-full max-w-[400px] items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#6b5b50]" />
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="w-full max-w-[400px]">
        <div
          className="mb-5 flex h-12 w-12 items-center justify-center rounded-full"
          style={{ background: "rgba(245,158,11,0.12)" }}
        >
          <ShieldAlert className="h-6 w-6" style={{ color: "#d97706" }} />
        </div>
        <h2
          className="mb-2 text-[1.9rem] font-semibold text-[#0D1B35]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Lien invalide
        </h2>
        <p className="text-sm leading-relaxed text-[#6b5b50]">{tokenError}</p>
        <Link
          href="/auth/forgot-password"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#0D1B35] transition-colors hover:text-[#1D4ED8]"
        >
          Demander un nouveau lien
        </Link>
        <br />
        <Link
          href="/auth/login"
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#6b5b50] transition-colors hover:text-[#0D1B35]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-8">
        <h2
          className="mb-1 text-[1.9rem] font-semibold text-[#0D1B35]"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          Nouveau mot de passe
        </h2>
        <p className="text-sm text-[#6b5b50]">
          {emailMasked ? (
            <>
              Choisissez un nouveau mot de passe pour <strong className="text-[#0D1B35]">{emailMasked}</strong>.
            </>
          ) : (
            "Choisissez un nouveau mot de passe."
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="pw" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#0D1B35]">
            Nouveau mot de passe
          </label>
          <input
            id="pw"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 caractères"
            className={inputStyle}
            style={{ borderColor: "#e2dcd5" }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3B82F6";
              e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.10)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2dcd5";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        <div>
          <label htmlFor="pw2" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#0D1B35]">
            Confirmation
          </label>
          <input
            id="pw2"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ressaisissez le mot de passe"
            className={inputStyle}
            style={{ borderColor: "#e2dcd5" }}
            onFocus={(e) => {
              e.target.style.borderColor = "#3B82F6";
              e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.10)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#e2dcd5";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {submitError && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "#fecaca", background: "#fff5f5", color: "#b91c1c" }}
          >
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || password.length < 8 || password !== confirm}
          className="group relative w-full overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ background: "#0D1B35" }}
          onMouseEnter={(e) => {
            if (!submitting) (e.currentTarget as HTMLButtonElement).style.background = "#1D4ED8";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#0D1B35";
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enregistrement…
              </>
            ) : (
              <>
                Réinitialiser mon mot de passe
                <Zap className="h-4 w-4" style={{ fill: "#3B82F6", color: "#3B82F6" }} />
              </>
            )}
          </span>
        </button>
      </form>

      <Link
        href="/auth/login"
        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#6b5b50] transition-colors hover:text-[#0D1B35]"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour à la connexion
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className={`${cormorant.variable} ${manrope.variable} flex min-h-screen`}
      style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
    >
      <BrandPanel subtitle="Définissez un nouveau mot de passe sécurisé pour accéder à votre tableau de bord." />
      <div
        className="flex flex-1 flex-col items-center justify-center px-8 py-12"
        style={{ background: "#FAF8F5" }}
      >
        <Suspense
          fallback={
            <div className="flex w-full max-w-[400px] items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#6b5b50]" />
            </div>
          }
        >
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
