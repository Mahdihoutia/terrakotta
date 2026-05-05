import { ReactNode } from "react";

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
  updatedAt: string;
  children: ReactNode;
}

export default function LegalLayout({ eyebrow, title, subtitle, updatedAt, children }: Props) {
  return (
    <>
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="mx-auto max-w-[900px] px-6 md:px-10">
          <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">{eyebrow}</p>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-[#0D1B35] leading-[1.1] mb-6">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[1rem] text-[#4A6285] leading-relaxed max-w-2xl">{subtitle}</p>
          )}
          <p className="mt-6 text-[0.78rem] text-[#94A3B8]">Dernière mise à jour : {updatedAt}</p>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-[900px] px-6 md:px-10">
          <div className="legal-prose">{children}</div>
        </div>
      </section>

      <style>{`
        .legal-prose h2 {
          font-family: var(--font-display), Georgia, serif;
          font-size: 1.5rem;
          font-weight: 400;
          color: #0D1B35;
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }
        .legal-prose h3 {
          font-size: 0.78rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #2563EB;
          margin-top: 1.75rem;
          margin-bottom: 0.5rem;
        }
        .legal-prose p,
        .legal-prose li {
          font-size: 0.95rem;
          line-height: 1.75;
          color: #334155;
        }
        .legal-prose p { margin: 0.75rem 0; }
        .legal-prose ul {
          list-style: disc;
          padding-left: 1.25rem;
          margin: 0.75rem 0;
        }
        .legal-prose li { margin: 0.25rem 0; }
        .legal-prose a {
          color: #2563EB;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .legal-prose a:hover { color: #1E40AF; }
        .legal-prose strong { color: #0D1B35; font-weight: 600; }
      `}</style>
    </>
  );
}
