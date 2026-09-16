"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Award, Leaf, Users, Target, CheckCircle } from "lucide-react";
import RelatedLinks from "@/components/site/RelatedLinks";
import type { Locale } from "@/lib/i18n/config";
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

const VALUES = [
  { key: "rigour", icon: Target },
  { key: "integrity", icon: Leaf },
  { key: "proximity", icon: Users },
  { key: "expertise", icon: Award },
] as const;

interface Props {
  locale: Locale;
  dict: Dictionary["about"];
  relatedDict: Dictionary["relatedLinks"];
}

export default function AboutPage({ locale, dict, relatedDict }: Props) {
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
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end"
          >
            <div className="lg:col-span-7">
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
                {dict.hero.eyebrow}
              </p>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-[#0D1B35] leading-[1.05]">
                {dict.hero.title}
                <br />
                <span className="italic text-[#2563EB]">{dict.hero.titleAccent}</span>
              </h1>
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <p className="text-[0.95rem] text-[#4A6285] leading-relaxed">
                {dict.hero.intro}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Image + Texte */}
      <section className="pb-24 md:pb-36">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 relative aspect-[4/3] overflow-hidden"
            >
              <Image
                src="https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=1200&q=80"
                alt={dict.story.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
              {/* Decorative overlay corner */}
              <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-[#60A5FA]/40 m-6" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 flex flex-col justify-center"
            >
              <div className="border-l-2 border-[#2563EB] pl-8 mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-light text-[#0D1B35] mb-6 leading-snug">
                  {dict.story.quote.before}
                  <span className="italic text-[#2563EB]">{dict.story.quote.accent1}</span>
                  {dict.story.quote.middle}
                  <span className="italic text-[#2563EB]">{dict.story.quote.accent2}</span>
                  {dict.story.quote.after}
                </h2>
              </div>
              {dict.story.paragraphs.map((paragraph, i) => (
                <p
                  key={paragraph}
                  className={`text-[0.92rem] text-[#4A6285] leading-[1.8] ${
                    i < dict.story.paragraphs.length - 1 ? "mb-6" : ""
                  }`}
                >
                  {paragraph}
                </p>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="py-24 md:py-36 bg-[#F5FAFF]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
              {dict.values.eyebrow}
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#0D1B35] leading-[1.1]">
              {dict.values.title.before}
              <span className="italic text-[#2563EB]">{dict.values.title.accent}</span>
              {dict.values.title.after}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#DBEAFE]">
            {VALUES.map((v, i) => (
              <motion.div
                key={v.key}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-[#F5FAFF] p-8 md:p-10 text-center hover:bg-white transition-colors duration-500"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#BFDBFE] mb-6">
                  <v.icon size={24} className="text-[#2563EB]" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-normal text-[#0D1B35] mb-3">
                  {dict.values.items[v.key].title}
                </h3>
                <p className="text-[0.85rem] text-[#4A6285] leading-relaxed">
                  {dict.values.items[v.key].desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-24 md:py-36">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-5"
            >
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
                {dict.qualifications.eyebrow}
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-light text-[#0D1B35] leading-[1.1] mb-6">
                {dict.qualifications.title}
                <br />
                <span className="italic text-[#2563EB]">{dict.qualifications.titleAccent}</span>
              </h2>
              <p className="text-[0.92rem] text-[#4A6285] leading-relaxed">
                {dict.qualifications.intro}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-6 lg:col-start-7"
            >
              <ul className="space-y-5">
                {dict.qualifications.items.map((cert) => (
                  <li
                    key={cert}
                    className="flex items-start gap-4 border-b border-[#DBEAFE] pb-5"
                  >
                    <CheckCircle
                      size={20}
                      className="text-[#2563EB] mt-0.5 shrink-0"
                      strokeWidth={1.5}
                    />
                    <span className="text-[0.92rem] text-[#0D1B35]">{cert}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <RelatedLinks
        variant="dark"
        eyebrow={relatedDict.eyebrow}
        ctaLabel={relatedDict.cta}
        title={dict.related.title}
        subtitle={dict.related.subtitle}
        links={[
          { href: routes.services, ...dict.related.services },
          { href: routes.references, ...dict.related.references },
          { href: routes.contact, ...dict.related.contact },
        ]}
      />
    </>
  );
}
