"use client";
/* eslint-disable react/no-unescaped-entities */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Thermometer,
  Gauge,
  LineChart,
  FileCheck2,
  ShieldCheck,
  Calculator,
  Building2,
  Factory,
  Home,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// ─── FAQ ────────────────────────────────────────────────────────────────────

const faqs = [
  {
    question: "Qu'est-ce qu'un bureau d'étude thermique ?",
    answer:
      "Un bureau d'étude thermique est une structure d'ingénierie spécialisée dans la performance énergétique des bâtiments. Il calcule les déperditions thermiques (parois opaques, ponts thermiques, vitrages, ventilation), modélise le comportement thermique dynamique (STD), dimensionne les solutions de rénovation et vérifie la conformité réglementaire (RT2012, RE2020, DPE, audit énergétique, Décret Tertiaire). Le bureau d'étude thermique intervient aussi bien en construction neuve qu'en rénovation énergétique.",
  },
  {
    question:
      "Quelle est la différence entre un bureau d'étude thermique et un BET fluides ?",
    answer:
      "Un bureau d'étude thermique se concentre sur l'enveloppe du bâtiment et la performance énergétique globale. Un BET fluides dimensionne les systèmes actifs : chauffage, ventilation, climatisation, plomberie, électricité. Sur un projet complexe, les deux compétences sont complémentaires — c'est pourquoi Kilowater, bureau d'étude en rénovation énergétique, intègre les deux périmètres.",
  },
  {
    question: "Qu'est-ce qu'une simulation thermique dynamique (STD) ?",
    answer:
      "La simulation thermique dynamique (STD) est une modélisation numérique fine du comportement thermique d'un bâtiment heure par heure sur une année. Contrairement au calcul réglementaire statique (méthode Th-BCE), la STD intègre les variations climatiques, l'inertie du bâti, les apports internes et le comportement des occupants. Elle permet d'anticiper les surchauffes estivales, d'optimiser les stratégies de rafraîchissement passif et de dimensionner avec précision les systèmes CVC. Un bureau d'étude thermique équipé d'outils comme Pleiades, Design Builder ou EnergyPlus peut fournir une STD de qualité.",
  },
  {
    question:
      "Quand faire appel à un bureau d'étude thermique plutôt qu'à un auditeur seul ?",
    answer:
      "L'auditeur réalise un diagnostic ponctuel. Le bureau d'étude thermique va plus loin : il conçoit les solutions, dimensionne les équipements, rédige les cahiers des charges, suit le chantier et valide les performances à la réception. Pour une simple évaluation énergétique, un audit suffit ; pour un projet de rénovation avec travaux, un bureau d'étude thermique est indispensable pour garantir la cohérence technique et l'atteinte des performances.",
  },
  {
    question: "Un bureau d'étude thermique est-il qualifié RGE ?",
    answer:
      "Oui, les bureaux d'étude thermique sérieux sont qualifiés RGE Études (référentiel OPQIBI 1905 pour l'audit énergétique tertiaire, 1911 pour l'industriel, 1901 pour les études thermiques de conception). Cette qualification est obligatoire pour que vos clients bénéficient de MaPrimeRénov', des CEE et de l'éco-PTZ. Kilowater dispose des qualifications RGE et OPQIBI nécessaires pour couvrir les missions de BET thermique en tertiaire et industriel.",
  },
  {
    question:
      "Combien coûte une mission de bureau d'étude thermique en 2026 ?",
    answer:
      "Les honoraires d'un bureau d'étude thermique varient selon le périmètre : 2 000 à 10 000 € HT pour un audit énergétique tertiaire, 3 500 à 8 000 € HT pour une simulation thermique dynamique, 15 000 € HT et plus pour un audit énergétique industriel EED. Pour une mission complète de maîtrise d'œuvre intégrant les études thermiques, le budget représente typiquement 8 à 12 % du montant HT des travaux. La majorité de ces prestations sont finançables par les CEE.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#DBEAFE] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-medium leading-snug text-[#0D1B35]">
          {question}
        </span>
        <ChevronDown
          className={`mt-0.5 h-5 w-5 flex-shrink-0 text-[#2563EB] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[600px] pb-5 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-[0.95rem] leading-relaxed text-[#4A6285]">{answer}</p>
      </div>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function BureauDEtudeThermiquePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="bg-[#FAF8F5]">
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0D1B35] py-24 md:py-32">
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80"
              alt="Thermographie infrarouge d'un bâtiment — bureau d'étude thermique"
              fill
              sizes="100vw"
              className="object-cover opacity-20"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#0D1B35]/80 via-[#0D1B35]/60 to-[#0D1B35]/90" />
          </div>

          <div className="relative mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="max-w-3xl"
            >
              <motion.p
                variants={fadeUp}
                className="mb-5 text-[0.72rem] uppercase tracking-[0.25em] text-[#93C5FD]"
              >
                BET Thermique
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl"
              >
                Bureau d'étude
                <br />
                thermique
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-[#CBD5E1]"
              >
                Kilowater est un{" "}
                <strong className="font-semibold text-white">
                  bureau d'étude thermique
                </strong>{" "}
                indépendant basé à Paris. Nous réalisons audits énergétiques,
                simulations thermiques dynamiques (STD), dimensionnements CVC
                et études de conformité RE2020 / Décret Tertiaire pour les
                bâtiments tertiaires, industriels et les copropriétés.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-wrap gap-4"
              >
                <Link
                  href="/contactez-nous"
                  className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  Demander un devis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/bureau-d-etude-renovation-energetique"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:border-white/60"
                >
                  Notre BET rénovation énergétique
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Définition */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.p
                variants={fadeUp}
                className="mb-4 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]"
              >
                Définition & rôle
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="font-display text-3xl font-semibold text-[#0D1B35] md:text-4xl"
              >
                Qu'est-ce qu'un bureau d'étude thermique ?
              </motion.h2>

              <motion.div
                variants={fadeUp}
                className="mt-6 max-w-3xl space-y-4 text-[#4A6285] leading-relaxed"
              >
                <p>
                  Un{" "}
                  <strong className="font-semibold text-[#0D1B35]">
                    bureau d'étude thermique
                  </strong>{" "}
                  — souvent abrégé <em>BET thermique</em> — est une structure
                  d'ingénierie indépendante spécialisée dans la physique du
                  bâtiment et la performance énergétique. Son rôle : modéliser
                  les flux thermiques, calculer les déperditions, dimensionner
                  l'enveloppe (isolation, menuiseries, étanchéité à l'air) et
                  garantir la conformité réglementaire des projets de
                  construction et de rénovation.
                </p>
                <p>
                  Le bureau d'étude thermique s'appuie sur des logiciels de
                  calcul (Pleiades+COMFIE, Design Builder, EnergyPlus, ClimaWin,
                  Perrenoud) et sur les méthodes Th-BCE (RT2012),
                  Th-B-C-E 2020 (RE2020) et NF EN ISO 52016. Il produit les
                  études réglementaires (attestations RE2020, DPE, audit
                  énergétique), les simulations thermiques dynamiques (STD) et
                  les dossiers techniques nécessaires au dépôt de permis ou à
                  l'obtention d'aides.
                </p>
                <p>
                  Chez Kilowater, notre approche de{" "}
                  <strong className="font-semibold text-[#0D1B35]">
                    bureau d'étude thermique
                  </strong>{" "}
                  va au-delà du calcul réglementaire. Nous intégrons le
                  dimensionnement CVC (PAC air/eau, eau/eau, groupes froid,
                  CTA, VMC double flux), la simulation dynamique du confort
                  d'été, l'optimisation des scénarios de rénovation et le
                  pilotage complet du projet jusqu'à la réception.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Missions */}
        <section className="bg-[#F5FAFF] py-20 md:py-28">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.p
                variants={fadeUp}
                className="mb-4 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]"
              >
                Nos missions
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="font-display text-3xl font-semibold text-[#0D1B35] md:text-4xl"
              >
                Les prestations d'un bureau d'étude thermique
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-4 max-w-3xl text-[#4A6285] leading-relaxed"
              >
                Un bureau d'étude thermique couvre un large spectre d'études,
                du calcul réglementaire à la simulation numérique fine. Voici
                les missions que Kilowater réalise pour ses clients tertiaires,
                industriels et résidentiels collectifs.
              </motion.p>

              <motion.div
                variants={staggerContainer}
                className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                {[
                  {
                    icon: Thermometer,
                    title: "Audit énergétique",
                    body: "Audit réglementaire (grande entreprise, DPE F/G, copropriété), audit incitatif tertiaire ou industriel (norme NF EN 16247). Identification des gisements d'économies, chiffrage des scénarios.",
                  },
                  {
                    icon: LineChart,
                    title: "Simulation thermique dynamique (STD)",
                    body: "Modélisation heure par heure du comportement thermique : besoins de chauffage, surchauffe estivale, confort adaptatif, dimensionnement fin des systèmes.",
                  },
                  {
                    icon: Gauge,
                    title: "Calculs réglementaires RE2020 / RT2012",
                    body: "Attestations Bbio, Cep, DH, études thermiques Th-BCE, tests d'étanchéité à l'air (BlowerDoor), DPE neuf et rénovation.",
                  },
                  {
                    icon: Calculator,
                    title: "Dimensionnement CVC",
                    body: "Dimensionnement des PAC, chaudières, groupes froid, CTA, VMC double flux selon les charges thermiques réelles et les profils d'occupation.",
                  },
                  {
                    icon: FileCheck2,
                    title: "Conformité Décret Tertiaire",
                    body: "Stratégie de réduction -40 % / -50 % / -60 %, déclaration OPERAT, plan d'actions pluriannuel, suivi des consommations.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Études de faisabilité énergétique",
                    body: "Étude d'opportunité ENR, raccordement réseau de chaleur, solaire thermique et photovoltaïque, récupération de chaleur fatale.",
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <motion.div
                    key={title}
                    variants={fadeUp}
                    className="rounded-2xl border border-[#DBEAFE] bg-white p-7"
                  >
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF]">
                      <Icon className="h-5 w-5 text-[#2563EB]" />
                    </div>
                    <h3 className="mb-2 font-semibold text-[#0D1B35]">{title}</h3>
                    <p className="text-sm leading-relaxed text-[#4A6285]">
                      {body}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Typologies bâtiments */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.p
                variants={fadeUp}
                className="mb-4 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]"
              >
                Typologies de bâtiments
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="font-display text-3xl font-semibold text-[#0D1B35] md:text-4xl"
              >
                Un bureau d'étude thermique pour tous types de bâtiments
              </motion.h2>

              <motion.div
                variants={staggerContainer}
                className="mt-12 grid gap-6 md:grid-cols-3"
              >
                {[
                  {
                    icon: Building2,
                    title: "Tertiaire",
                    items: [
                      "Bureaux et immeubles administratifs",
                      "Commerces et surfaces de vente",
                      "ERP (santé, enseignement, culture)",
                      "Hôtels et résidences",
                    ],
                  },
                  {
                    icon: Factory,
                    title: "Industrie",
                    items: [
                      "Sites de production et usines",
                      "Entrepôts logistiques",
                      "Process énergivores (froid, air comprimé)",
                      "Audits EED & ISO 50001",
                    ],
                  },
                  {
                    icon: Home,
                    title: "Résidentiel collectif",
                    items: [
                      "Copropriétés (PPT, audit)",
                      "Bailleurs sociaux",
                      "Logements locatifs",
                      "Rénovation globale BBC",
                    ],
                  },
                ].map(({ icon: Icon, title, items }) => (
                  <motion.div
                    key={title}
                    variants={fadeUp}
                    className="rounded-2xl border border-[#DBEAFE] bg-white p-7"
                  >
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF]">
                      <Icon className="h-5 w-5 text-[#2563EB]" />
                    </div>
                    <h3 className="mb-4 font-semibold text-[#0D1B35]">
                      {title}
                    </h3>
                    <ul className="space-y-2">
                      {items.map((it) => (
                        <li
                          key={it}
                          className="flex items-start gap-2 text-sm text-[#4A6285]"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#2563EB]" />
                          {it}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[#F5FAFF] py-20 md:py-28">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.p
                variants={fadeUp}
                className="mb-4 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]"
              >
                Questions fréquentes
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="font-display text-3xl font-semibold text-[#0D1B35] md:text-4xl"
              >
                Bureau d'étude thermique : vos questions
              </motion.h2>

              <motion.div
                variants={fadeUp}
                className="mt-10 max-w-3xl rounded-2xl border border-[#DBEAFE] bg-white px-6 py-2"
              >
                {faqs.map((faq) => (
                  <FaqItem
                    key={faq.question}
                    question={faq.question}
                    answer={faq.answer}
                  />
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0D1B35] py-20 md:py-28">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 text-center">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.h2
                variants={fadeUp}
                className="font-display text-3xl font-semibold text-white md:text-4xl"
              >
                Besoin d'un bureau d'étude thermique à Paris ?
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mx-auto mt-4 max-w-xl text-[#94A3B8] leading-relaxed"
              >
                Contactez Kilowater pour une première analyse gratuite de votre
                projet. Nous vous rappelons sous 48h avec un pré-chiffrage.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-10 flex flex-wrap justify-center gap-4"
              >
                <Link
                  href="/contactez-nous"
                  className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  Prendre contact
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/audit-energetique"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-sm font-medium text-white transition-colors hover:border-white/50"
                >
                  Audit énergétique
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
