"use client";
/* eslint-disable react/no-unescaped-entities */

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Thermometer,
  Wind,
  Zap,
  FileSearch,
  Factory,
  Home,
  Building2,
  Landmark,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Microscope,
  BarChart3,
  FileText,
  Euro,
} from "lucide-react";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const faqData = [
  {
    question: "Quelle est la différence entre DPE et audit énergétique ?",
    answer:
      "Le DPE (Diagnostic de Performance Énergétique) est un document standardisé qui classe un logement de A à G selon sa consommation d'énergie et ses émissions de CO₂. Il repose sur des données déclaratives et des méthodes de calcul conventionnelles. L'audit énergétique va bien au-delà : il réalise une analyse détaillée de l'enveloppe du bâtiment, des systèmes de chauffage, de ventilation et d'eau chaude sanitaire, en intégrant les conditions réelles d'occupation. Il produit plusieurs scénarios de travaux chiffrés, hiérarchisés par rapport coût/bénéfice, avec les économies d'énergie attendues et les aides financières mobilisables.",
  },
  {
    question: "L'audit énergétique est-il obligatoire ?",
    answer:
      "Depuis le 1er avril 2023, l'audit énergétique réglementaire est obligatoire lors de la vente d'une maison individuelle classée F ou G (les « passoires thermiques »). Pour les logements E, cette obligation entrera en vigueur en 2025. Les copropriétés de plus de 200 lots ont également l'obligation de réaliser un audit énergétique. En dehors de ces cas, l'audit reste volontaire mais fortement recommandé avant tout projet de rénovation d'ampleur.",
  },
  {
    question: "Combien coûte un audit énergétique ?",
    answer:
      "Le coût d'un audit énergétique dépend de la taille et de la complexité du bâtiment. Pour une maison individuelle, comptez entre 800 € et 1 500 € HT. Pour une copropriété ou un bâtiment tertiaire, le tarif varie de 2 000 € à plus de 10 000 € HT selon le nombre de lots et la surface. À noter : l'audit est éligible à MaPrimeRénov' à hauteur de 500 €, ce qui réduit significativement le reste à charge pour les propriétaires occupants.",
  },
  {
    question: "Combien de temps dure un audit énergétique ?",
    answer:
      "La visite technique sur site dure généralement 2 à 4 heures pour une maison individuelle, et une journée complète ou plus pour un immeuble collectif ou un bâtiment tertiaire de grande surface. La phase d'analyse, de modélisation thermique et de rédaction du rapport prend ensuite 2 à 4 semaines. La restitution avec le client se fait lors d'un rendez-vous dédié d'environ 1 heure, pendant lequel nous présentons les résultats et répondons à toutes vos questions.",
  },
  {
    question: "L'audit est-il éligible aux aides ?",
    answer:
      "Oui. L'audit énergétique est éligible à MaPrimeRénov' : la subvention peut atteindre 500 € pour les propriétaires occupants, sous conditions de ressources. Par ailleurs, l'audit est souvent un prérequis indispensable pour accéder aux aides à la rénovation d'ampleur via MaPrimeRénov' Parcours accompagné et aux certificats d'économies d'énergie (CEE). Réaliser un audit vous ouvre donc la voie à des financements bien plus importants pour les travaux qui suivront.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#DBEAFE] last:border-b-0">
      <button
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="font-display text-[1.05rem] font-semibold text-[#0D1B35]">
          {question}
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[#2563EB] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <p className="pb-5 text-[0.95rem] leading-relaxed text-[#4A6285]">
          {answer}
        </p>
      )}
    </div>
  );
}

export default function AuditEnergetiquePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#FAF8F5] pb-20 pt-28">
        <div className="absolute inset-0 -z-10">
          <Image
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80"
            alt="Bâtiment résidentiel — audit énergétique"
            fill
            className="object-cover opacity-[0.06]"
            priority
          />
        </div>
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.p
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mb-4 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]"
              >
                Diagnostic
              </motion.p>
              <motion.h1
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="font-display mb-6 text-4xl font-bold leading-tight text-[#0D1B35] md:text-5xl lg:text-[3.25rem]"
              >
                Audit énergétique : diagnostic et bilan thermique
              </motion.h1>
              <motion.p
                custom={2}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="mb-8 max-w-prose text-[1.05rem] leading-relaxed text-[#4A6285]"
              >
                Un audit énergétique révèle avec précision les points faibles thermiques de votre bâtiment — déperditions par les murs, toiture, planchers et menuiseries, inefficacité des systèmes de chauffage ou de ventilation, manque d'étanchéité à l'air. Il traduit ces données en préconisations de travaux chiffrées, hiérarchisées et compatibles avec les aides financières disponibles.
              </motion.p>
              <motion.div
                custom={3}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
              >
                <Link
                  href="/contactez-nous"
                  className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-7 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Demander un audit <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="relative hidden lg:block"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80"
                  alt="Thermographie infrarouge d'un bâtiment"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-5 -left-5 rounded-xl border border-[#DBEAFE] bg-white px-5 py-4 shadow-lg">
                <p className="text-[0.72rem] uppercase tracking-[0.2em] text-[#2563EB]">
                  Bureau d'étude RGE
                </p>
                <p className="font-display mt-1 text-xl font-bold text-[#0D1B35]">
                  Kilowater
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── QU'EST-CE QU'UN AUDIT ? ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p className="mb-3 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]">
                Définition
              </p>
              <h2 className="font-display mb-5 text-3xl font-bold text-[#0D1B35] md:text-4xl">
                Qu'est-ce qu'un audit énergétique ?
              </h2>
              <div className="space-y-4 text-[0.97rem] leading-relaxed text-[#4A6285]">
                <p>
                  L'audit énergétique est une évaluation globale et détaillée de la performance thermique d'un bâtiment. Bien au-delà du simple DPE (Diagnostic de Performance Énergétique), il analyse en profondeur l'enveloppe du bâti — murs, toiture, planchers bas, menuiseries — les systèmes techniques (chauffage, eau chaude sanitaire, ventilation) et les usages réels des occupants. Il quantifie les déperditions thermiques poste par poste et identifie les leviers d'amélioration les plus efficaces.
                </p>
                <p>
                  Le résultat est un rapport structuré présentant plusieurs scénarios de travaux de rénovation énergétique, classés par ordre de priorité, avec pour chacun les économies d'énergie attendues, les gains sur le classement DPE, l'impact sur les émissions de CO₂ et le montant des aides financières mobilisables.
                </p>
                <p>
                  On distingue deux grandes catégories d'audit. L'<strong className="text-[#0D1B35]">audit réglementaire</strong> est obligatoire depuis 2023 pour la vente de logements classés F ou G. Il suit un cadre normatif strict défini par arrêté. L'<strong className="text-[#0D1B35]">audit incitatif</strong>, lui, est réalisé à l'initiative du propriétaire ou du maître d'ouvrage : plus complet, il intègre souvent une simulation thermique dynamique et des mesures in situ (test d'étanchéité, thermographie) pour une précision encore plus grande des préconisations.
                </p>
              </div>
            </motion.div>
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=800&q=80"
                alt="Ingénieur réalisant un audit énergétique sur site industriel"
                fill
                className="object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── CE QUE COMPREND NOTRE AUDIT ── */}
      <section className="bg-[#F5FAFF] py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="mb-3 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]">
              Méthodologie
            </p>
            <h2 className="font-display mb-4 text-3xl font-bold text-[#0D1B35] md:text-4xl">
              Ce que comprend notre audit
            </h2>
            <p className="mx-auto max-w-2xl text-[0.97rem] leading-relaxed text-[#4A6285]">
              Notre démarche d'audit combine relevés terrain, mesures instrumentées et modélisation numérique pour produire un diagnostic fiable et des préconisations actionnables.
            </p>
          </motion.div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Home className="h-6 w-6 text-[#2563EB]" />,
                title: "Analyse de l'enveloppe",
                desc: "Étude complète des murs, toiture, plancher bas et menuiseries. Calcul des coefficients de déperdition (U) et identification des ponts thermiques.",
              },
              {
                icon: <Zap className="h-6 w-6 text-[#2563EB]" />,
                title: "Étude des systèmes",
                desc: "Évaluation des installations de chauffage, production d'eau chaude sanitaire (ECS) et systèmes de ventilation. Analyse des rendements réels.",
              },
              {
                icon: <Thermometer className="h-6 w-6 text-[#2563EB]" />,
                title: "Thermographie infrarouge",
                desc: "Cartographie des zones de déperdition et des ponts thermiques par caméra thermique, réalisée en période de chauffe pour une précision maximale.",
              },
              {
                icon: <Wind className="h-6 w-6 text-[#2563EB]" />,
                title: "Test d'étanchéité à l'air",
                desc: "Mesure du débit de fuite (blower door test) selon la norme EN 13829. Résultat exprimé en valeur n50 ou Q4Pa-surf, utilisé dans les simulations.",
              },
              {
                icon: <BarChart3 className="h-6 w-6 text-[#2563EB]" />,
                title: "Simulation thermique dynamique",
                desc: "Modélisation heure par heure des échanges thermiques du bâtiment pour simuler précisément les consommations futures après travaux.",
              },
              {
                icon: <FileText className="h-6 w-6 text-[#2563EB]" />,
                title: "Préconisations chiffrées",
                desc: "Scénarios de travaux hiérarchisés avec économies d'énergie attendues, coûts estimatifs, gains DPE et aides financières mobilisables.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="rounded-2xl border border-[#DBEAFE] bg-white p-7 shadow-sm"
              >
                <div className="mb-4 inline-flex rounded-xl bg-[#EFF6FF] p-3">
                  {item.icon}
                </div>
                <h3 className="font-display mb-2 text-lg font-semibold text-[#0D1B35]">
                  {item.title}
                </h3>
                <p className="text-[0.9rem] leading-relaxed text-[#4A6285]">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POUR QUI ? ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="mb-3 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]">
              Public concerné
            </p>
            <h2 className="font-display mb-4 text-3xl font-bold text-[#0D1B35] md:text-4xl">
              Pour qui ?
            </h2>
          </motion.div>
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: <Factory className="h-8 w-8 text-[#2563EB]" />,
                title: "Sites industriels",
                points: [
                  "Obligation de réaliser un audit tous les 4 ans pour les grandes entreprises (directive EED)",
                  "Identification des process énergivores et des gisements d'économies",
                  "Valorisation via les fiches CEE industrie (IND-UT, IND-BA)",
                  "Conformité aux exigences ISO 50001 et décret BACS",
                ],
              },
              {
                icon: <Building2 className="h-8 w-8 text-[#2563EB]" />,
                title: "Copropriétés",
                points: [
                  "Obligatoire pour les copropriétés de plus de 200 lots (depuis 2012)",
                  "Obligation progressive pour les copropriétés de 50 à 200 lots",
                  "Base indispensable pour un plan pluriannuel de travaux (PPT)",
                  "Levier pour mobiliser les copropriétaires autour d'un projet collectif",
                ],
              },
              {
                icon: <Landmark className="h-8 w-8 text-[#2563EB]" />,
                title: "Bâtiments tertiaires",
                points: [
                  "Obligation de réduction des consommations (décret tertiaire BBCA)",
                  "Identification des gisements d'économies d'énergie les plus rentables",
                  "Optimisation des contrats d'énergie et de maintenance",
                  "Valorisation du patrimoine immobilier par l'amélioration du DPE",
                ],
              },
            ].map((col, i) => (
              <motion.div
                key={col.title}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="rounded-2xl border border-[#DBEAFE] bg-[#F5FAFF] p-8"
              >
                <div className="mb-5 inline-flex rounded-xl bg-white p-4 shadow-sm">
                  {col.icon}
                </div>
                <h3 className="font-display mb-4 text-xl font-bold text-[#0D1B35]">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-[0.9rem] text-[#4A6285]">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LES ÉTAPES ── */}
      <section className="bg-[#FAF8F5] py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="mb-3 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]">
              Déroulement
            </p>
            <h2 className="font-display mb-4 text-3xl font-bold text-[#0D1B35] md:text-4xl">
              Les étapes de l'audit
            </h2>
            <p className="mx-auto max-w-xl text-[0.97rem] leading-relaxed text-[#4A6285]">
              De la visite terrain à la restitution, notre processus est rigoureux, transparent et entièrement orienté vers l'action.
            </p>
          </motion.div>
          <div className="relative">
            <div className="absolute left-[1.8rem] top-0 hidden h-full w-px bg-[#BFDBFE] md:block" />
            <div className="space-y-8">
              {[
                {
                  num: "01",
                  icon: <ClipboardList className="h-5 w-5 text-[#2563EB]" />,
                  title: "Visite technique",
                  desc: "Relevé sur site de toutes les caractéristiques du bâtiment : composition des parois, type de menuiseries, état des installations de chauffage et ventilation, mesure de la surface et des volumes. Échange avec les occupants sur les usages et les inconforts ressentis.",
                },
                {
                  num: "02",
                  icon: <FileSearch className="h-5 w-5 text-[#2563EB]" />,
                  title: "Collecte et analyse",
                  desc: "Recueil des factures d'énergie et des données de consommation sur 3 ans. Analyse des données météorologiques locales. Calcul des déperditions thermiques par poste (murs, toit, plancher, ponts thermiques, renouvellement d'air).",
                },
                {
                  num: "03",
                  icon: <Microscope className="h-5 w-5 text-[#2563EB]" />,
                  title: "Modélisation",
                  desc: "Saisie du bâtiment dans un logiciel de simulation thermique. Calibration du modèle sur les consommations réelles constatées. Identification précise des déperditions et des gisements d'économies.",
                },
                {
                  num: "04",
                  icon: <BarChart3 className="h-5 w-5 text-[#2563EB]" />,
                  title: "Scénarios de travaux",
                  desc: "Élaboration de 2 à 4 scénarios de rénovation énergétique, du moins coûteux au plus ambitieux (visant le label BBC Rénovation). Pour chaque scénario : économies d'énergie, gain DPE, coûts estimatifs, aides disponibles et temps de retour sur investissement.",
                },
                {
                  num: "05",
                  icon: <FileText className="h-5 w-5 text-[#2563EB]" />,
                  title: "Rapport et restitution",
                  desc: "Remise d'un rapport complet et lisible, accompagné d'une synthèse vulgarisée. Rendez-vous de restitution pour présenter les résultats, répondre à vos questions et vous orienter vers les étapes suivantes du projet.",
                },
              ].map((step, i) => (
                <motion.div
                  key={step.num}
                  custom={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="relative flex gap-6"
                >
                  <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[#BFDBFE] bg-white shadow-sm">
                    {step.icon}
                  </div>
                  <div className="rounded-2xl border border-[#DBEAFE] bg-white p-6 flex-1 shadow-sm">
                    <p className="mb-1 text-[0.72rem] uppercase tracking-[0.2em] text-[#2563EB]">
                      Étape {step.num}
                    </p>
                    <h3 className="font-display mb-2 text-lg font-semibold text-[#0D1B35]">
                      {step.title}
                    </h3>
                    <p className="text-[0.9rem] leading-relaxed text-[#4A6285]">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AUDIT ET AIDES ── */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              custom={1}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"
                alt="Aides financières pour la rénovation énergétique"
                fill
                className="object-cover"
              />
            </motion.div>
            <motion.div
              custom={0}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <p className="mb-3 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]">
                Financement
              </p>
              <h2 className="font-display mb-5 text-3xl font-bold text-[#0D1B35] md:text-4xl">
                Audit et aides financières
              </h2>
              <div className="space-y-4 text-[0.97rem] leading-relaxed text-[#4A6285]">
                <p>
                  L'audit énergétique n'est pas une dépense isolée : il est le point de départ indispensable pour accéder aux aides à la rénovation d'ampleur. Dans le cadre de MaPrimeRénov' Parcours accompagné — le dispositif le plus généreux, avec des subventions pouvant atteindre 70 % du montant des travaux — la réalisation d'un audit énergétique par un professionnel qualifié est obligatoire.
                </p>
                <p>
                  L'audit lui-même est éligible à MaPrimeRénov' : les propriétaires occupants peuvent bénéficier d'une aide pouvant aller jusqu'à <strong className="text-[#0D1B35]">500 €</strong>, réduisant significativement le reste à charge. Pour les copropriétés, des aides spécifiques via l'ANAH existent également.
                </p>
                <p>
                  Les certificats d'économies d'énergie (CEE) constituent un autre levier majeur. L'audit permet d'identifier précisément les travaux éligibles aux CEE et de maximiser les primes obtenues auprès des obligés. Kilowater vous accompagne dans toute la démarche, de l'audit jusqu'au dépôt des dossiers d'aides.
                </p>
              </div>
              <div className="mt-7 flex items-center gap-3">
                <Euro className="h-5 w-5 text-[#2563EB]" />
                <Link
                  href="/accompagnement-cee"
                  className="text-sm font-semibold text-[#2563EB] underline underline-offset-4 hover:text-[#1d4ed8]"
                >
                  En savoir plus sur l'accompagnement CEE & MaPrimeRénov' →
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-[#F5FAFF] py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <p className="mb-3 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]">
              Foire aux questions
            </p>
            <h2 className="font-display mb-4 text-3xl font-bold text-[#0D1B35] md:text-4xl">
              Questions fréquentes
            </h2>
          </motion.div>
          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto max-w-3xl rounded-2xl border border-[#DBEAFE] bg-white px-8 py-2 shadow-sm"
          >
            {faqData.map((item) => (
              <FaqItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-[#0D1B35] py-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 text-center">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="mb-3 text-[0.72rem] uppercase tracking-[0.25em] text-[#93C5FD]">
              Passer à l'action
            </p>
            <h2 className="font-display mb-5 text-3xl font-bold text-white md:text-4xl">
              Faites réaliser votre audit énergétique
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-[0.97rem] leading-relaxed text-[#93C5FD]">
              Kilowater, bureau d'étude RGE spécialisé en rénovation énergétique, réalise des audits pour les maisons individuelles, copropriétés et bâtiments tertiaires. Contactez-nous pour un premier échange gratuit.
            </p>
            <Link
              href="/contactez-nous"
              className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-8 py-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Demander un audit gratuit <ChevronRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
