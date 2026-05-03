"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  FolderKanban,
  Building2,
  Cog,
  GitCompare,
  Calculator,
  FileOutput,
} from "lucide-react";

interface Tab {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: (pathname: string, base: string) => boolean;
}

const TABS: Tab[] = [
  {
    href: "",
    label: "Affaire",
    icon: FolderKanban,
    match: (p, base) => p === base || p === `${base}/`,
  },
  {
    href: "/bati",
    label: "Bâti",
    icon: Building2,
    match: (p, base) => p.startsWith(`${base}/bati`),
  },
  {
    href: "/systemes",
    label: "Systèmes",
    icon: Cog,
    match: (p, base) => p.startsWith(`${base}/systemes`),
  },
  {
    href: "/scenarios",
    label: "Scénarios",
    icon: GitCompare,
    match: (p, base) => p.startsWith(`${base}/scenarios`),
  },
  {
    href: "/calcul",
    label: "Calcul",
    icon: Calculator,
    match: (p, base) => p.startsWith(`${base}/calcul`),
  },
  {
    href: "/livrables",
    label: "Livrables",
    icon: FileOutput,
    match: (p, base) => p.startsWith(`${base}/livrables`),
  },
];

interface Props {
  projetId: string;
}

export default function ProjetWorkspaceTabs({ projetId }: Props) {
  const pathname = usePathname() ?? "";
  const base = `/dashboard/projets/${projetId}`;

  return (
    <nav
      role="tablist"
      aria-label="Sections du projet"
      className="flex gap-1 overflow-x-auto"
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname, base);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={`${base}${tab.href}`}
            role="tab"
            aria-selected={active}
            className={cn(
              "group relative inline-flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-[13px] font-medium transition-colors",
              "border-b-2 -mb-px",
              active
                ? "border-tk-primary text-tk-text"
                : "border-transparent text-tk-text-muted hover:text-tk-text",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
