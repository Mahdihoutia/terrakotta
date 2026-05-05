"use client";

import { useState } from "react";

const STORAGE_KEY = "kw_cookie_consent_v1";

export default function CookieResetButton() {
  const [done, setDone] = useState(false);

  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setDone(true);
    window.dispatchEvent(new Event("kw:consent-reset"));
    setTimeout(() => window.location.reload(), 600);
  }

  return (
    <button
      type="button"
      onClick={reset}
      className="inline-flex items-center gap-2 border border-[#2563EB] px-5 py-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-colors"
    >
      {done ? "Préférences réinitialisées…" : "Modifier mes préférences"}
    </button>
  );
}
