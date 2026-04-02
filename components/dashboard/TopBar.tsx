"use client";

import Link from "next/link";
import { Bell, CalendarDays } from "lucide-react";

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

  return (
    <header className="flex h-14 items-center justify-between px-8">
      <div />

      <div className="flex items-center gap-3">
        <Link
          href="/calendrier"
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm text-[#7a849a] transition-colors hover:bg-white/[0.06] hover:text-[#c8d0e0]"
        >
          <CalendarDays className="h-4 w-4 text-emerald-400" />
          <span className="capitalize hidden sm:inline">{today}</span>
        </Link>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-white/[0.06]">
          <Bell className="h-[18px] w-[18px] text-[#7a849a]" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
        </button>
      </div>
    </header>
  );
}
