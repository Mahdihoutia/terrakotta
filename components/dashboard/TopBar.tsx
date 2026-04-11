"use client";

import Link from "next/link";
import { Bell, Sun, Moon, Zap } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

function formatDateFr(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function TopBar() {
  const today    = formatDateFr();
  const greeting = getGreeting();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="relative flex h-[60px] shrink-0 items-center justify-between border-b border-tk-border bg-tk-surface px-8">
      {/* ── Accent line top ─────────────────────────────────── */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: "linear-gradient(90deg, var(--tk-primary) 0%, rgba(59,130,246,0.15) 60%, transparent 100%)",
        }}
      />

      {/* ── Left — greeting ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Zap
            className="h-[14px] w-[14px] rotate-12 text-tk-primary"
            style={{ fill: "var(--tk-primary)" }}
          />
          <span
            className="text-[0.78rem] font-semibold tracking-[0.08em] text-tk-text"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            KILOWATER
          </span>
        </div>
        <div className="h-4 w-px bg-tk-border" />
        <span className="text-sm text-tk-text-muted">
          {greeting}, <span className="font-semibold text-tk-text">Mahdi</span>
        </span>
      </div>

      {/* ── Right — controls ────────────────────────────────── */}
      <div className="flex items-center gap-1.5">

        {/* Date */}
        <Link
          href="/dashboard/calendrier"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-tk-text-muted transition-all hover:bg-tk-hover hover:text-tk-text"
        >
          <span className="capitalize text-[0.8rem] hidden sm:inline">{today}</span>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Mode sombre" : "Mode clair"}
          className="flex h-8 items-center gap-1.5 rounded-lg border border-tk-border bg-tk-surface px-3 text-[0.78rem] font-medium text-tk-text-muted transition-all hover:border-tk-border-hover hover:text-tk-text"
        >
          {theme === "light" ? (
            <>
              <Moon className="h-3.5 w-3.5 text-tk-primary" />
              <span className="hidden sm:inline">Sombre</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5 text-tk-primary" />
              <span className="hidden sm:inline">Clair</span>
            </>
          )}
        </button>

        {/* Notifications */}
        <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-tk-border bg-tk-surface transition-all hover:border-tk-border-hover">
          <Bell className="h-[15px] w-[15px] text-tk-text-muted" />
          <span className="absolute right-1.5 top-1.5 flex h-[7px] w-[7px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tk-primary opacity-75" />
            <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-tk-primary" />
          </span>
        </button>
      </div>
    </header>
  );
}
