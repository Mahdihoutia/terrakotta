"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Thermometer,
  FileCheck,
  LineChart,
  Repeat,
  ChevronRight,
  Zap,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { ROUTES } from "@/lib/i18n/routes";

/* ─────────── Animation Variants ─────────── */
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

/* ─────────── Data ─────────── */
const EXPERTISES = [
  { key: "cee", icon: FileCheck, num: "01", route: "cee" },
  { key: "decarbonation", icon: LineChart, num: "02", route: "decarbonation" },
  { key: "brokerage", icon: Repeat, num: "03", route: "brokerage" },
  { key: "field", icon: Thermometer, num: "04", route: "services" },
] as const;

/** Visuels des références, dans l'ordre de `dict.references.items`. */
const REFERENCE_MEDIA = [
  {
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    year: "2025",
  },
  {
    image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80",
    year: "2024",
  },
  {
    image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    year: "2024",
  },
  {
    image: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=800&q=80",
    year: "2024",
  },
];

/** Video background URL — Aerial view of a solar panel farm at sunset */
const VIDEO_BG_URL = "https://assets.mixkit.co/videos/46623/46623-720.mp4";

interface Props {
  locale: Locale;
  dict: Dictionary["home"];
}

/* ─────────── Page Component ─────────── */
export default function HomePage({ locale, dict }: Props) {
  const routes = ROUTES[locale];
  const REFERENCES = dict.references.items.map((item, i) => ({
    ...item,
    ...REFERENCE_MEDIA[i],
  }));

  return (
    <>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            crossOrigin="anonymous"
            className="absolute inset-0 w-full h-full object-cover brightness-75"
            poster="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1920&q=80"
          >
            <source src={VIDEO_BG_URL} type="video/mp4" />
          </video>
          {/* Overlay principal — très léger */}
          <div className="absolute inset-0 bg-[#05101F]/20" />
          {/* Gradient bas → haut pour lisibilité du texte */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#05101F]/75 via-[#05101F]/10 to-transparent" />
          {/* Touche bleue subtile */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1F4E]/15 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-[1400px] w-full px-6 md:px-10 lg:px-16 pb-20 md:pb-28 pt-40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[0.72rem] uppercase tracking-[0.3em] text-[#60A5FA] mb-6"
                aria-hidden="true"
              >
                {dict.hero.eyebrow}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-5xl md:text-7xl lg:text-[5.5rem] font-light text-white leading-[1.05] mb-8"
              >
                <span className="sr-only">{dict.hero.srTitle}</span>
                {dict.hero.titleLines.map((line) => (
                  <Fragment key={line}>
                    {line}
                    <br />
                  </Fragment>
                ))}
                <span className="italic text-[#60A5FA]">{dict.hero.titleAccent}</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-[1.05rem] text-[#BFDBFE] max-w-lg leading-relaxed mb-10"
              >
                {dict.hero.text}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-wrap gap-4"
              >
                <Link
                  href={routes.contact}
                  className="group inline-flex items-center gap-3 bg-[#2563EB] px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#A0522D]"
                >
                  {dict.hero.primaryCta}
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href={routes.services}
                  className="inline-flex items-center gap-3 border border-white/30 px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:border-white/60 hover:bg-white/5"
                >
                  {dict.hero.secondaryCta}
                </Link>
              </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.6 }}
              className="hidden lg:flex lg:col-span-4 justify-end items-end"
            >
              <div className="flex flex-col items-center gap-3 text-[#60A5FA]">
                <span className="text-[0.65rem] uppercase tracking-[0.25em] [writing-mode:vertical-lr]">
                  {dict.hero.scroll}
                </span>
                <div className="w-px h-16 bg-gradient-to-b from-[#60A5FA] to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ CHIFFRES CLÉS ═══════════ */}
      <section className="bg-[#0D1B35] py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
          >
            {dict.figures.map((item, i) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <p className="font-display text-4xl md:text-5xl font-light text-[#60A5FA] mb-2">
                  {item.value}
                </p>
                <p className="text-[0.78rem] uppercase tracking-[0.15em] text-[#7BAAC8]">
                  {item.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ EXPERTISES ═══════════ */}
      <section className="py-24 md:py-36">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20"
          >
            <div className="lg:col-span-5">
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
                {dict.offer.eyebrow}
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-[#0D1B35] leading-[1.1]">
                {dict.offer.title}
                <br />
                <span className="italic text-[#2563EB]">{dict.offer.titleAccent}</span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 flex items-end">
              <p className="text-[0.95rem] text-[#4A6285] leading-relaxed">
                {dict.offer.intro}
              </p>
            </div>
          </motion.div>

          {/* Expertise Grid — Magazine Style */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#DBEAFE]"
          >
            {EXPERTISES.map((item, i) => (
              <motion.div
                key={item.num}
                variants={fadeUp}
                custom={i}
                className="group bg-[#F8FBFF] p-10 md:p-14 transition-colors duration-500 hover:bg-[#F5FAFF]"
              >
                <div className="flex items-start justify-between mb-8">
                  <span className="font-display text-6xl font-light text-[#DBEAFE] group-hover:text-[#BFDBFE] transition-colors duration-500">
                    {item.num}
                  </span>
                  <item.icon
                    size={28}
                    className="text-[#2563EB] opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-normal text-[#0D1B35] mb-4">
                  {dict.offer.items[item.key].title}
                </h3>
                <p className="text-[0.88rem] text-[#4A6285] leading-relaxed">
                  {dict.offer.items[item.key].desc}
                </p>
                <Link
                  href={routes[item.route]}
                  className="mt-8 flex items-center gap-2 text-[#2563EB] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500"
                >
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.12em]">
                    {dict.offer.learnMore}
                  </span>
                  <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-14 text-center"
          >
            <Link
              href={routes.services}
              className="group inline-flex items-center gap-3 border border-[#2563EB] px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-[#2563EB] transition-all duration-300 hover:bg-[#2563EB] hover:text-white"
            >
              {dict.offer.allServices}
              <ChevronRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ ILS NOUS FONT CONFIANCE ═══════════ */}
      <section className="py-14 md:py-16 bg-[#F8FBFF] border-y border-[#DBEAFE] overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 mb-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-[0.72rem] uppercase tracking-[0.25em] text-[#94A3B8]"
          >
            {dict.trust.heading}
          </motion.p>
        </div>
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[#F8FBFF] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[#F8FBFF] to-transparent z-10" />
          {/* Scrolling track */}
          <div className="flex animate-scroll-logos">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex shrink-0 items-center gap-14 md:gap-20 px-8 md:px-12">
                {[
                  { src: "/brand/partners/bnp-paribas-re.svg", alt: "BNP Paribas Real Estate", w: 180 },
                  { src: "/brand/partners/mairie-paris.svg", alt: "Mairie de Paris", w: 150 },
                  { src: "/brand/partners/dalkia.svg", alt: "Dalkia", w: 120 },
                  { src: "/brand/partners/bouygues-immobilier.svg", alt: "Bouygues Immobilier", w: 180 },
                  { src: "/brand/partners/nexity.svg", alt: "Nexity", w: 120 },
                  { src: "/brand/partners/idf-energies.svg", alt: "Île-de-France Énergies", w: 200 },
                  { src: "/brand/partners/ademe.svg", alt: "ADEME", w: 120 },
                  { src: "/brand/partners/eiffage-energie.svg", alt: "Eiffage Énergie", w: 170 },
                ].map((logo) => (
                  <img
                    key={`${setIndex}-${logo.alt}`}
                    src={logo.src}
                    alt={logo.alt}
                    className="shrink-0 h-10 md:h-12 w-auto select-none opacity-40 hover:opacity-60 transition-opacity duration-300"
                    style={{ width: logo.w, color: "#94A3B8" }}
                    draggable={false}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes scroll-logos {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-scroll-logos {
            animation: scroll-logos 30s linear infinite;
          }
          .animate-scroll-logos:hover {
            animation-play-state: paused;
          }
        `}</style>
      </section>

      {/* ═══════════ VIDEO SLOGAN ═══════════ */}
      <section className="relative h-[80vh] md:h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Video — Ingénieurs inspectant une armoire électrique */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          aria-label={dict.commitment.videoLabel}
          poster="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1920&q=80"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src="https://assets.mixkit.co/videos/23695/23695-720.mp4" type="video/mp4" />
        </video>
        {/* Overlay — adapté mobile/desktop */}
        <div className="absolute inset-0 bg-[#030D1F]/55 md:bg-[#030D1F]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/70 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 mb-8 border border-[#60A5FA]/40 rounded-full px-5 py-2">
              <Zap size={14} className="text-[#60A5FA]" />
              <span className="text-[0.72rem] uppercase tracking-[0.25em] text-[#60A5FA]">
                {dict.commitment.eyebrow}
              </span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl lg:text-[6rem] xl:text-[7rem] font-light text-white leading-[1] mb-8">
              {dict.commitment.title}
              {dict.commitment.titleAccentLines.map((line) => (
                <Fragment key={line}>
                  <br />
                  <span className="italic text-[#60A5FA]">{line}</span>
                </Fragment>
              ))}
              <span className="text-white">.</span>
            </h2>
            <p className="text-[1.05rem] md:text-[1.2rem] text-[#BFDBFE] max-w-2xl mx-auto leading-relaxed mb-12">
              {dict.commitment.text}
            </p>
            <Link
              href={routes.contact}
              className="group inline-flex items-center gap-3 bg-[#60A5FA] px-10 py-5 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[#0D1B35] transition-all duration-300 hover:bg-[#93C5FD]"
            >
              {dict.commitment.cta}
              <ArrowRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F5FAFF] to-transparent" />
      </section>

      {/* ═══════════ RÉFÉRENCES / RÉALISATIONS ═══════════ */}
      <section className="py-24 md:py-36 bg-[#F5FAFF]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16"
          >
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
                {dict.references.eyebrow}
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-[#0D1B35] leading-[1.1]">
                {dict.references.title}
                <span className="italic text-[#2563EB]">{dict.references.titleAccent}</span>
              </h2>
            </div>
            <Link
              href={routes.references}
              className="group inline-flex items-center gap-2 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[#2563EB] hover:text-[#1E40AF] transition-colors"
            >
              {dict.references.seeAll}
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </motion.div>

          {/* Magazine Grid Layout */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-12 gap-5"
          >
            {/* Large feature */}
            <motion.div
              variants={fadeUp}
              custom={0}
              className="md:col-span-7 group relative overflow-hidden aspect-[4/3] md:aspect-auto md:min-h-[520px]"
            >
              <Image
                src={REFERENCES[0].image}
                alt={REFERENCES[0].title}
                fill
                sizes="(max-width: 768px) 100vw, 58vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                <span className="inline-block mb-3 text-[0.68rem] uppercase tracking-[0.2em] text-[#60A5FA]">
                  {REFERENCES[0].type} — {REFERENCES[0].year}
                </span>
                <h3 className="font-display text-3xl md:text-4xl font-light text-white mb-2">
                  {REFERENCES[0].title}
                </h3>
                <p className="text-[0.88rem] text-[#BFDBFE] mb-1">
                  {REFERENCES[0].location}
                </p>
                <p className="text-[0.82rem] font-semibold text-[#60A5FA]">
                  {REFERENCES[0].result}
                </p>
              </div>
            </motion.div>

            {/* Right column — stacked */}
            <div className="md:col-span-5 flex flex-col gap-5">
              {REFERENCES.slice(1, 3).map((ref, i) => (
                <motion.div
                  key={ref.title}
                  variants={fadeUp}
                  custom={i + 1}
                  className="group relative overflow-hidden aspect-[16/10] md:flex-1 md:aspect-auto"
                >
                  <Image
                    src={ref.image}
                    alt={ref.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 42vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628]/80 via-[#0A1628]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <span className="inline-block mb-2 text-[0.65rem] uppercase tracking-[0.2em] text-[#60A5FA]">
                      {ref.type} — {ref.year}
                    </span>
                    <h3 className="font-display text-xl md:text-2xl font-light text-white mb-1">
                      {ref.title}
                    </h3>
                    <p className="text-[0.78rem] text-[#BFDBFE]">
                      {ref.location} · {ref.result}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Bottom wide card */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="md:col-span-12 group relative overflow-hidden aspect-[21/9]"
            >
              <Image
                src={REFERENCES[3].image}
                alt={REFERENCES[3].title}
                fill
                sizes="100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628]/80 via-[#0A1628]/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-xl">
                <span className="inline-block mb-3 text-[0.68rem] uppercase tracking-[0.2em] text-[#60A5FA]">
                  {REFERENCES[3].type} — {REFERENCES[3].year}
                </span>
                <h3 className="font-display text-2xl md:text-4xl font-light text-white mb-2">
                  {REFERENCES[3].title}
                </h3>
                <p className="text-[0.88rem] text-[#BFDBFE]">
                  {REFERENCES[3].location} · {REFERENCES[3].result}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ APPROCHE — Editorial Band ═══════════ */}
      <section className="relative py-28 md:py-40 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80"
            alt={dict.approach.imageAlt}
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#0D1B35]/85" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
          >
            <div className="lg:col-span-6">
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#60A5FA] mb-4">
                {dict.approach.eyebrow}
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-light text-[#F5FAFF] leading-[1.1] mb-6">
                {dict.approach.title}
                <br />
                <span className="italic text-[#60A5FA]">{dict.approach.titleAccent}</span>
              </h2>
              <p className="text-[0.95rem] text-[#BFDBFE] leading-relaxed max-w-md mb-8">
                {dict.approach.text}
              </p>
              <Link
                href={routes.about}
                className="group inline-flex items-center gap-3 border border-[#60A5FA] px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-[#F5FAFF] transition-all duration-300 hover:bg-[#60A5FA] hover:text-[#0D1B35]"
              >
                {dict.approach.cta}
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>

            <div className="lg:col-span-5 lg:col-start-8 grid grid-cols-1 gap-8">
              {dict.approach.steps.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="flex gap-6"
                >
                  <span className="font-display text-3xl font-light text-[#60A5FA]/50 shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-display text-xl text-[#F5FAFF] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[0.85rem] text-[#7BAAC8] leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
