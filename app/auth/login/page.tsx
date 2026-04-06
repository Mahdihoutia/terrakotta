"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
    <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[#2C1810]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FAF8F5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#2C1810]">
            Terrakotta
          </h1>
          <p className="mt-1 text-sm text-[#6b5b50]">
            Connectez-vous au tableau de bord
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-[#d9d0c4] bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[#3d2e22]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@terrakotta.fr"
                className="w-full rounded-lg border border-[#d9d0c4] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#2C1810] placeholder:text-[#9a8a7c] focus:border-[#8B4513] focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[#3d2e22]"
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
                placeholder="Votre mot de passe"
                className="w-full rounded-lg border border-[#d9d0c4] bg-[#FAF8F5] px-3.5 py-2.5 text-sm text-[#2C1810] placeholder:text-[#9a8a7c] focus:border-[#8B4513] focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 transition-colors"
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-[#8B4513] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-[#9a8a7c]">
          Espace r&eacute;serv&eacute; &agrave; l&rsquo;administrateur
          Terrakotta
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FAF8F5]">
          <p className="text-sm text-[#6b5b50]">Chargement...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
