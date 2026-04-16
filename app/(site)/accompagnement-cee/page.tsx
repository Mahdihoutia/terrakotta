"use client";
/* eslint-disable react/no-unescaped-entities */

import { motion } from "framer-motion";
import Link from "next/link";
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

/* ─────────────────────────────────────────
   Data
───────────────────────────────────────── */
interface Fiche {
  code: string;
  name: string;
  description: string;
}

const fichesResidentiel: Fiche[] = [
  {
    code: "BAR-TH-171",
    name: "Pompe à chaleur air/eau",
    description: "Installation d'une PAC air/eau pour le chauffage résidentiel individuel.",
  },
  {
    code: "BAR-TH-159",
    name: "PAC collectif",
    description: "Pompe à chaleur collective pour immeubles ou copropriétés.",
  },
  {
    code: "BAR-EN-101",
    name: "Isolation des combles",
    description: "Isolation thermique des combles perdus ou aménagés par soufflage ou projection.",
  },
  {
    code: "BAR-EN-102",
    name: "Isolation des murs",
    description: "Isolation thermique des murs par l'intérieur ou par l'extérieur (ITE).",
  },
  {
    code: "BAR-EN-103",
    name: "Isolation du plancher bas",
    description: "Isolation thermique du plancher bas sur sous-sol, cave ou vide sanitaire.",
  },
];

const fichesTermiaire: Fiche[] = [
  {
    code: "BAT-TH-116",
    name: "Système de régulation",
    description: "Mise en place d'un système de régulation performant sur installation de chauffage.",
  },
  {
    code: "BAT-TH-134",
    name: "Ventilateur à variation de vitesse",
    description: "Remplacement de moteurs de ventilateurs par des moteurs à haute efficacité avec VEV.",
  },
  {
    code: "BAT-TH-139",
    name: "Récupération chaleur sur froid",
    description: "Récupération de chaleur sur les condenseurs de groupes froid pour la production d'eau chaude.",
  },
  {
    code: "BAT-TH-142",
    name: "Déstratificateur de chaleur",
    description: "Installation de déstratificateurs dans les locaux à grande hauteur sous plafond.",
  },
  {
    code: "BAT-TH-163",
    name: "PAC tertiaire",
    description: "Pompe à chaleur pour le chauffage ou la climatisation de locaux tertiaires.",
  },
];

const fichesIndustrie: Fiche[] = [
  {
    code: "IND-UT-102",
    name: "Système de variation de vitesse",
    description: "Installation d'un variateur électronique de vitesse sur un moteur asynchrone existant.",
  },
  {
    code: "IND-UT-104",
    name: "Compresseur d'air à vitesse variable",
    description: "Remplacement d'un compresseur d'air à vitesse fixe par un compresseur à vitesse variable.",
  },
  {
    code: "IND-UT-116",
    name: "Système de récupération de chaleur",
    description: "Récupération de chaleur fatale sur un process industriel pour le chauffage ou le préchauffage.",
  },
  {
    code: "IND-UT-117",
    name: "Brûleur micro-modulant",
    description: "Remplacement d'un brûleur de chaudière industrielle par un brûleur micro-modulant haut rendement.",
  },
  {
    code: "IND-BA-112",
    name: "Isolation des réseaux hydrauliques",
    description: "Mise en place d'une isolation sur les réseaux hydrauliques de chauffage ou de froid industriel.",
  },
];

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Audit de votre situation et éligibilité",
    description:
      "Nous analysons votre situation : type de bâtiment, travaux envisagés, statut (propriétaire occupant, bailleur, entreprise) et vérifions votre éligibilité aux différentes fiches CEE applicables.",
  },
  {
    number: "02",
    icon: FileText,
    title: "Identification des fiches CEE applicables",
    description:
      "Parmi les centaines de fiches standardisées du catalogue CEE, nous sélectionnons celles qui correspondent précisément à vos travaux et maximisent le volume de kWh cumac valorisables.",
  },
  {
    number: "03",
    icon: Calculator,
    title: "Calcul des volumes kWh cumac",
    description:
      "Nous appliquons les formules réglementaires de chaque fiche pour calculer précisément le volume de kWh cumac générés. Ce calcul tient compte des facteurs spécifiques à votre projet : zone climatique, surface, puissance, etc.",
  },
  {
    number: "04",
    icon: Handshake,
    title: "Montage du dossier et relation avec l'obligé",
    description:
      "Nous constituons le dossier administratif complet et assurons la relation avec l'obligé (fournisseur d'énergie ou délégataire). Nous vérifions la conformité des pièces justificatives et facilitons la validation du dossier.",
  },
  {
    number: "05",
    icon: BadgeCheck,
    title: "Suivi jusqu'au versement de la prime",
    description:
      "Nous assurons le suivi de votre dossier jusqu'au versement effectif de la prime CEE, en répondant aux éventuelles demandes de compléments et en vous tenant informé à chaque étape.",
  },
];

const faqs = [
  {
    question: "Qui peut bénéficier des CEE ?",
    answer:
      "Les certificats d'économies d'énergie sont accessibles à toute personne physique ou morale réalisant des travaux d'économies d'énergie : particuliers propriétaires occupants ou bailleurs, syndicats de copropriétés, entreprises du secteur tertiaire, industriels, agriculteurs et collectivités. La condition principale est que les travaux réalisés correspondent à une fiche d'opération standardisée du catalogue officiel.",
  },
  {
    question: "Quels travaux sont éligibles aux CEE ?",
    answer:
      "Sont éligibles les travaux figurant dans le catalogue des fiches d'opérations standardisées : isolation thermique (combles, murs, planchers), remplacement de systèmes de chauffage (chaudières, pompes à chaleur), optimisation de la ventilation et du refroidissement, éclairage performant, régulation et automatisation des bâtiments, ou encore récupération d'énergie. Le catalogue est régulièrement mis à jour et compte aujourd'hui plus de 200 fiches réparties entre les secteurs résidentiel, tertiaire, industriel, agricole et transport.",
  },
  {
    question: "Comment sont calculés les kWh cumac ?",
    answer:
      "Le kWh cumac (cumulé et actualisé) est l'unité de mesure des certificats d'économies d'énergie. Il représente l'énergie économisée sur la durée de vie de l'équipement installé, actualisée à un taux de 4 % par an. Pour chaque fiche, une formule de calcul précise intègre plusieurs paramètres : la surface ou la puissance de l'équipement, la zone climatique du bâtiment, un coefficient de précarité énergétique le cas échéant, et la durée de vie conventionnelle de l'opération. Ces formules sont fixées par arrêté et s'appliquent de façon identique pour tous les acteurs.",
  },
  {
    question: "Peut-on cumuler CEE et MaPrimeRénov' ?",
    answer:
      "Oui, dans la grande majorité des cas, les CEE sont cumulables avec MaPrimeRénov'. Ces deux dispositifs sont distincts : MaPrimeRénov' est une subvention de l'État versée par l'ANAH, tandis que les CEE sont des primes versées par les fournisseurs d'énergie (les obligés) en contrepartie des économies d'énergie générées. Le cumul est toutefois soumis à certaines conditions et plafonds selon les travaux concernés. Nous vous accompagnons pour optimiser l'articulation entre ces différentes aides.",
  },
  {
    question: "Quel est le délai pour obtenir la prime CEE ?",
    answer:
      "La durée de traitement d'un dossier CEE varie selon l'obligé ou le délégataire et la complexité du dossier. En pratique, il faut compter entre 1 et 4 mois après la réception du dossier complet pour obtenir le versement de la prime. Pour les opérations spécifiques (hors catalogue) ou les dossiers volumineux dans le secteur industriel, les délais peuvent être plus longs. L'engagement de l'obligé doit intervenir avant le début des travaux, ce qui impose d'anticiper le montage du dossier.",
  },
  {
    question: "Qu'est-ce que la 6ᵉ période CEE (P6) ?",
    answer:
      "La 6ᵉ période des certificats d'économies d'énergie (P6) court du 1ᵉʳ janvier 2026 au 31 décembre 2030. L'objectif national fixé par les pouvoirs publics est de 5 250 TWh cumac d'économies d'énergie à réaliser sur cette période, ce qui représente une hausse significative par rapport aux périodes précédentes. Cette ambition accrue se traduit par de nouvelles fiches d'opérations, des évolutions des formules de calcul existantes et une vigilance renforcée sur la qualité des dossiers. Kilowater suit en permanence ces évolutions réglementaires pour vous garantir des dossiers conformes et optimisés.",
  },
];

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

/* ─────────────────────────────────────────
   JSON-LD Schema
───────────────────────────────────────── */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

/* ─────────────────────────────────────────
   Page
───────────────────────────────────────── */
export default function AccompagnementCEEPage() {
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
              Aides financières
            </motion.p>

            <motion.h1
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-display mb-6 text-4xl font-bold leading-tight text-[#0D1B35] md:text-5xl lg:text-[3.25rem]"
            >
              Accompagnement CEE&nbsp;: dossiers et fiches d'opérations
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="mb-8 text-lg leading-relaxed text-[#4A6285]"
            >
              Les certificats d'économies d'énergie (CEE) constituent l'un des principaux leviers
              de financement de la rénovation énergétique en France. Pourtant, la complexité des
              fiches standardisées, le calcul des kWh cumac et les exigences administratives des
              obligés découragent souvent les maîtres d'ouvrage. Kilowater prend en charge
              l'intégralité du parcours : de l'identification des fiches applicables jusqu'au
              versement de la prime énergie, en passant par le calcul précis des volumes et le
              montage du dossier.
            </motion.p>

            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
              <Link
                href="/contactez-nous"
                className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-7 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#1d4ed8] hover:shadow-lg hover:shadow-blue-200"
              >
                Évaluer mon potentiel CEE
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
              Le dispositif
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
            Qu'est-ce que les certificats d'économies d'énergie&nbsp;?
          </motion.h2>

          <div className="grid gap-8 lg:grid-cols-2">
            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-5 text-[0.95rem] leading-relaxed text-[#4A6285]"
            >
              <p>
                Le dispositif des certificats d'économies d'énergie, instauré par la loi POPE de
                2005, oblige les grandes entreprises de l'énergie — appelées les{" "}
                <strong className="font-semibold text-[#0D1B35]">obligés</strong> (EDF, Engie,
                Total Énergies, TotalEnergies Marketing France…) — à promouvoir activement
                l'efficacité énergétique auprès de leurs clients. Pour satisfaire leurs
                obligations, ces acteurs financent des travaux d'économies d'énergie réalisés par
                des tiers, en échange de quoi ils reçoivent des certificats attestant des
                économies générées.
              </p>
              <p>
                Chaque certificat représente 1&nbsp;kWh&nbsp;cumac — c'est-à-dire 1 kilowattheure
                d'énergie finale économisé, <strong className="font-semibold text-[#0D1B35]">cumulé sur la durée de vie
                de l'équipement</strong> et actualisé à un taux de 4&nbsp;% par an. Concrètement, une
                isolation de combles génère plusieurs dizaines de milliers de kWh cumac, et
                chaque MWh cumac se négocie entre 5 et 10&nbsp;€ selon les conditions de marché.
              </p>
            </motion.div>

            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="space-y-5 text-[0.95rem] leading-relaxed text-[#4A6285]"
            >
              <p>
                Pour structurer ce système, le ministère chargé de l'énergie publie un catalogue
                de <strong className="font-semibold text-[#0D1B35]">fiches d'opérations standardisées</strong>, classées
                par secteur (résidentiel, tertiaire, industriel, agricole, transport, réseaux) et
                par type de travaux. Chaque fiche définit les conditions d'éligibilité, les
                critères techniques à respecter et la formule de calcul des kWh cumac générés.
              </p>
              <p>
                Nous sommes actuellement dans la{" "}
                <strong className="font-semibold text-[#0D1B35]">
                  6ᵉ période CEE (P6), qui court de 2026 à 2030
                </strong>
                . L'objectif national fixé pour cette période est de{" "}
                <strong className="font-semibold text-[#0D1B35]">5&nbsp;250&nbsp;TWh&nbsp;cumac</strong>, un
                niveau d'ambition inédit qui témoigne de la montée en puissance du dispositif.
                Cette période introduit de nouvelles fiches et révise certains calculs, rendant
                l'accompagnement par un bureau d'étude CEE plus que jamais nécessaire pour
                sécuriser vos dossiers.
              </p>
            </motion.div>
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
              Catalogue opérations
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
            Fiches CEE courantes
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-12 max-w-2xl text-[0.95rem] leading-relaxed text-[#4A6285]"
          >
            Kilowater maîtrise l'ensemble des fiches standardisées du catalogue. Voici les
            opérations les plus fréquemment valorisées dans les secteurs résidentiel et tertiaire.
          </motion.p>

          {/* Résidentiel */}
          <div className="mb-12">
            <motion.div
              custom={3}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-5 flex items-center gap-2"
            >
              <Home size={16} className="text-[#2563EB]" />
              <h3 className="font-display text-lg font-semibold text-[#0D1B35]">
                Secteur résidentiel — Fiches BAR-TH / BAR-EN
              </h3>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {fichesResidentiel.map((fiche, i) => (
                <motion.div
                  key={fiche.code}
                  custom={4 + i}
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

          {/* Tertiaire */}
          <div>
            <motion.div
              custom={9}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-5 flex items-center gap-2"
            >
              <Building2 size={16} className="text-[#2563EB]" />
              <h3 className="font-display text-lg font-semibold text-[#0D1B35]">
                Secteur tertiaire — Fiches BAT-TH
              </h3>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {fichesTermiaire.map((fiche, i) => (
                <motion.div
                  key={fiche.code}
                  custom={10 + i}
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

          {/* Industrie */}
          <div className="mt-12">
            <motion.div
              custom={15}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="mb-5 flex items-center gap-2"
            >
              <Factory size={16} className="text-[#2563EB]" />
              <h3 className="font-display text-lg font-semibold text-[#0D1B35]">
                Secteur industriel — Fiches IND-UT / IND-BA
              </h3>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {fichesIndustrie.map((fiche, i) => (
                <motion.div
                  key={fiche.code}
                  custom={16 + i}
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
              Méthode
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
            Notre accompagnement
          </motion.h2>
          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-14 max-w-2xl text-[0.95rem] leading-relaxed text-[#4A6285]"
          >
            Un accompagnement CEE réussi repose sur la rigueur à chaque étape. Notre bureau
            d'étude prend en charge l'intégralité du processus, de l'évaluation initiale à la
            réception de la prime énergie.
          </motion.p>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  custom={3 + i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  className="relative flex flex-col gap-4 rounded-2xl border border-[#DBEAFE] bg-[#F5FAFF] p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[2rem] font-bold leading-none text-[#BFDBFE]">
                      {step.number}
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
                  FAQ
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
                Questions fréquentes
              </motion.h2>
              <motion.p
                custom={2}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="mt-4 text-[0.9rem] leading-relaxed text-[#4A6285]"
              >
                Tout ce que vous devez savoir sur les certificats d'économies d'énergie avant de
                lancer votre dossier.
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
              {faqs.map((faq) => (
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
              Passez à l'action
            </p>
            <h2 className="font-display mb-5 text-3xl font-bold text-[#0D1B35] md:text-4xl">
              Évaluons ensemble votre potentiel CEE
            </h2>
            <p className="mb-8 text-[0.95rem] leading-relaxed text-[#4A6285]">
              Vous avez un projet de rénovation énergétique et souhaitez savoir quelles fiches CEE
              sont applicables, quel volume de kWh cumac vous pouvez valoriser et quelle prime
              énergie vous pouvez espérer obtenir&nbsp;? Contactez Kilowater pour un premier
              échange gratuit.
            </p>
            <Link
              href="/contactez-nous"
              className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-[#1d4ed8] hover:shadow-lg hover:shadow-blue-200"
            >
              Discutons de votre projet
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
