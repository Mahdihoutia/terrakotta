"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";
import { LOCALE_META, LOCALES, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { getAlternatePath } from "@/lib/i18n/routes";
import { cn } from "@/lib/utils";

interface Props {
  locale: Locale;
  dict: Dictionary["languageSwitcher"];
  /** Alignement du panneau sous le bouton. */
  align?: "end" | "center";
  className?: string;
}

/**
 * Menu déroulant de langue (pattern « disclosure » : bouton + liste de liens).
 * Chaque option pointe vers la page équivalente ; une langue sans traduction
 * de la page courante reste visible mais désactivée, jamais redirigée vers l'accueil.
 */
export default function LanguageSwitcher({ locale, dict, align = "end", className }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  /** Direction de focus à appliquer dès que la liste est montée (ouverture au clavier). */
  const pendingFocus = useRef<1 | -1 | null>(null);

  const options = LOCALES.map((l) => ({
    locale: l,
    href: l === locale ? null : getAlternatePath(pathname, l),
  }));

  /* Fermeture : clic extérieur, Échap, changement de page */
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (open && pendingFocus.current !== null) {
      focusItem(pendingFocus.current);
      pendingFocus.current = null;
    }
  }, [open]);

  /* Flèches haut/bas pour parcourir les options actives */
  function focusItem(direction: 1 | -1) {
    const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>("a[href]") ?? []);
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = index === -1 ? (direction === 1 ? 0 : items.length - 1) : (index + direction + items.length) % items.length;
    items[next]?.focus();
  }

  function onButtonKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (open) {
        focusItem(e.key === "ArrowDown" ? 1 : -1);
      } else {
        pendingFocus.current = e.key === "ArrowDown" ? 1 : -1;
        setOpen(true);
      }
    }
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(e.key === "ArrowDown" ? 1 : -1);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${dict.label}${locale === "fr" ? " : " : ": "}${LOCALE_META[locale].name}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        className="flex items-center gap-1 whitespace-nowrap px-1 py-1 text-[0.78rem] font-semibold uppercase tracking-[0.14em] transition-opacity duration-200 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
      >
        {locale}
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={cn("transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="language-menu"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            // Centrage via `x` : framer-motion pilote `transform`, une classe translate serait écrasée
            style={align === "center" ? { x: "-50%" } : undefined}
            className={cn("absolute top-full z-50 mt-3", align === "end" ? "right-0" : "left-1/2")}
          >
            <ul
              ref={listRef}
              id={listId}
              aria-label={dict.label}
              onKeyDown={onListKeyDown}
              className="w-52 overflow-hidden rounded-xl border border-[#E8F0FE] bg-white p-1.5 text-left normal-case tracking-normal shadow-[0_20px_45px_-12px_rgba(13,27,53,0.18)]"
            >
              {options.map((option) => {
                const meta = LOCALE_META[option.locale];
                const isCurrent = option.locale === locale;
                const code = (
                  <span className="w-6 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#94A3B8]">
                    {option.locale}
                  </span>
                );

                if (isCurrent) {
                  return (
                    <li key={option.locale}>
                      <span
                        aria-current="true"
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[0.85rem] font-semibold text-[#0D1B35]"
                      >
                        {code}
                        <span className="flex-1">{meta.name}</span>
                        <Check size={15} aria-hidden="true" className="text-[#2563EB]" />
                      </span>
                    </li>
                  );
                }

                if (!option.href) {
                  return (
                    <li key={option.locale}>
                      <span
                        aria-disabled="true"
                        lang={option.locale}
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[0.85rem] text-[#94A3B8]"
                      >
                        {code}
                        <span className="flex-1">
                          {meta.name}
                          <span className="block text-[0.7rem] leading-snug">{meta.unavailable}</span>
                        </span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={option.locale}>
                    {/* <a> natif : chaque langue a son propre root layout (rechargement complet) */}
                    <a
                      href={option.href}
                      hrefLang={option.locale}
                      lang={option.locale}
                      className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-[0.85rem] font-medium text-[#0D1B35] outline-none transition-colors duration-150 hover:bg-[#F0F7FF] hover:text-[#2563EB] focus-visible:bg-[#F0F7FF] focus-visible:text-[#2563EB]"
                    >
                      {code}
                      <span className="flex-1">{meta.name}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
