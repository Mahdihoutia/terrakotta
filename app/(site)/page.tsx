"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Thermometer,
  FileCheck,
  HardHat,
  Shield,
  ChevronRight,
  Quote,
} from "lucide-react";

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
  {
    icon: Thermometer,
    title: "Audit énergétique",
    desc: "Diagnostic complet de la performance thermique de votre bâtiment. Identification des déperditions et préconisations hiérarchisées.",
    num: "01",
  },
  {
    icon: HardHat,
    title: "Maîtrise d'œuvre",
    desc: "Pilotage des travaux de rénovation de A à Z. Coordination des corps de métier, suivi qualité et respect des délais.",
    num: "02",
  },
  {
    icon: FileCheck,
    title: "Accompagnement CEE & aides",
    desc: "Montage des dossiers MaPrimeRénov', CEE et aides locales. Optimisation du reste à charge pour chaque projet.",
    num: "03",
  },
  {
    icon: Shield,
    title: "Thermique du bâtiment",
    desc: "Études thermiques réglementaires RT/RE. Simulations dynamiques et modélisation des performances énergétiques.",
    num: "04",
  },
];

const CHIFFRES = [
  { value: "150+", label: "Projets réalisés" },
  { value: "40%", label: "Économies d'énergie moyennes" },
  { value: "12", label: "Années d'expertise" },
  { value: "98%", label: "Clients satisfaits" },
];

const REFERENCES = [
  {
    title: "Résidence Voltaire",
    type: "Copropriété — 64 logements",
    location: "Paris 11e",
    result: "– 47% de consommation énergétique",
    image:
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    year: "2025",
  },
  {
    title: "Lycée International de Saint-Germain",
    type: "Collectivité — Bâtiment tertiaire",
    location: "Saint-Germain-en-Laye",
    result: "Passage de E à B sur le DPE",
    image:
      "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
    year: "2024",
  },
  {
    title: "Hôtel particulier Marais",
    type: "Particulier — Monument historique",
    location: "Paris 4e",
    result: "– 38% de consommation, respect du patrimoine",
    image:
      "https://images.unsplash.com/photo-1486325212027-8a9f54f1290a?w=800&q=80",
    year: "2024",
  },
  {
    title: "Tour Haussmann — Siège BNP Paribas RE",
    type: "Tertiaire — 12 000 m²",
    location: "La Défense",
    result: "Conformité décret tertiaire – 40%",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    year: "2024",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Terrakotta a su transformer notre copropriété vieillissante en un bâtiment performant. Le suivi a été irréprochable du diagnostic jusqu'à la réception des travaux.",
    author: "Marc Dufresne",
    role: "Syndic, Résidence Les Oliviers",
  },
  {
    quote:
      "Grâce à leur expertise sur les aides financières, notre reste à charge a été divisé par trois. Un accompagnement précieux et transparent.",
    author: "Sophie Laurent",
    role: "Propriétaire, Mas de la Garrigue",
  },
  {
    quote:
      "Professionnalisme, rigueur technique et vraie capacité d'écoute. Terrakotta est devenu notre partenaire de référence pour tous nos projets de rénovation.",
    author: "Jean-Pierre Morel",
    role: "Directeur technique, Mairie de Marseille",
  },
];

/* ─────────── Page Component ─────────── */
export default function HomePage() {
  return (
    <>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1486325212027-8a9f54f1290a?w=1920&q=85"
            alt="Grand immeuble parisien haussmannien"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f08]/90 via-[#1a0f08]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a0f08]/30 to-transparent" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-[1400px] w-full px-6 md:px-10 lg:px-16 pb-20 md:pb-28 pt-40">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[0.72rem] uppercase tracking-[0.3em] text-[#C4956A] mb-6"
              >
                Bureau d&apos;étude en rénovation énergétique
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="font-display text-5xl md:text-7xl lg:text-[5.5rem] font-light text-white leading-[1.05] mb-8"
              >
                Rénover
                <span className="italic text-[#C4956A]"> l&apos;existant</span>,
                <br />
                construire
                <br />
                <span className="italic text-[#C4956A]">l&apos;avenir</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="text-[1.05rem] text-[#D4C4B0] max-w-lg leading-relaxed mb-10"
              >
                Nous transformons le bâti existant en espaces performants,
                confortables et durables. De l&apos;audit à la livraison,
                chaque projet est une promesse d&apos;excellence.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="flex flex-wrap gap-4"
              >
                <Link
                  href="/contactez-nous"
                  className="group inline-flex items-center gap-3 bg-[#8B4513] px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#A0522D]"
                >
                  Démarrer un projet
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>
                <Link
                  href="/nos-prestations"
                  className="inline-flex items-center gap-3 border border-white/30 px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:border-white/60 hover:bg-white/5"
                >
                  Nos expertises
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
              <div className="flex flex-col items-center gap-3 text-[#C4956A]">
                <span className="text-[0.65rem] uppercase tracking-[0.25em] [writing-mode:vertical-lr]">
                  Défiler
                </span>
                <div className="w-px h-16 bg-gradient-to-b from-[#C4956A] to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ ILS NOUS FONT CONFIANCE ═══════════ */}
      <section className="py-14 md:py-16 bg-[#FAF8F5] border-b border-[#E8E0D4] overflow-hidden">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 mb-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center text-[0.72rem] uppercase tracking-[0.25em] text-[#8B7B6E]"
          >
            Ils nous font confiance
          </motion.p>
        </div>
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[#FAF8F5] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[#FAF8F5] to-transparent z-10" />
          {/* Scrolling track */}
          <div className="flex animate-scroll-logos">
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex shrink-0 items-center gap-16 md:gap-24 px-8 md:px-12">
                {[
                  "BNP Paribas Real Estate",
                  "Mairie de Paris",
                  "Dalkia",
                  "Bouygues Immobilier",
                  "Nexity",
                  "Île-de-France Énergies",
                  "ADEME",
                  "Eiffage Énergie",
                ].map((name) => (
                  <span
                    key={`${setIndex}-${name}`}
                    className="shrink-0 text-[1rem] md:text-[1.15rem] font-semibold tracking-[0.04em] text-[#C4B8A8] whitespace-nowrap select-none"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    {name}
                  </span>
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

      {/* ═══════════ CHIFFRES CLÉS ═══════════ */}
      <section className="bg-[#2C1810] py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
          >
            {CHIFFRES.map((item, i) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                custom={i}
                className="text-center"
              >
                <p className="font-display text-4xl md:text-5xl font-light text-[#C4956A] mb-2">
                  {item.value}
                </p>
                <p className="text-[0.78rem] uppercase tracking-[0.15em] text-[#A0876E]">
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
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] mb-4">
                Nos expertises
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-[#2C1810] leading-[1.1]">
                Un savoir-faire
                <br />
                <span className="italic text-[#8B4513]">complet</span>
              </h2>
            </div>
            <div className="lg:col-span-5 lg:col-start-8 flex items-end">
              <p className="text-[0.95rem] text-[#6B5B50] leading-relaxed">
                De l&apos;audit initial à la réception des travaux, nous mobilisons
                une expertise transversale pour garantir la réussite de chaque
                projet de rénovation énergétique.
              </p>
            </div>
          </motion.div>

          {/* Expertise Grid — Magazine Style */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#E8E0D4]"
          >
            {EXPERTISES.map((item, i) => (
              <motion.div
                key={item.num}
                variants={fadeUp}
                custom={i}
                className="group bg-[#FAF8F5] p-10 md:p-14 transition-colors duration-500 hover:bg-[#F5F0EB]"
              >
                <div className="flex items-start justify-between mb-8">
                  <span className="font-display text-6xl font-light text-[#E8E0D4] group-hover:text-[#D4C4B0] transition-colors duration-500">
                    {item.num}
                  </span>
                  <item.icon
                    size={28}
                    className="text-[#8B4513] opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                    strokeWidth={1.5}
                  />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-normal text-[#2C1810] mb-4">
                  {item.title}
                </h3>
                <p className="text-[0.88rem] text-[#6B5B50] leading-relaxed">
                  {item.desc}
                </p>
                <Link
                  href="/nos-prestations"
                  className="mt-8 flex items-center gap-2 text-[#8B4513] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500"
                >
                  <span className="text-[0.78rem] font-semibold uppercase tracking-[0.12em]">
                    En savoir plus
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
              href="/nos-prestations"
              className="group inline-flex items-center gap-3 border border-[#8B4513] px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-[#8B4513] transition-all duration-300 hover:bg-[#8B4513] hover:text-white"
            >
              Toutes nos prestations
              <ChevronRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ RÉFÉRENCES / RÉALISATIONS ═══════════ */}
      <section className="py-24 md:py-36 bg-[#F5F0EB]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-16"
          >
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] mb-4">
                Nos références
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-[#2C1810] leading-[1.1]">
                Des projets
                <span className="italic text-[#8B4513]"> qui parlent</span>
              </h2>
            </div>
            <Link
              href="/nos-references"
              className="group inline-flex items-center gap-2 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[#8B4513] hover:text-[#6B3A1F] transition-colors"
            >
              Voir toutes les références
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
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f08]/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                <span className="inline-block mb-3 text-[0.68rem] uppercase tracking-[0.2em] text-[#C4956A]">
                  {REFERENCES[0].type} — {REFERENCES[0].year}
                </span>
                <h3 className="font-display text-3xl md:text-4xl font-light text-white mb-2">
                  {REFERENCES[0].title}
                </h3>
                <p className="text-[0.88rem] text-[#D4C4B0] mb-1">
                  {REFERENCES[0].location}
                </p>
                <p className="text-[0.82rem] font-semibold text-[#C4956A]">
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
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f08]/80 via-[#1a0f08]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <span className="inline-block mb-2 text-[0.65rem] uppercase tracking-[0.2em] text-[#C4956A]">
                      {ref.type} — {ref.year}
                    </span>
                    <h3 className="font-display text-xl md:text-2xl font-light text-white mb-1">
                      {ref.title}
                    </h3>
                    <p className="text-[0.78rem] text-[#D4C4B0]">
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
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#1a0f08]/80 via-[#1a0f08]/30 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 md:p-12 max-w-xl">
                <span className="inline-block mb-3 text-[0.68rem] uppercase tracking-[0.2em] text-[#C4956A]">
                  {REFERENCES[3].type} — {REFERENCES[3].year}
                </span>
                <h3 className="font-display text-2xl md:text-4xl font-light text-white mb-2">
                  {REFERENCES[3].title}
                </h3>
                <p className="text-[0.88rem] text-[#D4C4B0]">
                  {REFERENCES[3].location} · {REFERENCES[3].result}
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-24 md:py-36 bg-[#FAF8F5]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] mb-4">
              Témoignages
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-[#2C1810] leading-[1.1]">
              La confiance de nos <span className="italic text-[#8B4513]">clients</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6"
          >
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.author}
                variants={fadeUp}
                custom={i}
                className="relative border border-[#E8E0D4] p-8 md:p-10 bg-white hover:border-[#C4956A]/40 transition-colors duration-500"
              >
                <Quote
                  size={32}
                  className="text-[#E8E0D4] mb-6"
                  strokeWidth={1}
                />
                <blockquote className="font-display text-[1.15rem] md:text-[1.25rem] font-light text-[#2C1810] leading-relaxed mb-8 italic">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div className="border-t border-[#E8E0D4] pt-6">
                  <p className="text-[0.88rem] font-semibold text-[#2C1810]">
                    {t.author}
                  </p>
                  <p className="text-[0.78rem] text-[#8B7B6E] mt-1">
                    {t.role}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ APPROCHE — Editorial Band ═══════════ */}
      <section className="relative py-28 md:py-40 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80"
            alt="Chantier de rénovation"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[#2C1810]/85" />
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
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#C4956A] mb-4">
                Notre approche
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-light text-[#F5F0EB] leading-[1.1] mb-6">
                Rigueur technique,
                <br />
                <span className="italic text-[#C4956A]">vision humaine</span>
              </h2>
              <p className="text-[0.95rem] text-[#D4C4B0] leading-relaxed max-w-md mb-8">
                Chaque bâtiment a son histoire. Notre rôle est de comprendre ses
                contraintes, révéler son potentiel et concevoir une rénovation
                qui allie performance, confort et pérennité.
              </p>
              <Link
                href="/qui-sommes-nous"
                className="group inline-flex items-center gap-3 border border-[#C4956A] px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-[#F5F0EB] transition-all duration-300 hover:bg-[#C4956A] hover:text-[#2C1810]"
              >
                Découvrir Terrakotta
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            </div>

            <div className="lg:col-span-5 lg:col-start-8 grid grid-cols-1 gap-8">
              {[
                {
                  step: "01",
                  title: "Diagnostic",
                  text: "Analyse complète du bâti, des usages et du potentiel d'amélioration.",
                },
                {
                  step: "02",
                  title: "Conception",
                  text: "Élaboration d'un programme de travaux optimisé technico-économiquement.",
                },
                {
                  step: "03",
                  title: "Réalisation",
                  text: "Pilotage du chantier, contrôle qualité et livraison dans les délais.",
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="flex gap-6"
                >
                  <span className="font-display text-3xl font-light text-[#C4956A]/50 shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-display text-xl text-[#F5F0EB] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[0.85rem] text-[#A0876E] leading-relaxed">
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
