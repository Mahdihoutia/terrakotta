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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TOP_ITEMS: NavItem[] = [
  { label: "Vue d'ensemble", href: "/", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Contacts", href: "/contacts", icon: Contact },
  { label: "AI Agents", href: "/agents", icon: Bot },
  { label: "Calendrier", href: "/calendrier", icon: CalendarDays },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Statistiques", href: "/stats", icon: BarChart3 },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Recherche", href: "#", icon: Search },
  { label: "Paramètres", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "group/sidebar flex h-full flex-col border-r border-white/[0.06] bg-[rgba(10,14,30,0.6)] py-4 backdrop-blur-xl",
        "w-[72px] hover:w-[240px] transition-[width] duration-300 ease-in-out overflow-hidden"
      )}
    >
      {/* Logo */}
      <div className="mb-6 flex items-center gap-3 px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/20">
          <span className="text-sm font-black text-white">T</span>
        </div>
        <span className="whitespace-nowrap text-base font-bold text-[#e8ecf4] opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 delay-75">
          Terrakotta
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {TOP_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-10 items-center gap-3 rounded-xl px-[11px] transition-all duration-200",
                isActive
                  ? "bg-white/[0.1] text-orange-400 shadow-lg shadow-orange-500/10"
                  : "text-[#5a6478] hover:bg-white/[0.06] hover:text-[#c8d0e0]"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="whitespace-nowrap text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 delay-75">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -left-3 h-5 w-[3px] rounded-r-full bg-orange-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col gap-1 px-3">
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
                  ? "bg-white/[0.1] text-orange-400"
                  : "text-[#5a6478] hover:bg-white/[0.06] hover:text-[#c8d0e0]"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className="whitespace-nowrap text-sm font-medium opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 delay-75">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Avatar */}
        <div className="mt-2 flex items-center gap-3 px-[5px]">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-[10px] font-bold text-white">
            MH
          </div>
          <span className="whitespace-nowrap text-xs font-medium text-[#c8d0e0] opacity-0 group-hover/sidebar:opacity-100 transition-opacity duration-300 delay-75">
            Mahdi Houtia
          </span>
        </div>
      </div>
    </aside>
  );
}
