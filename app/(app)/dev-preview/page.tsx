import Metric from "@/components/dashboard/Metric";
import DpeBadge from "@/components/dashboard/DpeBadge";

export const metadata = { robots: { index: false, follow: false } };

export default function DevPreviewPage() {
  return (
    <main className="min-h-screen bg-tk-bg p-8 text-tk-text">
      <div className="mx-auto max-w-5xl space-y-10">
        <header>
          <p className="field-label-tiny">Étape 2 — Design system</p>
          <h1 className="section-title-dense">Primitives métier</h1>
          <p className="mt-1 text-[13px] text-tk-text-muted">
            Aperçu des tokens densité, métric/unit, DPE et data-table.
          </p>
        </header>

        {/* Metric */}
        <section className="space-y-3">
          <h2 className="field-label-tiny">Metric · grandeur + unité</h2>
          <div className="flex flex-wrap items-end gap-8 rounded-lg border border-tk-border bg-tk-surface p-5">
            <div>
              <p className="field-label-tiny">Cep projet</p>
              <Metric value={280} unit={<>kWh<sub>ep</sub>/m²·an</>} size="lg" />
            </div>
            <div>
              <p className="field-label-tiny">Cep après travaux</p>
              <Metric value={95} unit={<>kWh<sub>ep</sub>/m²·an</>} size="lg" tone="pos" />
            </div>
            <div>
              <p className="field-label-tiny">Gain</p>
              <Metric value={-66} unit="%" size="md" tone="pos" />
            </div>
            <div>
              <p className="field-label-tiny">Surface SHAB</p>
              <Metric value={142.5} unit="m²" decimals={1} size="md" />
            </div>
            <div>
              <p className="field-label-tiny">U paroi</p>
              <Metric value={0.18} unit="W/m²·K" decimals={2} size="sm" />
            </div>
            <div>
              <p className="field-label-tiny">Budget</p>
              <Metric value={42500} unit="€" size="md" tone="muted" />
            </div>
          </div>
        </section>

        {/* DPE */}
        <section className="space-y-3">
          <h2 className="field-label-tiny">Étiquette DPE</h2>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-tk-border bg-tk-surface p-5">
            {(["A", "B", "C", "D", "E", "F", "G"] as const).map((l) => (
              <DpeBadge key={l} letter={l} />
            ))}
            <DpeBadge letter={null} />
          </div>
        </section>

        {/* Data table */}
        <section className="space-y-3">
          <h2 className="field-label-tiny">Data-table · dense, mono, sticky header</h2>
          <div className="overflow-hidden rounded-lg border border-tk-border bg-tk-surface">
            <div className="toolbar m-0 rounded-none border-x-0 border-t-0">
              <button className="btn-ghost h-7">+ Ajouter</button>
              <span className="sep" />
              <span className="text-tk-text-muted">5 parois</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Réf.</th>
                  <th>Désignation</th>
                  <th>Type</th>
                  <th className="num">Surface</th>
                  <th className="num">U</th>
                  <th className="num">R</th>
                  <th>Orient.</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ref: "MUR-N1", des: "Mur ext. nord pignon", type: "Mur ext.", s: 24.6, u: 0.22, r: 4.55, o: "Nord" },
                  { ref: "MUR-S1", des: "Mur ext. sud séjour", type: "Mur ext.", s: 18.2, u: 0.22, r: 4.55, o: "Sud" },
                  { ref: "TOI-1",  des: "Toiture combles aménagés", type: "Toiture", s: 86.0, u: 0.16, r: 6.25, o: "—" },
                  { ref: "PLB-1",  des: "Plancher bas vide sanitaire", type: "Plancher bas", s: 72.4, u: 0.20, r: 5.00, o: "—" },
                  { ref: "MEN-S",  des: "Menuiserie triple vitrage Sud", type: "Vitrage", s: 6.8, u: 0.85, r: 1.18, o: "Sud" },
                ].map((p) => (
                  <tr key={p.ref}>
                    <td className="font-mono text-tk-text-muted">{p.ref}</td>
                    <td>{p.des}</td>
                    <td className="text-tk-text-muted">{p.type}</td>
                    <td className="num">{p.s.toFixed(1)} m²</td>
                    <td className="num">{p.u.toFixed(2)}</td>
                    <td className="num">{p.r.toFixed(2)}</td>
                    <td className="text-tk-text-muted">{p.o}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
