"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { Bell, Sun, Moon, Zap, Search, ChevronRight } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useSearch } from "./SearchProvider";

// Libellés lisibles pour les segments de URL (fallback = capitalize)
const SEGMENT_LABELS: Record<string, string> = {
  dashboard:    "Vue d'ensemble",
  leads:        "Leads",
  contacts:     "Contacts",
  projets:      "Projets",
  devis:        "Devis",
  prospection:  "Prospection",
  agents:       "AI Agents",
  calendrier:   "Calendrier",
  documents:    "Documents",
  stats:        "Statistiques",
  settings:     "Paramètres",
};

function humanize(seg: string): string {
  if (SEGMENT_LABELS[seg]) return SEGMENT_LABELS[seg];
  // IDs / slugs : tronquer et capitaliser
  if (seg.length > 14) return seg.slice(0, 6) + "…" + seg.slice(-4);
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function TopBar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { openSearch } = useSearch();

  const greeting = getGreeting();

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const list: Array<{ label: string; href: string; current: boolean }> = [];
    let path = "";
    for (let i = 0; i < parts.length; i++) {
      path += "/" + parts[i];
      list.push({
        label: humanize(parts[i]),
        href:  path,
        current: i === parts.length - 1,
      });
    }
    return list;
  }, [pathname]);

  const isHome = pathname === "/dashboard";

  return (
    <header className="relative flex h-[60px] shrink-0 items-center justify-between border-b border-tk-border bg-tk-surface px-6 lg:px-8">
      {/* Accent top line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{
          background:
            "linear-gradient(90deg, var(--tk-primary) 0%, rgba(59,130,246,0.15) 60%, transparent 100%)",
        }}
      />

      {/* ── Left : wordmark + breadcrumbs ou greeting ────────── */}
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex shrink-0 items-center gap-1.5">
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

        {isHome ? (
          <span className="truncate text-sm text-tk-text-muted">
            {greeting},{" "}
            <span className="font-semibold text-tk-text">Mahdi</span>
          </span>
        ) : (
          <nav
            aria-label="Fil d'Ariane"
            className="flex min-w-0 items-center overflow-hidden"
          >
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex shrink-0 items-center">
                {i > 0 && (
                  <ChevronRight
                    className="crumb-separator h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                )}
                {c.current ? (
                  <span className="crumb crumb-current truncate">{c.label}</span>
                ) : (
                  <Link href={c.href} className="crumb truncate">
                    {c.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>

      {/* ── Right : search, theme, bell ──────────────────────── */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Search trigger — style command bar */}
        <button
          type="button"
          onClick={openSearch}
          aria-label="Rechercher (⌘K)"
          className="focus-ring group hidden h-8 items-center gap-2 rounded-lg border border-tk-border bg-tk-bg px-3 text-[0.78rem] text-tk-text-muted transition-all hover:border-tk-border-hover hover:text-tk-text md:flex md:min-w-[240px]"
        >
          <Search className="h-[13px] w-[13px] shrink-0 text-tk-text-faint transition-colors group-hover:text-tk-primary" />
          <span className="flex-1 text-left">Rechercher…</span>
          <span className="flex items-center gap-1">
            <kbd className="kbd">⌘</kbd>
            <kbd className="kbd">K</kbd>
          </span>
        </button>

        {/* Search trigger — mobile icon only */}
        <button
          type="button"
          onClick={openSearch}
          aria-label="Rechercher"
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg border border-tk-border bg-tk-surface text-tk-text-muted transition-all hover:border-tk-border-hover hover:text-tk-text md:hidden"
        >
          <Search className="h-[15px] w-[15px]" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === "light" ? "Mode sombre" : "Mode clair"}
          aria-label={theme === "light" ? "Activer le mode sombre" : "Activer le mode clair"}
          className="focus-ring flex h-8 w-8 items-center justify-center rounded-lg border border-tk-border bg-tk-surface text-tk-text-muted transition-all hover:border-tk-border-hover hover:text-tk-text"
        >
          {theme === "light" ? (
            <Moon className="h-[15px] w-[15px] text-tk-primary" />
          ) : (
            <Sun className="h-[15px] w-[15px] text-tk-primary" />
          )}
        </button>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className="focus-ring relative flex h-8 w-8 items-center justify-center rounded-lg border border-tk-border bg-tk-surface text-tk-text-muted transition-all hover:border-tk-border-hover hover:text-tk-text"
        >
          <Bell className="h-[15px] w-[15px]" />
          <span className="absolute right-1.5 top-1.5 flex h-[7px] w-[7px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tk-primary opacity-70" />
            <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-tk-primary" />
          </span>
        </button>
      </div>
    </header>
  );
}
