"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Zap } from "lucide-react";

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
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
        {/* Motif de fond — grille électrique */}
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

        {/* Halo bleu en bas à droite */}
        <div
          className="absolute -bottom-32 -right-32 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
          }}
        />

        {/* Halo bleu en haut à gauche */}
        <div
          className="absolute -top-24 -left-24 w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Contenu centré */}
        <div className="relative z-10 flex flex-1 flex-col items-start justify-center px-14">
          {/* Logo */}
          <div className="mb-12 flex items-center gap-3">
            <div className="relative">
              <Zap
                className="h-8 w-8 rotate-12"
                style={{
                  fill: "#3B82F6",
                  color: "#3B82F6",
                  filter: "drop-shadow(0 0 12px rgba(59,130,246,0.6))",
                }}
              />
            </div>
            <span
              className="text-[1.55rem] font-bold tracking-[0.12em] text-white"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              KILOWATER
            </span>
          </div>

          {/* Titre principal */}
          <h1
            className="mb-4 text-[3.2rem] font-light leading-[1.1] text-white"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            Tableau de<br />
            <em className="font-semibold not-italic" style={{ color: "#3B82F6" }}>
              pilotage
            </em>
          </h1>

          <p
            className="max-w-[280px] text-sm font-light leading-relaxed"
            style={{ color: "rgba(191,219,254,0.65)" }}
          >
            Bureau d&rsquo;étude en rénovation énergétique — espace réservé à l&rsquo;administrateur.
          </p>

          {/* Séparateur décoratif */}
          <div className="mt-12 flex items-center gap-3">
            <div className="h-px w-8" style={{ background: "#3B82F6" }} />
            <div
              className="h-px w-24"
              style={{ background: "rgba(59,130,246,0.25)" }}
            />
            <div
              className="h-px w-4"
              style={{ background: "rgba(59,130,246,0.12)" }}
            />
          </div>
        </div>

        {/* Footer gauche */}
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
        {/* Header mobile uniquement */}
        <div className="mb-10 flex flex-col items-center lg:hidden">
          <div className="mb-3 flex items-center gap-2">
            <Zap
              className="h-6 w-6 rotate-12"
              style={{ fill: "#3B82F6", color: "#3B82F6" }}
            />
            <span
              className="text-xl font-bold tracking-[0.1em] text-[#0D1B35]"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              KILOWATER
            </span>
          </div>
          <p className="text-sm text-[#6b5b50]">Tableau de bord — Espace privé</p>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Titre formulaire */}
          <div className="mb-8">
            <h2
              className="mb-1 text-[1.9rem] font-semibold text-[#0D1B35]"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              Connexion
            </h2>
            <p className="text-sm text-[#6b5b50]">
              Identifiez-vous pour accéder au tableau de bord.
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
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
                placeholder="mahdi.houtia@gmail.com"
                className="w-full rounded-xl border bg-white px-4 py-3 text-sm text-[#0D1B35] placeholder:text-[#9a8a7c] transition-all outline-none"
                style={{
                  borderColor: "#e2dcd5",
                }}
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

            {/* Mot de passe */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#0D1B35]"
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

            {/* Erreur */}
            {error && (
              <div
                className="rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: "#fecaca",
                  background: "#fff5f5",
                  color: "#b91c1c",
                }}
              >
                {error}
              </div>
            )}

            {/* Bouton */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: "#0D1B35" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#1D4ED8";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#0D1B35";
              }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    Se connecter
                    <Zap className="h-4 w-4" style={{ fill: "#3B82F6", color: "#3B82F6" }} />
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: "#FAF8F5" }}
        >
          <p className="text-sm text-[#6b5b50]">Chargement…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
