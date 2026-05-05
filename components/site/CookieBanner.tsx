"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "kw_cookie_consent_v1";

type Consent = "accepted" | "rejected";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setVisible(true);
    } catch {
      // localStorage indisponible (SSR / privé) — ne rien afficher
    }
  }, []);

  function setConsent(value: Consent) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ value, date: new Date().toISOString() }),
      );
    } catch {}
    setVisible(false);
    // Hook : si Analytics ajouté plus tard, déclencher ici l'init si "accepted"
    window.dispatchEvent(new CustomEvent("kw:consent", { detail: value }));
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-live="polite"
          aria-label="Préférences cookies"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 md:px-6 md:pb-6"
        >
          <div className="mx-auto max-w-[1100px] bg-white border border-[#DBEAFE] shadow-[0_20px_60px_-20px_rgba(13,27,53,0.25)] p-5 md:p-6">
            <div className="flex flex-col md:flex-row items-start gap-5 md:gap-8">
              <div className="flex items-start gap-3 flex-1">
                <div className="hidden md:flex w-10 h-10 rounded-full bg-[#EFF6FF] items-center justify-center shrink-0 mt-0.5">
                  <Cookie size={18} className="text-[#2563EB]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[0.7rem] uppercase tracking-[0.18em] text-[#2563EB] mb-1.5">
                    Cookies & confidentialité
                  </p>
                  <p className="text-[0.88rem] text-[#0D1B35] leading-relaxed">
                    Nous utilisons uniquement des cookies <strong>strictement nécessaires</strong> au fonctionnement du site.
                    Des mesures d&apos;audience anonymes peuvent être activées avec votre accord.{" "}
                    <Link
                      href="/cookies"
                      className="underline underline-offset-2 text-[#2563EB] hover:text-[#1E40AF]"
                    >
                      En savoir plus
                    </Link>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setConsent("rejected")}
                  className="flex-1 md:flex-none px-5 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[#4A6285] hover:text-[#0D1B35] border border-[#BFDBFE] hover:border-[#2563EB] transition-colors"
                >
                  Refuser
                </button>
                <button
                  type="button"
                  onClick={() => setConsent("accepted")}
                  className="flex-1 md:flex-none px-5 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-white bg-[#2563EB] hover:bg-[#1E40AF] transition-colors"
                >
                  Accepter
                </button>
                <button
                  type="button"
                  onClick={() => setConsent("rejected")}
                  aria-label="Fermer (équivaut à Refuser)"
                  className="hidden md:inline-flex w-10 h-10 items-center justify-center text-[#94A3B8] hover:text-[#0D1B35] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
