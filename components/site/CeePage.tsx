"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import RelatedLinks from "@/components/site/RelatedLinks";
import Emphasis from "@/components/site/Emphasis";
import {
  FileText,
  Calculator,
  CheckCircle2,
  ArrowRight,
  Building2,
  Home,
  Factory,
  ChevronDown,
  ChevronUp,
  Zap,
  ClipboardList,
  Search,
  Handshake,
  BadgeCheck,
} from "lucide-react";
import { useState } from "react";
import type { Locale } from "@/lib/i18n/config";
import type { CeeContent } from "@/lib/i18n/content/cee";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { ROUTES } from "@/lib/i18n/routes";

/* ─────────────────────────────────────────
   Animation variant — fadeUp with stagger
───────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** Icônes des étapes, dans l'ordre de `content.method.steps`. */
const STEP_ICONS = [Search, FileText, Calculator, Handshake, BadgeCheck];

const STRONG = "font-semibold text-[#0D1B35]";

type Fiche = CeeContent["catalogue"]["residential"]["fiches"][number];

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */
function FicheCard({ fiche }: { fiche: Fiche }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-[#DBEAFE] bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md">
      <span className="font-mono text-[0.7rem] font-semibold tracking-widest text-[#2563EB]">
        {fiche.code}
      </span>
      <p className="font-display text-[1rem] font-semibold leading-snug text-[#0D1B35]">
        {fiche.name}
      </p>
      <p className="text-[0.82rem] leading-relaxed text-[#4A6285]">{fiche.description}</p>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#DBEAFE] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-display text-[1.05rem] font-semibold leading-snug text-[#0D1B35]">
          {question}
        </span>
        <span className="mt-0.5 shrink-0 text-[#2563EB]">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open && (
        <p className="pb-5 text-[0.9rem] leading-relaxed text-[#4A6285]">{answer}</p>
      )}
    </div>
  );
}

function FicheGroup({
  icon: Icon,
  heading,
  fiches,
  offset,
  className,
}: {
  icon: typeof Home;
  heading: string;
  fiches: Fiche[];
  offset: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <motion.div
        custom={offset}
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-5 flex items-center gap-2"
      >
        <Icon size={16} className="text-[#2563EB]" />
        <h3 className="font-display text-lg font-semibold text-[#0D1B35]">{heading}</h3>
      </motion.div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {fiches.map((fiche, i) => (
          <motion.div
            key={fiche.code}
            custom={offset + 1 + i}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <FicheCard fiche={fiche} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  locale: Locale;
  content: CeeContent;
  relatedDict: Dictionary["relatedLinks"];
}

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function CeePage({ locale, content, relatedDict }: Props) {
  const routes = ROUTES[locale];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: content.faq.items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ── 1. HERO ─────────────────────────────── */}
      <section className="bg-[#FAF8F5] pb-20 pt-24 md:pt-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="max-w-3xl">
            <motion.p
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-4 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]"
            >
              {content.hero.eyebrow}
            </motion.p>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-display mb-6 text-4xl font-bold leading-tight text-[#0D1B35] md:text-5xl lg:text-[3.25rem]"
            >
              {content.hero.title}
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-8 text-lg leading-relaxed text-[#4A6285]"
            >
              {content.hero.intro}
            </motion.p>

            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
              <Link
                href={routes.contact}
                className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1d4ed8] hover:shadow-lg hover:shadow-blue-200"
              >
                {content.hero.cta}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 2. QU'EST-CE QUE LES CEE ─────────────── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-4 flex items-center gap-3"
          >
            <Zap size={18} className="text-[#2563EB]" />
            <span className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]">
              {content.scheme.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            custom={1}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="font-display mb-10 text-3xl font-bold text-[#0D1B35] md:text-4xl"
          >
            {content.scheme.title}
          </motion.h2>

          <div className="grid gap-8 lg:grid-cols-2">
            {content.scheme.columns.map((paragraphs, col) => (
              <motion.div
                key={col}
                custom={2 + col}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="space-y-5 text-[0.95rem] leading-relaxed text-[#4A6285]"
              >
                {paragraphs.map((text) => (
                  <p key={text}>
                    <Emphasis text={text} className={STRONG} />
                  </p>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. FICHES CEE COURANTES ──────────────── */}
      <section className="bg-[#F5FAFF] py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-4 flex items-center gap-3"
          >
            <ClipboardList size={18} className="text-[#2563EB]" />
            <span className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]">
              {content.catalogue.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            custom={1}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="font-display mb-4 text-3xl font-bold text-[#0D1B35] md:text-4xl"
          >
            {content.catalogue.title}
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-12 max-w-2xl text-[0.95rem] leading-relaxed text-[#4A6285]"
          >
            {content.catalogue.intro}
          </motion.p>

          <FicheGroup
            icon={Home}
            heading={content.catalogue.residential.heading}
            fiches={content.catalogue.residential.fiches}
            offset={3}
            className="mb-12"
          />
          <FicheGroup
            icon={Building2}
            heading={content.catalogue.tertiary.heading}
            fiches={content.catalogue.tertiary.fiches}
            offset={9}
          />
          <FicheGroup
            icon={Factory}
            heading={content.catalogue.industry.heading}
            fiches={content.catalogue.industry.fiches}
            offset={15}
            className="mt-12"
          />
        </div>
      </section>

      {/* ── 4. NOTRE ACCOMPAGNEMENT ──────────────── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-4 flex items-center gap-3"
          >
            <CheckCircle2 size={18} className="text-[#2563EB]" />
            <span className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]">
              {content.method.eyebrow}
            </span>
          </motion.div>

          <motion.h2
            custom={1}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="font-display mb-4 text-3xl font-bold text-[#0D1B35] md:text-4xl"
          >
            {content.method.title}
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-14 max-w-2xl text-[0.95rem] leading-relaxed text-[#4A6285]"
          >
            {content.method.intro}
          </motion.p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {content.method.steps.map((step, i) => {
              const Icon = STEP_ICONS[i] ?? CheckCircle2;
              return (
                <motion.div
                  key={step.title}
                  custom={3 + i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="relative flex flex-col gap-4 rounded-2xl border border-[#DBEAFE] bg-[#F5FAFF] p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[2rem] font-bold leading-none text-[#BFDBFE]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                      <Icon size={18} className="text-[#2563EB]" />
                    </div>
                  </div>
                  <p className="font-display text-[1rem] font-semibold leading-snug text-[#0D1B35]">
                    {step.title}
                  </p>
                  <p className="text-[0.82rem] leading-relaxed text-[#4A6285]">
                    {step.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. FAQ ───────────────────────────────── */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_2fr]">
            <div>
              <motion.div
                custom={0}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mb-4 flex items-center gap-3"
              >
                <FileText size={18} className="text-[#2563EB]" />
                <span className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]">
                  {content.faq.eyebrow}
                </span>
              </motion.div>
              <motion.h2
                custom={1}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="font-display text-3xl font-bold text-[#0D1B35] md:text-4xl"
              >
                {content.faq.title}
              </motion.h2>
              <motion.p
                custom={2}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mt-4 text-[0.9rem] leading-relaxed text-[#4A6285]"
              >
                {content.faq.intro}
              </motion.p>
            </div>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="divide-y divide-[#DBEAFE]"
            >
              {content.faq.items.map((faq) => (
                <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── 7. CTA ───────────────────────────────── */}
      <section className="bg-[#F5FAFF] py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <p className="mb-3 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]">
              {content.cta.eyebrow}
            </p>
            <h2 className="font-display mb-5 text-3xl font-bold text-[#0D1B35] md:text-4xl">
              {content.cta.title}
            </h2>
            <p className="mb-8 text-[0.95rem] leading-relaxed text-[#4A6285]">
              {content.cta.text}
            </p>
            <Link
              href={routes.contact}
              className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[#1d4ed8] hover:shadow-lg hover:shadow-blue-200"
            >
              {content.cta.button}
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      <RelatedLinks
        eyebrow={relatedDict.eyebrow}
        ctaLabel={relatedDict.cta}
        title={content.related.title}
        subtitle={content.related.subtitle}
        links={[
          { href: routes.decarbonation, ...content.related.decarbonation },
          { href: routes.brokerage, ...content.related.brokerage },
          { href: routes.references, ...content.related.references },
        ]}
      />
    </>
  );
}
