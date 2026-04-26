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
  ReceiptText,
  Radar,
  Trash2,
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
  { label: "Leads",          href: "/dashboard/leads",      icon: Users },
  { label: "Contacts",       href: "/dashboard/contacts",   icon: Contact },
  { label: "Projets",        href: "/dashboard/projets",    icon: FolderKanban },
  { label: "Devis",          href: "/dashboard/devis",      icon: Receipt },
  { label: "Factures",       href: "/dashboard/factures",   icon: ReceiptText },
  { label: "Prospection",     href: "/dashboard/prospection", icon: Radar },
  { label: "AI Agents",      href: "/dashboard/agents",     icon: Bot },
  { label: "Calendrier",     href: "/dashboard/calendrier", icon: CalendarDays },
  { label: "Documents",      href: "/dashboard/documents",  icon: FileText },
  { label: "Statistiques",   href: "/dashboard/stats",      icon: BarChart3 },
];

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Corbeille",   href: "/dashboard/corbeille", icon: Trash2 },
  { label: "Paramètres",  href: "/dashboard/settings",  icon: Settings },
];

export default function Sidebar() {
  const pathname  = usePathname();
  const { openSearch } = useSearch();

  return (
    <aside
      className="group/sidebar relative flex h-full flex-col overflow-hidden py-5"
      style={{
        background: "#0D1B35",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        width: "72px",
        transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.width = "240px"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.width = "72px"; }}
    >
      {/* ── Subtle gradient overlay ────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(180deg, rgba(59,130,246,0.04) 0%, transparent 50%, rgba(59,130,246,0.03) 100%)",
        }}
      />
      {/* Halo bleu — bas */}
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-[320px] w-[320px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.20) 0%, transparent 70%)",
        }}
      />
      {/* Halo bleu — haut */}
      <div
        className="pointer-events-none absolute -top-20 -left-20 h-[260px] w-[260px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)",
        }}
      />

      {/* ── Logo ──────────────────────────────────────────────── */}
      <div className="relative z-10 mb-7 flex items-center gap-3 px-[14px]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(59,130,246,0.12)" }}>
          <Zap
            className="h-6 w-6 rotate-12"
            style={{
              fill: "#3B82F6",
              color: "#3B82F6",
              filter: "drop-shadow(0 0 8px rgba(59,130,246,0.55))",
            }}
          />
        </div>
        <div className="overflow-hidden" style={{ opacity: 0, transition: "opacity 250ms ease 60ms" }}
          ref={(el) => {
            if (!el) return;
            const aside = el.closest("aside");
            if (!aside) return;
            const show = () => { el.style.opacity = "1"; };
            const hide = () => { el.style.opacity = "0"; };
            aside.addEventListener("mouseenter", show);
            aside.addEventListener("mouseleave", hide);
          }}
        >
          <span
            className="block whitespace-nowrap text-[1.05rem] font-bold tracking-[0.10em] text-white"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            KILOWATER
          </span>
          <span className="block text-[0.6rem] uppercase tracking-[0.18em]"
            style={{ color: "rgba(148,163,184,0.55)" }}>
            Tableau de bord
          </span>
        </div>
      </div>

      {/* ── Main nav ──────────────────────────────────────────── */}
      <nav className="relative z-10 flex flex-1 flex-col gap-0.5 px-[10px]">
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
              className={cn("sk-item", isActive ? "sk-item-active" : "")}
            >
              <Icon className="h-[17px] w-[17px] shrink-0" />
              <span
                className="whitespace-nowrap text-[0.82rem] font-medium overflow-hidden"
                style={{ opacity: 0, transition: "opacity 220ms ease 50ms" }}
                ref={(el) => {
                  if (!el) return;
                  const aside = el.closest("aside");
                  if (!aside) return;
                  const show = () => { el.style.opacity = "1"; };
                  const hide = () => { el.style.opacity = "0"; };
                  aside.addEventListener("mouseenter", show);
                  aside.addEventListener("mouseleave", hide);
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ── Divider ───────────────────────────────────────────── */}
      <div className="relative z-10 mx-[14px] my-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }} />

      {/* ── Bottom nav ────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col gap-0.5 px-[10px]">

        {/* Recherche */}
        <button onClick={openSearch} className="sk-item w-full text-left">
          <Search className="h-[17px] w-[17px] shrink-0" />
          <span
            className="whitespace-nowrap text-[0.82rem] font-medium"
            style={{ opacity: 0, transition: "opacity 220ms ease 50ms" }}
            ref={(el) => {
              if (!el) return;
              const aside = el.closest("aside");
              if (!aside) return;
              const show = () => { el.style.opacity = "1"; };
              const hide = () => { el.style.opacity = "0"; };
              aside.addEventListener("mouseenter", show);
              aside.addEventListener("mouseleave", hide);
            }}
          >
            Recherche
          </span>
        </button>

        {BOTTOM_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href}
              className={cn("sk-item", isActive ? "sk-item-active" : "")}>
              <Icon className="h-[17px] w-[17px] shrink-0" />
              <span
                className="whitespace-nowrap text-[0.82rem] font-medium"
                style={{ opacity: 0, transition: "opacity 220ms ease 50ms" }}
                ref={(el) => {
                  if (!el) return;
                  const aside = el.closest("aside");
                  if (!aside) return;
                  const show = () => { el.style.opacity = "1"; };
                  const hide = () => { el.style.opacity = "0"; };
                  aside.addEventListener("mouseenter", show);
                  aside.addEventListener("mouseleave", hide);
                }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Déconnexion */}
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="sk-item sk-item-danger w-full text-left"
        >
          <LogOut className="h-[17px] w-[17px] shrink-0" />
          <span
            className="whitespace-nowrap text-[0.82rem] font-medium"
            style={{ opacity: 0, transition: "opacity 220ms ease 50ms" }}
            ref={(el) => {
              if (!el) return;
              const aside = el.closest("aside");
              if (!aside) return;
              const show = () => { el.style.opacity = "1"; };
              const hide = () => { el.style.opacity = "0"; };
              aside.addEventListener("mouseenter", show);
              aside.addEventListener("mouseleave", hide);
            }}
          >
            Déconnexion
          </span>
        </button>

        {/* Avatar */}
        <div className="mt-3 flex items-center gap-3 px-[3px]">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[0.62rem] font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #c2613a, #8b4726)",
              boxShadow: "0 0 0 2px rgba(194,97,58,0.25)",
            }}
          >
            MH
          </div>
          <div
            className="overflow-hidden"
            style={{ opacity: 0, transition: "opacity 220ms ease 50ms" }}
            ref={(el) => {
              if (!el) return;
              const aside = el.closest("aside");
              if (!aside) return;
              const show = () => { el.style.opacity = "1"; };
              const hide = () => { el.style.opacity = "0"; };
              aside.addEventListener("mouseenter", show);
              aside.addEventListener("mouseleave", hide);
            }}
          >
            <p className="whitespace-nowrap text-[0.78rem] font-medium text-white">
              Mahdi Houtia
            </p>
            <p className="whitespace-nowrap text-[0.62rem]"
              style={{ color: "rgba(148,163,184,0.6)" }}>
              Administrateur
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
