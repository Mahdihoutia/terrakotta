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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <aside className="flex h-full w-[72px] flex-col items-center border-r border-white/[0.06] bg-[rgba(10,14,30,0.6)] py-4 backdrop-blur-xl">
      {/* Logo */}
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/20">
        <span className="text-sm font-black text-white">T</span>
      </div>

      {/* Main nav */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {TOP_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger className="w-full flex justify-center">
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-white/[0.1] text-emerald-400 shadow-lg shadow-emerald-500/10"
                      : "text-[#5a6478] hover:bg-white/[0.06] hover:text-[#c8d0e0]"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {isActive && (
                    <span className="absolute -left-[14px] h-5 w-[3px] rounded-r-full bg-emerald-400" />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="glass border-white/10 bg-[#1a1f35]/95 text-xs text-[#e8ecf4]">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="flex flex-col items-center gap-1">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = item.href !== "#" && pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Tooltip key={item.label}>
              <TooltipTrigger className="w-full flex justify-center">
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200",
                    isActive
                      ? "bg-white/[0.1] text-emerald-400"
                      : "text-[#5a6478] hover:bg-white/[0.06] hover:text-[#c8d0e0]"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="glass border-white/10 bg-[#1a1f35]/95 text-xs text-[#e8ecf4]">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Avatar */}
        <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-[10px] font-bold text-white">
          MH
        </div>
      </div>
    </aside>
  );
}
