"use client";

import { useState, useEffect, useRef } from "react";
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
  Zap,
  FolderKanban,
  Receipt,
  ReceiptText,
  BookMarked,
  Radar,
  Trash2,
  LogOut,
  ChevronDown,
  UserSquare2,
  FileSpreadsheet,
  TrendingDown,
  Library,
  Layers,
  Boxes,
  Building2,
  CalendarClock,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type IconType = React.ComponentType<{ className?: string }>;

interface NavLink {
  kind: "link";
  label: string;
  href: string;
  icon: IconType;
}

interface NavGroup {
  kind: "group";
  label: string;
  icon: IconType;
  /** Préfixe d'URL utilisé pour détecter "active" (et auto-ouvrir au load). */
  matchPrefix: string;
  children: NavLink[];
}

type NavItem = NavLink | NavGroup;

const TOP_ITEMS: NavItem[] = [
  { kind: "link", label: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
  {
    kind: "group",
    label: "Contact",
    icon: UserSquare2,
    matchPrefix: "/dashboard/contact-group",
    children: [
      { kind: "link", label: "Contacts",    href: "/dashboard/contacts",    icon: Contact },
      { kind: "link", label: "Leads",       href: "/dashboard/leads",       icon: Users },
      { kind: "link", label: "Prospection", href: "/dashboard/prospection", icon: Radar },
    ],
  },
  { kind: "link", label: "Projets",     href: "/dashboard/projets",     icon: FolderKanban },
  {
    kind: "group",
    label: "Facturation",
    icon: FileSpreadsheet,
    matchPrefix: "/dashboard/billing-group",
    children: [
      { kind: "link", label: "Devis",     href: "/dashboard/devis",     icon: Receipt },
      { kind: "link", label: "Factures",  href: "/dashboard/factures",  icon: ReceiptText },
      { kind: "link", label: "Catalogue", href: "/dashboard/catalogue", icon: BookMarked },
    ],
  },
  {
    kind: "group",
    label: "Bibliothèques",
    icon: Library,
    matchPrefix: "/dashboard/library-group",
    children: [
      { kind: "link", label: "Matériaux", href: "/dashboard/materiaux", icon: Layers },
      { kind: "link", label: "Parois",    href: "/dashboard/parois",    icon: Boxes },
      { kind: "link", label: "Bâtiments", href: "/dashboard/batiments", icon: Building2 },
      { kind: "link", label: "Scénarios", href: "/dashboard/scenarios", icon: CalendarClock },
    ],
  },
  { kind: "link", label: "AI Agents",    href: "/dashboard/agents",     icon: Bot },
  { kind: "link", label: "Calendrier",   href: "/dashboard/calendrier", icon: CalendarDays },
  { kind: "link", label: "Documents",    href: "/dashboard/documents",  icon: FileText },
  { kind: "link", label: "Statistiques", href: "/dashboard/stats",      icon: BarChart3 },
  { kind: "link", label: "Décret Tertiaire", href: "/dashboard/deet",   icon: TrendingDown },
];

const BOTTOM_ITEMS: NavLink[] = [
  { kind: "link", label: "Corbeille",  href: "/dashboard/corbeille", icon: Trash2 },
  { kind: "link", label: "Paramètres", href: "/dashboard/settings",  icon: Settings },
];

/** Set des hrefs enfants d'un groupe — utilisé pour décider si le groupe est actif. */
function groupChildHrefs(g: NavGroup): string[] {
  return g.children.map((c) => c.href);
}

function isPathActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname.startsWith(href);
}

export default function Sidebar() {
  const pathname = usePathname();

  // État ouvert/fermé des groupes — auto-ouvert si une route enfant est active.
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const item of TOP_ITEMS) {
      if (item.kind === "group") {
        initial[item.label] = false;
      }
    }
    return initial;
  });

  // Auto-ouvre le groupe contenant la route active UNIQUEMENT au premier rendu
  // (ex: arrivée directe sur /dashboard/devis depuis un favori). Après ça,
  // l'utilisateur contrôle manuellement l'ouverture des groupes — un clic
  // sur un enfant ferme le groupe parent.
  const didInitOpenRef = useRef(false);
  useEffect(() => {
    if (didInitOpenRef.current) return;
    didInitOpenRef.current = true;
    setOpenGroups((prev) => {
      const next = { ...prev };
      for (const item of TOP_ITEMS) {
        if (item.kind === "group") {
          const childActive = groupChildHrefs(item).some((href) => isPathActive(href, pathname));
          if (childActive) next[item.label] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  function toggleGroup(label: string) {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  return (
    <aside
      className="group/sidebar relative flex h-full flex-col overflow-hidden py-5"
      style={{
        background: "#0D1B35",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        width: "72px",
        transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.width = "240px";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.width = "72px";
      }}
    >
      {/* Subtle gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(59,130,246,0.04) 0%, transparent 50%, rgba(59,130,246,0.03) 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-[320px] w-[320px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.20) 0%, transparent 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -top-20 -left-20 h-[260px] w-[260px] rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div className="relative z-10 mb-6 flex items-center gap-3 px-[14px]">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(59,130,246,0.12)" }}
        >
          <Zap
            className="h-6 w-6 rotate-12"
            style={{
              fill: "#3B82F6",
              color: "#3B82F6",
              filter: "drop-shadow(0 0 8px rgba(59,130,246,0.55))",
            }}
          />
        </div>
        <FadeLabel>
          <span
            className="block whitespace-nowrap text-[1.05rem] font-bold tracking-[0.10em] text-white"
            style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          >
            KILOWATER
          </span>
          <span
            className="block text-[0.6rem] uppercase tracking-[0.18em]"
            style={{ color: "rgba(148,163,184,0.55)" }}
          >
            Tableau de bord
          </span>
        </FadeLabel>
      </div>

      {/* Main nav */}
      <nav className="relative z-10 flex flex-1 flex-col gap-0.5 overflow-y-auto px-[10px] no-scrollbar">
        {TOP_ITEMS.map((item) => {
          if (item.kind === "link") {
            const active = isPathActive(item.href, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("sk-item", active ? "sk-item-active" : "")}
              >
                <Icon className="h-[17px] w-[17px] shrink-0" />
                <FadeLabel>
                  <span className="whitespace-nowrap text-[0.82rem] font-medium">
                    {item.label}
                  </span>
                </FadeLabel>
              </Link>
            );
          }

          // Group
          const Icon = item.icon;
          const childHrefs = groupChildHrefs(item);
          const groupActive = childHrefs.some((href) => isPathActive(href, pathname));
          const isOpen = openGroups[item.label] ?? false;
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => toggleGroup(item.label)}
                className={cn(
                  "sk-item w-full text-left",
                  groupActive ? "sk-item-active" : "",
                )}
                aria-expanded={isOpen}
              >
                <Icon className="h-[17px] w-[17px] shrink-0" />
                <FadeLabel className="flex-1">
                  <span className="whitespace-nowrap text-[0.82rem] font-medium">
                    {item.label}
                  </span>
                </FadeLabel>
                <FadeLabel>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                      isOpen ? "rotate-0" : "-rotate-90",
                    )}
                    style={{ color: "rgba(148,163,184,0.7)" }}
                  />
                </FadeLabel>
              </button>

              {/* Children — visibles uniquement si groupe ouvert ET sidebar étendu */}
              <div
                className={cn(
                  "overflow-hidden transition-[max-height,opacity] duration-200 ease-out",
                  isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0",
                )}
              >
                <div className="ml-[10px] mt-0.5 flex flex-col gap-0.5 border-l border-white/[0.06] pl-2">
                  {item.children.map((child) => {
                    const ChildIcon = child.icon;
                    const childActive = isPathActive(child.href, pathname);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => {
                          // Ferme le groupe parent après navigation.
                          setOpenGroups((prev) => ({ ...prev, [item.label]: false }));
                        }}
                        className={cn(
                          "sk-item sk-subitem",
                          childActive ? "sk-item-active" : "",
                        )}
                      >
                        <ChildIcon className="h-[15px] w-[15px] shrink-0" />
                        <FadeLabel>
                          <span className="whitespace-nowrap text-[0.78rem] font-medium">
                            {child.label}
                          </span>
                        </FadeLabel>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Divider */}
      <div
        className="relative z-10 mx-[14px] my-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      />

      {/* Bottom nav */}
      <div className="relative z-10 flex flex-col gap-0.5 px-[10px]">
        {BOTTOM_ITEMS.map((item) => {
          const active = isPathActive(item.href, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("sk-item", active ? "sk-item-active" : "")}
            >
              <Icon className="h-[17px] w-[17px] shrink-0" />
              <FadeLabel>
                <span className="whitespace-nowrap text-[0.82rem] font-medium">
                  {item.label}
                </span>
              </FadeLabel>
            </Link>
          );
        })}

        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="sk-item sk-item-danger w-full text-left"
        >
          <LogOut className="h-[17px] w-[17px] shrink-0" />
          <FadeLabel>
            <span className="whitespace-nowrap text-[0.82rem] font-medium">Déconnexion</span>
          </FadeLabel>
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
          <FadeLabel>
            <p className="whitespace-nowrap text-[0.78rem] font-medium text-white">
              Mahdi Houtia
            </p>
            <p
              className="whitespace-nowrap text-[0.62rem]"
              style={{ color: "rgba(148,163,184,0.6)" }}
            >
              Administrateur
            </p>
          </FadeLabel>
        </div>
      </div>
    </aside>
  );
}

/**
 * Fade-in/out d'un libellé selon que le sidebar parent (`<aside>`) est en hover ou non.
 * Évite la duplication des refs partout dans le composant principal.
 */
function FadeLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={{ opacity: 0, transition: "opacity 220ms ease 50ms" }}
      ref={(el) => {
        if (!el) return;
        const aside = el.closest("aside");
        if (!aside) return;
        const show = () => {
          el.style.opacity = "1";
        };
        const hide = () => {
          el.style.opacity = "0";
        };
        aside.addEventListener("mouseenter", show);
        aside.addEventListener("mouseleave", hide);
      }}
    >
      {children}
    </div>
  );
}
