"use client";

import Link from "next/link";
import { Bell, CalendarDays, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

function formatDateFr(): string {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function TopBar() {
  const today = formatDateFr();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex h-14 items-center justify-between border-b border-tk-border px-8">
      <div />

      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/calendrier"
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-tk-text-muted transition-colors hover:bg-tk-hover hover:text-tk-text-secondary"
        >
          <CalendarDays className="h-4 w-4 text-tk-primary" />
          <span className="capitalize hidden sm:inline">{today}</span>
        </Link>

        <button
          onClick={toggleTheme}
          className="flex h-9 items-center gap-1.5 rounded-full border border-tk-border bg-tk-surface px-3 transition-all hover:border-tk-border-hover hover:bg-tk-hover"
          title={theme === "light" ? "Mode sombre" : "Mode clair"}
        >
          {theme === "light" ? (
            <>
              <Moon className="h-4 w-4 text-tk-primary" />
              <span className="text-xs font-medium text-tk-text-secondary hidden sm:inline">Sombre</span>
            </>
          ) : (
            <>
              <Sun className="h-4 w-4 text-tk-primary" />
              <span className="text-xs font-medium text-tk-text-secondary hidden sm:inline">Clair</span>
            </>
          )}
        </button>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-tk-hover">
          <Bell className="h-[18px] w-[18px] text-tk-text-muted" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tk-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-tk-primary" />
          </span>
        </button>
      </div>
    </header>
  );
}
