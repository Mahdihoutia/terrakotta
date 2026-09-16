"use client";

import { useState } from "react";
import Link from "next/link";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { ArrowLeft, CheckCircle2, Zap } from "lucide-react";

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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; link?: string; error?: string }
        | null;

      if (!res.ok || !data?.ok) {
        setError("Une erreur est survenue. Veuillez réessayer.");
        return;
      }
      // Fallback dev : lien renvoyé si Resend non configuré.
      if (data.link) setDevLink(data.link);
      setSent(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className={`${cormorant.variable} ${manrope.variable} flex min-h-screen`}
      style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
    >
      {/* ── Panneau gauche — branding ───────────────────────────── */}
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
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute -top-24 -left-24 w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 flex flex-1 flex-col items-start justify-center px-14">
          <div className="mb-12 flex items-center gap-3">
            <Zap
              className="h-8 w-8 rotate-12"
              style={{
                fill: "#3B82F6",
                color: "#3B82F6",
                filter: "drop-shadow(0 0 12px rgba(59,130,246,0.6))",
              }}
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
            Mot de passe<br />
            <em className="font-semibold not-italic" style={{ color: "#3B82F6" }}>
              oublié ?
            </em>
          </h1>

          <p
            className="max-w-[280px] text-sm font-light leading-relaxed"
            style={{ color: "rgba(191,219,254,0.65)" }}
          >
            Indiquez votre adresse email — nous vous enverrons un lien sécurisé
            pour définir un nouveau mot de passe.
          </p>

          <div className="mt-12 flex items-center gap-3">
            <div className="h-px w-8" style={{ background: "#3B82F6" }} />
            <div className="h-px w-24" style={{ background: "rgba(59,130,246,0.25)" }} />
            <div className="h-px w-4" style={{ background: "rgba(59,130,246,0.12)" }} />
          </div>
        </div>

        <div className="relative z-10 px-14 pb-10">
          <p
            className="text-[0.68rem] uppercase tracking-[0.2em]"
            style={{ color: "rgba(148,163,184,0.45)" }}
          >
            Espace privé · Accès restreint
          </p>
        </div>
      </div>

      {/* ── Panneau droit — formulaire ──────────────────────────── */}
      <div
        className="flex flex-1 flex-col items-center justify-center px-8 py-12"
        style={{ background: "#FAF8F5" }}
      >
        <div className="mb-10 flex flex-col items-center lg:hidden">
          <div className="mb-3 flex items-center gap-2">
            <Zap className="h-6 w-6 rotate-12" style={{ fill: "#3B82F6", color: "#3B82F6" }} />
            <span
              className="text-xl font-bold tracking-[0.1em] text-[#0D1B35]"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              KILOWATER
            </span>
          </div>
          <p className="text-sm text-[#6b5b50]">Réinitialisation du mot de passe</p>
        </div>

        <div className="w-full max-w-[400px]">
          {sent ? (
            <div>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(34,197,94,0.12)" }}>
                <CheckCircle2 className="h-6 w-6" style={{ color: "#16a34a" }} />
              </div>
              <h2
                className="mb-2 text-[1.9rem] font-semibold text-[#0D1B35]"
                style={{ fontFamily: "var(--font-display), Georgia, serif" }}
              >
                Vérifiez vos emails
              </h2>
              <p className="text-sm leading-relaxed text-[#6b5b50]">
                Si un compte est associé à <strong className="text-[#0D1B35]">{email}</strong>,
                vous recevrez un lien pour réinitialiser votre mot de passe. Le
                lien expire dans 60 minutes.
              </p>

              {devLink && (
                <div
                  className="mt-5 rounded-xl border px-4 py-3 text-xs"
                  style={{ borderColor: "#fde68a", background: "#fffbeb", color: "#92400e" }}
                >
                  <p className="mb-1 font-semibold uppercase tracking-[0.1em]">Mode développement</p>
                  <p className="mb-2">Resend non configuré — lien direct :</p>
                  <a href={devLink} className="break-all font-medium underline" style={{ color: "#1D4ED8" }}>
                    {devLink}
                  </a>
                </div>
              )}

              <Link
                href="/auth/login"
                className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[#0D1B35] transition-colors hover:text-[#1D4ED8]"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2
                  className="mb-1 text-[1.9rem] font-semibold text-[#0D1B35]"
                  style={{ fontFamily: "var(--font-display), Georgia, serif" }}
                >
                  Mot de passe oublié
                </h2>
                <p className="text-sm text-[#6b5b50]">
                  Saisissez votre adresse email pour recevoir un lien de
                  réinitialisation.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#0D1B35]"
                  >
                    Adresse email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#0D1B35] placeholder:text-[#9a8a7c] transition-all outline-none"
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

                {error && (
                  <div
                    className="rounded-xl border px-4 py-3 text-sm"
                    style={{ borderColor: "#fecaca", background: "#fff5f5", color: "#b91c1c" }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: "#0D1B35" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#1D4ED8";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "#0D1B35";
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        Envoyer le lien
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
