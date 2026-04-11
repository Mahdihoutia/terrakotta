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
    <header
      className="relative flex h-[60px] shrink-0 items-center justify-between px-8"
      style={{
        background: "#FAF8F5",
        borderBottom: "1px solid #E8E2DA",
      }}
    >
      {/* ── Accent line top ─────────────────────────────────── */}
      <div
        className="absolute inset-x-0 top-0 h-[2px]"
        style={{
          background: "linear-gradient(90deg, #3B82F6 0%, rgba(59,130,246,0.15) 60%, transparent 100%)",
        }}
      />

      {/* ── Left — greeting ─────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Zap
            className="h-[14px] w-[14px] rotate-12"
            style={{ fill: "#3B82F6", color: "#3B82F6" }}
          />
          <span
            className="text-[0.78rem] font-semibold tracking-[0.08em] text-[#0D1B35]"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            KILOWATER
          </span>
        </div>
        <div
          className="h-4 w-px"
          style={{ background: "#E8E2DA" }}
        />
        <span className="text-sm text-[#6b5b50]">
          {greeting}, <span className="font-semibold text-[#0D1B35]">Mahdi</span>
        </span>
      </div>

      {/* ── Right — controls ────────────────────────────────── */}
      <div className="flex items-center gap-1.5">

        {/* Date */}
        <Link
          href="/dashboard/calendrier"
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 transition-all"
          style={{ color: "#6b5b50" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "#EDE9E2";
            (e.currentTarget as HTMLElement).style.color = "#0D1B35";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#6b5b50";
          }}
        >
          <span className="capitalize text-[0.8rem] hidden sm:inline">{today}</span>
        </Link>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Mode sombre" : "Mode clair"}
          className="flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[0.78rem] font-medium transition-all"
          style={{
            borderColor: "#E8E2DA",
            background: "#FFFFFF",
            color: "#6b5b50",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#c9bfb4";
            (e.currentTarget as HTMLElement).style.color = "#0D1B35";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#E8E2DA";
            (e.currentTarget as HTMLElement).style.color = "#6b5b50";
          }}
        >
          {theme === "light" ? (
            <>
              <Moon className="h-3.5 w-3.5" style={{ color: "#3B82F6" }} />
              <span className="hidden sm:inline">Sombre</span>
            </>
          ) : (
            <>
              <Sun className="h-3.5 w-3.5" style={{ color: "#3B82F6" }} />
              <span className="hidden sm:inline">Clair</span>
            </>
          )}
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg border transition-all"
          style={{ borderColor: "#E8E2DA", background: "#FFFFFF" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#c9bfb4";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "#E8E2DA";
          }}
        >
          <Bell className="h-[15px] w-[15px]" style={{ color: "#6b5b50" }} />
          <span className="absolute right-1.5 top-1.5 flex h-[7px] w-[7px]">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: "#3B82F6" }}
            />
            <span
              className="relative inline-flex h-[7px] w-[7px] rounded-full"
              style={{ background: "#3B82F6" }}
            />
          </span>
        </button>
      </div>
    </header>
  );
}
