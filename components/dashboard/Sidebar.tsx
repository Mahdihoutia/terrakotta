"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Bot,
  BarChart3,
  FileText,
  Contact,
  CalendarDays,
  Settings,
  Search,
  Zap,
  FolderKanban,
  Receipt,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { useSearch } from "./SearchProvider";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOP_ITEMS: NavItem[] = [
  { label: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/dashboard/leads", icon: Users },
  { label: "Contacts", href: "/dashboard/contacts", icon: Contact },
  { label: "Projets", href: "/dashboard/projets", icon: FolderKanban },
  { label: "Devis", href: "/dashboard/devis", icon: Receipt },
  { label: "AI Agents", href: "/dashboard/agents", icon: Bot },
  { label: "Calendrier", href: "/dashboard/calendrier", icon: CalendarDays },
  { label: "Documents", href: "/dashboard/documents", icon: FileText },
  { label: "Statistiques", href: "/dashboard/stats", icon: BarChart3 },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Paramètres", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { openSearch } = useSearch();

  return (
    <aside
      className={cn(
        "group/sidebar flex h-full flex-col border-r border-tk-border bg-tk-sidebar-bg py-4 backdrop-blur-xl",
        "w-[72px] hover:w-[240px] transition-[width] duration-300 ease-in-out overflow-hidden"
      )}
    >
      {/* Logo */}
      <div className="mb-6 flex items-center gap-3 px-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center">
          <Zap
            className="h-7 w-7 rotate-12"
            style={{ fill: "#3B82F6", color: "#3B82F6" }}
          />
        </div>
        <span
          className="whitespace-nowrap text-[1.1rem] font-bold tracking-[0.1em] text-white opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 delay-75"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
        >
          KILOWATER
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {TOP_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-10 items-center gap-3 rounded-xl px-[11px] transition-all duration-200",
                isActive
                  ? "bg-tk-primary-light dark:bg-tk-sidebar-active text-tk-primary shadow-lg shadow-tk-primary/10"
                  : "text-tk-text-muted dark:text-tk-sidebar-muted hover:bg-tk-hover dark:hover:bg-tk-sidebar-hover hover:text-tk-text dark:hover:text-tk-sidebar-text"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="whitespace-nowrap text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 delay-75">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -left-3 h-5 w-[3px] rounded-r-full bg-tk-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col gap-1 px-3">
        {/* Recherche */}
        <button
          onClick={openSearch}
          className="flex h-10 items-center gap-3 rounded-xl px-[11px] transition-all duration-200 text-tk-text-muted dark:text-tk-sidebar-muted hover:bg-tk-hover dark:hover:bg-tk-sidebar-hover hover:text-tk-text dark:hover:text-tk-sidebar-text"
        >
          <Search className="h-[18px] w-[18px] shrink-0" />
          <span className="whitespace-nowrap text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 delay-75">
            Recherche
          </span>
        </button>

        {BOTTOM_ITEMS.map((item) => {
          const isActive = item.href !== "#" && pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                "flex h-10 items-center gap-3 rounded-xl px-[11px] transition-all duration-200",
                isActive
                  ? "bg-tk-primary-light dark:bg-tk-sidebar-active text-tk-primary"
                  : "text-tk-text-muted dark:text-tk-sidebar-muted hover:bg-tk-hover dark:hover:bg-tk-sidebar-hover hover:text-tk-text dark:hover:text-tk-sidebar-text"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="whitespace-nowrap text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 delay-75">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Déconnexion */}
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex h-10 items-center gap-3 rounded-xl px-[11px] transition-all duration-200 text-tk-text-muted dark:text-tk-sidebar-muted hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span className="whitespace-nowrap text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 delay-75">
            Déconnexion
          </span>
        </button>

        {/* Avatar */}
        <div className="mt-2 flex items-center gap-3 px-[5px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#c2613a] to-[#8b4726] text-[10px] font-bold text-white">
            MH
          </div>
          <span className="whitespace-nowrap text-xs font-medium text-tk-text dark:text-tk-sidebar-text opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 delay-75">
            Mahdi Houtia
          </span>
        </div>
      </div>
    </aside>
  );
}
