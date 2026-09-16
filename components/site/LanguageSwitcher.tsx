"use client";

import { usePathname } from "next/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { getAlternatePath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";

interface Props {
  locale: Locale;
  dict: Dictionary["languageSwitcher"];
  className?: string;
}

/**
 * Lien compact vers la page équivalente dans l'autre langue (« EN » / « FR »).
 * Masqué quand la page courante n'a pas (encore) de traduction, pour ne jamais
 * renvoyer l'utilisateur vers l'accueil par défaut.
 */
export default function LanguageSwitcher({ locale, dict, className }: Props) {
  const pathname = usePathname();
  const targets = LOCALES.filter((l) => l !== locale).flatMap((l) => {
    const href = getAlternatePath(pathname, l);
    return href ? [{ locale: l, href }] : [];
  });

  if (targets.length === 0) return null;

  return (
    <div role="group" aria-label={dict.label} className={cn("flex items-center gap-3", className)}>
      {targets.map((t) => (
        // <a> natif : chaque langue a son propre root layout (rechargement complet)
        <a
          key={t.locale}
          href={t.href}
          hrefLang={t.locale}
          lang={t.locale}
          aria-label={dict[t.locale]}
          title={dict[t.locale]}
          className="whitespace-nowrap px-1 py-1 text-[0.78rem] font-semibold uppercase tracking-[0.14em] opacity-80 transition-opacity duration-200 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          {t.locale}
        </a>
      ))}
    </div>
  );
}
