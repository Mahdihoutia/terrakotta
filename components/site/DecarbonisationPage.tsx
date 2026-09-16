"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import RelatedLinks from "@/components/site/RelatedLinks";
import {
  ArrowRight,
  Gauge,
  LineChart,
  ShieldCheck,
  Building2,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { DecarbonisationContent } from "@/lib/i18n/content/decarbonisation";
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

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const PRESTATIONS = [
  { key: "footprint", icon: Gauge, num: "01" },
  { key: "pathway", icon: LineChart, num: "02" },
  { key: "compliance", icon: ShieldCheck, num: "03" },
  { key: "plan", icon: Building2, num: "04" },
] as const;

interface Props {
  locale: Locale;
  content: DecarbonisationContent;
  relatedDict: Dictionary["relatedLinks"];
}

export default function DecarbonisationPage({ locale, content, relatedDict }: Props) {
  const routes = ROUTES[locale];

  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1920&q=80"
            alt={content.hero.imageAlt}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-[#0D1B35]/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B35] via-[#0D1B35]/60 to-transparent" />
        </div>
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#60A5FA] mb-4">
              {content.hero.eyebrow}
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.05] mb-8">
              {content.hero.title}
              <br />
              <span className="italic text-[#60A5FA]">{content.hero.titleAccent}</span>
            </h1>
            <p className="text-[1rem] text-[#BFDBFE] leading-relaxed max-w-xl mb-10">
              {content.hero.intro}
            </p>
            <Link
              href={routes.contact}
              className="group inline-flex items-center gap-3 bg-[#2563EB] px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#1E40AF]"
            >
              {content.hero.cta}
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Prestations */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl mb-16"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
              {content.offer.eyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#0D1B35] leading-[1.1]">
              {content.offer.title}
              <span className="italic text-[#2563EB]">{content.offer.titleAccent}</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#DBEAFE]"
          >
            {PRESTATIONS.map((p, i) => (
              <motion.div
                key={p.num}
                variants={fadeUp}
                custom={i}
                className="group bg-[#F8FBFF] p-10 md:p-14 transition-colors duration-500 hover:bg-white"
              >
                <div className="flex items-start justify-between mb-8">
                  <span className="font-display text-6xl font-light text-[#DBEAFE] group-hover:text-[#BFDBFE] transition-colors duration-500">
                    {p.num}
                  </span>
                  <p.icon size={28} className="text-[#2563EB] opacity-60 group-hover:opacity-100 transition-opacity duration-500" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-normal text-[#0D1B35] mb-4">
                  {content.offer.items[p.key].title}
                </h3>
                <p className="text-[0.88rem] text-[#4A6285] leading-relaxed">
                  {content.offer.items[p.key].desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Méthode */}
      <section className="py-24 md:py-32 bg-[#0D1B35]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#60A5FA] mb-4">
                {content.method.eyebrow}
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-light text-[#F5FAFF] leading-[1.1]">
                {content.method.title}
                <br />
                <span className="italic text-[#60A5FA]">{content.method.titleAccent}</span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 grid grid-cols-1 gap-8">
              {content.method.steps.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="flex gap-6 border-b border-[#1B3356] pb-8 last:border-0"
                >
                  <span className="font-display text-3xl font-light text-[#60A5FA]/50 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl text-[#F5FAFF] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[0.9rem] text-[#7BAAC8] leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
            {content.faq.eyebrow}
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-[#0D1B35] leading-[1.1] mb-16">
            {content.faq.title}
            <span className="italic text-[#2563EB]">{content.faq.titleAccent}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {content.faq.items.map((f) => (
              <div key={f.q} className="border-t border-[#DBEAFE] pt-6">
                <h3 className="font-display text-xl text-[#0D1B35] mb-3">{f.q}</h3>
                <p className="text-[0.9rem] text-[#4A6285] leading-[1.7]">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RelatedLinks
        variant="dark"
        eyebrow={relatedDict.eyebrow}
        ctaLabel={relatedDict.cta}
        title={content.related.title}
        subtitle={content.related.subtitle}
        links={[
          { href: routes.cee, ...content.related.cee },
          { href: routes.brokerage, ...content.related.brokerage },
          { href: routes.contact, ...content.related.contact },
        ]}
      />
    </>
  );
}
