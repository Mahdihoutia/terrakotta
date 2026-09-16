"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import RelatedLinks from "@/components/site/RelatedLinks";
import {
  FileCheck,
  LineChart,
  Repeat,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { ServicesContent } from "@/lib/i18n/content/services";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { ROUTES } from "@/lib/i18n/routes";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/** Ancres stables (`#cee`, `#decarbonation`…) — identiques dans toutes les langues. */
const PRESTATIONS = [
  {
    id: "cee",
    icon: FileCheck,
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
  },
  {
    id: "decarbonation",
    icon: LineChart,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    id: "courtage",
    icon: Repeat,
    image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&q=80",
  },
  {
    id: "suivi",
    icon: BarChart3,
    image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80",
  },
] as const;

interface Props {
  locale: Locale;
  content: ServicesContent;
  relatedDict: Dictionary["relatedLinks"];
}

export default function ServicesPage({ locale, content, relatedDict }: Props) {
  const routes = ROUTES[locale];

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
              {content.hero.eyebrow}
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-[#0D1B35] leading-[1.05] mb-8">
              {content.hero.title}
              <br />
              <span className="italic text-[#2563EB]">{content.hero.titleAccent}</span>
            </h1>
            <p className="text-[1rem] text-[#4A6285] leading-relaxed max-w-xl">
              {content.hero.intro}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Prestations List */}
      <section className="pb-24 md:pb-36">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="space-y-0">
            {PRESTATIONS.map((p, i) => {
              const item = content.items[p.id];
              return (
                <motion.article
                  key={p.id}
                  id={p.id}
                  variants={fadeUp}
                  custom={0}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  className={`scroll-mt-28 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 py-16 md:py-24 border-t border-[#DBEAFE] ${
                    i === PRESTATIONS.length - 1 ? "border-b" : ""
                  }`}
                >
                  {/* Image — alternating sides */}
                  <div
                    className={`lg:col-span-5 relative aspect-[4/3] overflow-hidden ${
                      i % 2 === 1 ? "lg:order-2 lg:col-start-8" : ""
                    }`}
                  >
                    <Image
                      src={p.image}
                      alt={item.title}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover hover:scale-105 transition-transform duration-700"
                    />
                    {/* Number overlay */}
                    <div className="absolute top-6 left-6 font-display text-7xl font-light text-white/20">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                  </div>

                  {/* Content */}
                  <div
                    className={`lg:col-span-6 flex flex-col justify-center ${
                      i % 2 === 1 ? "lg:order-1 lg:col-start-1" : "lg:col-start-7"
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full border border-[#BFDBFE] flex items-center justify-center shrink-0">
                        <p.icon size={22} className="text-[#2563EB]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[0.66rem] uppercase tracking-[0.2em] text-[#2563EB] mb-1">
                          {item.pillar}
                        </p>
                        <h2 className="font-display text-3xl md:text-4xl font-normal text-[#0D1B35]">
                          {item.title}
                        </h2>
                      </div>
                    </div>

                    <p className="text-[0.92rem] text-[#4A6285] leading-[1.8] mb-8">
                      {item.desc}
                    </p>

                    <ul className="space-y-3 mb-8">
                      {item.details.map((d) => (
                        <li
                          key={d}
                          className="flex items-center gap-3 text-[0.85rem] text-[#0D1B35]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={routes.contact}
                      className="group inline-flex items-center gap-2 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-[#2563EB] hover:text-[#1E40AF] transition-colors w-fit"
                    >
                      {content.contactLink}
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-[#F5FAFF]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
              {content.cta.eyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#0D1B35] leading-[1.1] mb-6">
              {content.cta.title}
              <br />
              <span className="italic text-[#2563EB]">{content.cta.titleAccent}</span>
            </h2>
            <p className="text-[0.95rem] text-[#4A6285] leading-relaxed max-w-md mx-auto mb-10">
              {content.cta.text}
            </p>
            <Link
              href={routes.contact}
              className="group inline-flex items-center gap-3 bg-[#2563EB] px-10 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#1E40AF]"
            >
              {content.cta.button}
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
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
          { href: routes.cee, ...content.related.cee },
          { href: routes.decarbonation, ...content.related.decarbonation },
          { href: routes.brokerage, ...content.related.brokerage },
        ]}
      />
    </>
  );
}
