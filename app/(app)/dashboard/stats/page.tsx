import { Suspense } from "react";
import { parsePeriod, parseTab, parseCategories } from "@/lib/stats/period";
import StatsFilters from "./StatsFilters";
import ProjetsTab from "./tabs/ProjetsTab";
import LeadsTab from "./tabs/LeadsTab";
import RevenusTab from "./tabs/RevenusTab";
import AidesTab from "./tabs/AidesTab";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function StatsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const period = parsePeriod(typeof sp.period === "string" ? sp.period : undefined);
  const tab = parseTab(typeof sp.tab === "string" ? sp.tab : undefined);
  const categories = parseCategories(sp.categories);

  // Le filtre catégorie ne s'applique pas à l'onglet Leads (pas de FK directe vers categorieCible).
  const categoryFilterDisabled = tab === "leads";
  const effectiveCategories = categoryFilterDisabled ? [] : categories;

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6">
      <header>
        <h1 className="section-title text-[1.75rem]">Rapport business</h1>
        <p className="section-subtitle">
          Pilotage des projets, du pipeline commercial, du chiffre d&apos;affaires et des aides financières.
        </p>
      </header>

      <StatsFilters
        period={period.key}
        categories={categories}
        tab={tab}
        categoryFilterDisabled={categoryFilterDisabled}
      />

      <Suspense fallback={<TabSkeleton />}>
        {tab === "projets" && <ProjetsTab period={period} categories={effectiveCategories} />}
        {tab === "leads" && <LeadsTab period={period} />}
        {tab === "revenus" && <RevenusTab period={period} categories={effectiveCategories} />}
        {tab === "aides" && <AidesTab period={period} categories={effectiveCategories} />}
      </Suspense>
    </div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-premium h-[110px] animate-pulse p-5" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-premium h-[380px] animate-pulse p-5" />
        ))}
      </div>
    </div>
  );
}
