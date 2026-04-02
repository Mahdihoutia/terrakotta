"use client";

import Link from "next/link";
import { Bell, Search, Command, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
    <header className="flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 px-6 backdrop-blur-sm">
      <div className="flex flex-1 items-center gap-4">
        <div className="flex h-9 w-full max-w-md items-center gap-2 rounded-lg border bg-muted/40 px-3 transition-colors focus-within:border-primary/40 focus-within:bg-background">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:flex">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/calendrier">
          <Button variant="ghost" className="hidden h-9 gap-2 rounded-lg px-3 text-sm sm:flex">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="capitalize text-muted-foreground">{today}</span>
          </Button>
        </Link>

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-primary">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
          </span>
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              MH
            </AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-tight">Mahdi H.</p>
            <p className="text-[10px] text-muted-foreground">Administrateur</p>
          </div>
        </button>
      </div>
    </header>
  );
}
