import { ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { ArrowRight, MapPin, CheckCircle2 } from "lucide-react";

interface KeyPoint {
  title: string;
  description: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface Props {
  eyebrow: string;
  h1: string;
  intro: string;
  zone: string;
  zoneDescription: string;
  keyPoints: KeyPoint[];
  faq: FaqItem[];
  contentSections: { title: string; body: ReactNode }[];
  related: { href: string; label: string }[];
  canonical: string;
  serviceName: string;
}

export default function LocalSeoLayout({
  eyebrow,
  h1,
  intro,
  zone,
  zoneDescription,
  keyPoints,
  faq,
  contentSections,
  related,
  canonical,
  serviceName,
}: Props) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: serviceName,
    provider: {
      "@type": "ProfessionalService",
      name: "Kilowater",
      url: "https://www.kilowater.fr",
      telephone: "+33184161178",
      address: {
        "@type": "PostalAddress",
        streetAddress: "115 Rue Saint-Dominique",
        addressLocality: "Paris",
        postalCode: "75007",
        addressCountry: "FR",
      },
    },
    areaServed: { "@type": "Place", name: zone },
    url: canonical,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://www.kilowater.fr" },
      { "@type": "ListItem", position: 2, name: h1, item: canonical },
    ],
  };

  return (
    <>
      <Script
        id="schema-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Script
        id="schema-service"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Script
        id="schema-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0D1B35] pb-20 pt-32 md:pb-28 md:pt-40">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #60A5FA 0%, transparent 50%), radial-gradient(circle at 80% 70%, #2563EB 0%, transparent 50%)",
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <nav aria-label="Fil d'ariane" className="mb-6">
            <ol className="flex items-center gap-2 text-[0.72rem] uppercase tracking-[0.18em] text-[#7BAAC8]">
              <li>
                <Link href="/" className="hover:text-[#BFDBFE] transition-colors">Accueil</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#BFDBFE]">{eyebrow}</li>
            </ol>
          </nav>

          <div className="flex items-center gap-2 mb-4">
            <MapPin size={14} className="text-[#60A5FA]" strokeWidth={1.5} />
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#60A5FA]">
              {zone}
            </p>
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-white leading-[1.05] mb-6 max-w-4xl">
            {h1}
          </h1>
          <p className="text-[1rem] md:text-[1.05rem] text-[#BFDBFE] leading-relaxed max-w-2xl">
            {intro}
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/contactez-nous"
              className="group inline-flex items-center gap-3 bg-[#2563EB] px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#1E40AF]"
            >
              Demander un devis
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="tel:+33184161178"
              className="inline-flex items-center gap-3 border border-[#60A5FA]/40 px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-[#BFDBFE] transition-colors hover:bg-[#1B3356]"
            >
              01 84 16 11 78
            </a>
          </div>
        </div>
      </section>

      {/* Key points */}
      <section className="bg-white py-16 md:py-20 border-b border-[#E5EEFB]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {keyPoints.map((kp) => (
              <div key={kp.title} className="flex items-start gap-4">
                <CheckCircle2 size={22} className="text-[#2563EB] shrink-0 mt-0.5" strokeWidth={1.5} />
                <div>
                  <h2 className="font-display text-xl font-normal text-[#0D1B35] mb-2 leading-tight">
                    {kp.title}
                  </h2>
                  <p className="text-[0.92rem] text-[#4A6285] leading-relaxed">{kp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content sections */}
      <section className="bg-[#FAF8F5] py-20 md:py-28">
        <div className="mx-auto max-w-[900px] px-6 md:px-10">
          <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-3">
            {zone} — {serviceName}
          </p>
          <p className="font-display text-2xl md:text-3xl font-light text-[#0D1B35] leading-[1.3] mb-12 max-w-2xl">
            {zoneDescription}
          </p>

          <div className="space-y-12 prose-local">
            {contentSections.map((section) => (
              <div key={section.title}>
                <h2 className="font-display text-2xl md:text-3xl font-normal text-[#0D1B35] mb-4 leading-tight">
                  {section.title}
                </h2>
                <div className="text-[0.95rem] text-[#334155] leading-[1.75]">{section.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-[900px] px-6 md:px-10">
          <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-3">FAQ</p>
          <h2 className="font-display text-3xl md:text-4xl font-light text-[#0D1B35] leading-[1.15] mb-12">
            Questions fréquentes
          </h2>
          <div className="divide-y divide-[#E5EEFB] border-t border-[#E5EEFB]">
            {faq.map((f) => (
              <details key={f.question} className="group py-6">
                <summary className="flex cursor-pointer items-start justify-between gap-6 list-none">
                  <h3 className="font-display text-lg md:text-xl font-normal text-[#0D1B35] leading-snug">
                    {f.question}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="shrink-0 mt-1 text-[#2563EB] transition-transform group-open:rotate-45 text-2xl leading-none font-light"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-4 text-[0.95rem] text-[#4A6285] leading-relaxed max-w-2xl">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Related */}
      <section className="bg-[#F5FAFF] py-20 md:py-24 border-t border-[#DBEAFE]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">Aussi sur ce thème</p>
          <h2 className="font-display text-2xl md:text-3xl font-light text-[#0D1B35] mb-8">
            Explorer nos expertises
          </h2>
          <ul className="flex flex-wrap gap-3">
            {related.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="inline-flex items-center gap-2 border border-[#BFDBFE] bg-white px-5 py-3 text-[0.85rem] text-[#0D1B35] hover:border-[#2563EB] hover:text-[#2563EB] transition-colors"
                >
                  {r.label}
                  <ArrowRight size={13} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
