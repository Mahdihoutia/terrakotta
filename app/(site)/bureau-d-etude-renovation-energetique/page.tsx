"use client";
/* eslint-disable react/no-unescaped-entities */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Lightbulb,
  Scale,
  BadgeEuro,
  Home,
  Building2,
  Factory,
  Search,
  Pencil,
  HardHat,
  CheckCircle2,
  Award,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

// ─── FAQ data ───────────────────────────────────────────────────────────────

const faqs = [
  {
    question: "Qu'est-ce qu'un bureau d'étude en rénovation énergétique ?",
    answer:
      "Un bureau d'étude en rénovation énergétique est une structure de conseil technique indépendante spécialisée dans l'amélioration de la performance thermique des bâtiments. Il réalise des audits énergétiques, conçoit les solutions de rénovation les plus adaptées, rédige les cahiers des charges techniques et assure le suivi des travaux. Contrairement à un artisan ou à un installateur, le bureau d'étude ne vend pas de matériaux ni de main-d'œuvre : il défend exclusivement les intérêts du maître d'ouvrage et garantit la cohérence du projet de A à Z.",
  },
  {
    question:
      "Pourquoi faire appel à un bureau d'étude plutôt qu'à un artisan ?",
    answer:
      "L'artisan excelle dans l'exécution de son corps de métier, mais une rénovation énergétique performante implique plusieurs lots interdépendants (isolation, ventilation, chauffage, étanchéité à l'air). Un bureau d'étude thermique coordonne ces interventions, vérifie leur compatibilité technique, optimise les dimensionnements et contrôle la qualité à chaque étape. Cette approche globale évite les ponts thermiques, les sous-dimensionnements et les incompatibilités qui réduiraient l'efficacité des travaux. Elle est également requise pour accéder à certaines aides comme le Coup de Pouce CEE ou les subventions ANAH pour les projets complexes.",
  },
  {
    question: "Combien coûte un audit énergétique ?",
    answer:
      "Le coût d'un audit énergétique varie selon la surface du bâtiment, sa complexité technique et la profondeur de l'analyse souhaitée. Pour un bâtiment tertiaire (bureaux, commerces, ERP), le tarif se situe généralement entre 2 000 € et 10 000 € HT selon la surface et le nombre de systèmes à analyser. Pour un site industriel, le périmètre intègre l'audit des process et des utilités, ce qui peut porter le coût au-delà de 15 000 € HT pour les installations complexes. Ces audits sont en grande partie finançables par les certificats d'économies d'énergie (CEE) et par les dispositifs d'aide à la décarbonation de l'industrie.",
  },
  {
    question: "Quelles sont les aides financières disponibles ?",
    answer:
      "Plusieurs dispositifs coexistent : MaPrimeRénov' (subvention ANAH pour les particuliers, modulée selon les revenus et les gains énergétiques), les Certificats d'Économies d'Énergie (CEE, financés par les fournisseurs d'énergie), l'éco-prêt à taux zéro (éco-PTZ, jusqu'à 50 000 €), la TVA réduite à 5,5 % sur les travaux de rénovation énergétique, et les aides locales des collectivités. Un bureau d'étude indépendant vous aide à identifier les cumuls possibles, à constituer les dossiers et à respecter les conditions d'éligibilité — notamment l'obligation de faire appel à des artisans RGE.",
  },
  {
    question: "Qu'est-ce que la qualification RGE ?",
    answer:
      "RGE signifie Reconnu Garant de l'Environnement. Il s'agit d'une qualification attribuée aux professionnels du bâtiment (artisans et bureaux d'études) qui ont suivi une formation spécifique et répondent à des critères de qualité reconnus par l'État. Elle est délivrée par des organismes accrédités tels que Qualibat, Qualifelec ou OPQIBI. Faire appel à un bureau d'étude qualifié RGE est une condition sine qua non pour que vos travaux soient éligibles à MaPrimeRénov', aux CEE et à l'éco-PTZ.",
  },
  {
    question:
      "Le bureau d'étude intervient-il uniquement avant les travaux ?",
    answer:
      "Non. L'intervention d'un bureau d'étude en rénovation énergétique s'étend sur l'ensemble du cycle de vie du projet. En phase amont, il réalise le diagnostic et conçoit les solutions. En phase d'appel d'offres, il rédige les cahiers des charges et analyse les devis des entreprises. En phase chantier, il assure le suivi de l'exécution, contrôle la mise en œuvre des isolants, vérifie les raccordements et valide les tests d'étanchéité à l'air (test BlowerDoor). Enfin, lors de la réception, il dresse le bilan des performances atteintes et accompagne la levée des réserves.",
  },
];

// ─── JSON-LD schema ──────────────────────────────────────────────────────────

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

// ─── Sub-components ──────────────────────────────────────────────────────────

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#DBEAFE] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-[#0D1B35] font-medium leading-snug">
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
        <p className="text-[#4A6285] leading-relaxed text-[0.95rem]">
          {answer}
        </p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BureauDEtudePage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <main className="bg-[#FAF8F5]">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-[#0D1B35] py-24 md:py-32">
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80"
              alt="Chantier de rénovation énergétique d'un immeuble résidentiel"
              fill
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
                Bureau d'étude
              </motion.p>

              <motion.h1
                variants={fadeUp}
                className="font-display text-4xl font-semibold leading-tight text-white md:text-5xl lg:text-6xl"
              >
                Bureau d'étude en<br />
                rénovation énergétique
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-2xl text-[1.05rem] leading-relaxed text-[#CBD5E1]"
              >
                Kilowater est un bureau d'étude indépendant spécialisé dans la
                rénovation énergétique des bâtiments résidentiels, tertiaires et
                publics. Notre rôle : analyser, concevoir et piloter les projets
                de rénovation les plus ambitieux — de l'audit énergétique
                initial jusqu'à la réception des travaux — pour vous garantir
                des performances réelles, des aides maximisées et une
                indépendance totale vis-à-vis des entreprises.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/contactez-nous"
                  className="inline-flex items-center gap-2 rounded-full bg-[#2563EB] px-7 py-3.5 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
                >
                  Demander un devis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/nos-prestations"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-medium text-white transition-colors hover:border-white/60"
                >
                  Nos prestations
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Pourquoi un bureau d'étude ? ── */}
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
                Notre valeur ajoutée
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="font-display text-3xl font-semibold text-[#0D1B35] md:text-4xl"
              >
                Pourquoi faire appel à un bureau d'étude ?
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-4 max-w-2xl text-[#4A6285] leading-relaxed"
              >
                Une rénovation énergétique réussie ne s'improvise pas. Elle
                nécessite une approche globale, rigoureuse et indépendante que
                seul un bureau d'étude thermique est en mesure de garantir.
              </motion.p>

              <motion.div
                variants={staggerContainer}
                className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
              >
                {[
                  {
                    icon: Lightbulb,
                    title: "Expertise technique",
                    body: "Nos ingénieurs maîtrisent la thermique du bâtiment, la physique du bâti et les réglementations en vigueur (RE2020, BBC Rénovation). Nous dimensionnons les solutions avec précision pour garantir les gains énergétiques annoncés.",
                  },
                  {
                    icon: Scale,
                    title: "Indépendance & neutralité",
                    body: "En tant que bureau d'étude indépendant, nous n'avons aucun lien commercial avec les fournisseurs ou les entreprises de travaux. Nos recommandations sont fondées sur l'intérêt technique et économique du maître d'ouvrage, exclusivement.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Conformité réglementaire",
                    body: "Nous assurons la conformité de vos projets aux exigences réglementaires : DPE, audit énergétique obligatoire, BBC Rénovation, normes acoustiques et sécurité incendie. Zéro mauvaise surprise lors des contrôles.",
                  },
                  {
                    icon: BadgeEuro,
                    title: "Optimisation des aides",
                    body: "MaPrimeRénov', CEE, éco-PTZ, aides locales : nous identifions tous les financements mobilisables et constituons les dossiers pour maximiser votre reste à charge. Notre qualification RGE est un prérequis à la majorité des aides.",
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
                    <h3 className="mb-2 font-semibold text-[#0D1B35]">
                      {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#4A6285]">
                      {body}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Domaines d'intervention ── */}
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
                Périmètre d'intervention
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="font-display text-3xl font-semibold text-[#0D1B35] md:text-4xl"
              >
                Nos domaines d'intervention
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-4 max-w-2xl text-[#4A6285] leading-relaxed"
              >
                Notre bureau d'étude thermique intervient sur tous les types de
                bâtiments, du tertiaire à l'industrie en passant par le résidentiel collectif.
                Chaque projet bénéficie d'une approche sur mesure adaptée à ses
                contraintes architecturales, réglementaires et budgétaires.
              </motion.p>

              <motion.div
                variants={staggerContainer}
                className="mt-12 grid gap-8 md:grid-cols-3"
              >
                {[
                  {
                    icon: Home,
                    title: "Résidentiel collectif",
                    image:
                      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
                    alt: "Immeuble résidentiel collectif",
                    items: [
                      "Copropriétés et syndics",
                      "Logements locatifs (obligation DPE)",
                      "Bailleurs sociaux",
                      "Rénovation globale BBC",
                    ],
                    body: "Nous accompagnons les copropriétés et les bailleurs dans la rénovation de leur patrimoine résidentiel collectif, de l'audit initial au suivi de chantier. Notre connaissance des dispositifs CEE et MaPrimeRénov' Copropriétés vous permet d'optimiser le financement de chaque projet.",
                  },
                  {
                    icon: Building2,
                    title: "Tertiaire",
                    image:
                      "https://images.unsplash.com/photo-1554435493-93422e8220c8?w=800&q=80",
                    alt: "Façade moderne d'un immeuble de bureaux",
                    items: [
                      "Bureaux et open spaces",
                      "Commerces et surfaces de vente",
                      "Établissements recevant du public (ERP)",
                      "Entrepôts et locaux d'activité",
                    ],
                    body: "Le secteur tertiaire représente près de 17 % de la consommation énergétique nationale. Nous aidons les entreprises à réduire leurs charges d'exploitation et à valoriser leur immobilier grâce à des programmes de rénovation ambitieux et financés.",
                  },
                  {
                    icon: Factory,
                    title: "Industrie",
                    image:
                      "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&q=80",
                    alt: "Site industriel avec installations techniques",
                    items: [
                      "Sites de production et usines",
                      "Entrepôts logistiques",
                      "Process énergivores (groupes froid, air comprimé)",
                      "Conformité ISO 50001 et directive EED",
                    ],
                    body: "L'industrie représente un gisement majeur d'économies d'énergie. Nous auditons les process et les utilités (chauffage, froid, air comprimé, vapeur), identifions les fiches CEE industrie (IND-UT, IND-BA) et pilotons les projets d'optimisation énergétique de vos installations.",
                  },
                ].map(({ icon: Icon, title, image, alt, items, body }) => (
                  <motion.div
                    key={title}
                    variants={fadeUp}
                    className="overflow-hidden rounded-2xl border border-[#DBEAFE] bg-white"
                  >
                    <div className="relative h-48">
                      <Image
                        src={image}
                        alt={alt}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B35]/60 to-transparent" />
                      <div className="absolute bottom-4 left-5 flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-semibold text-white">{title}</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <ul className="mb-4 space-y-1.5">
                        {items.map((item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2 text-sm text-[#4A6285]"
                          >
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#2563EB]" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      <p className="text-sm leading-relaxed text-[#4A6285]">
                        {body}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Méthodologie ── */}
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
                Notre approche
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="font-display text-3xl font-semibold text-[#0D1B35] md:text-4xl"
              >
                Notre méthodologie
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-4 max-w-2xl text-[#4A6285] leading-relaxed"
              >
                La rénovation énergétique performante repose sur une démarche
                structurée en quatre phases. Cette méthode, éprouvée sur des
                centaines de projets, garantit la cohérence technique, le
                respect des délais et l'atteinte des objectifs de performance.
              </motion.p>

              <motion.div
                variants={staggerContainer}
                className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
              >
                {[
                  {
                    step: "01",
                    icon: Search,
                    title: "Diagnostic initial",
                    body: "Visite sur site, collecte des données de consommation, relevé thermographique si nécessaire, modélisation thermique dynamique du bâtiment (STD) et identification des gisements d'économies. L'audit énergétique réglementaire est réalisé selon la norme NF EN 16247.",
                  },
                  {
                    step: "02",
                    icon: Pencil,
                    title: "Étude technique",
                    body: "Conception des solutions de rénovation, dimensionnement des systèmes (isolation, ventilation, chauffage), rédaction du programme technique détaillé et du cahier des charges pour la consultation des entreprises. Simulation des gains énergétiques et des retours sur investissement.",
                  },
                  {
                    step: "03",
                    icon: HardHat,
                    title: "Suivi de travaux",
                    body: "Direction de l'exécution des travaux (DET) : visites de chantier régulières, contrôle de la conformité des mises en œuvre aux DTU et aux prescriptions du cahier des charges, gestion des interfaces entre corps d'état et validation des test d'étanchéité à l'air.",
                  },
                  {
                    step: "04",
                    icon: CheckCircle2,
                    title: "Réception & garantie",
                    body: "Assistance à la réception des ouvrages (AOR) : levée des réserves, vérification du Dossier des Ouvrages Exécutés (DOE), bilan des performances atteintes versus objectifs. Nous vous accompagnons pendant la période de parfait achèvement d'un an.",
                  },
                ].map(({ step, icon: Icon, title, body }) => (
                  <motion.div
                    key={step}
                    variants={fadeUp}
                    className="relative rounded-2xl border border-[#DBEAFE] bg-white p-7"
                  >
                    <span className="font-display absolute right-5 top-4 text-5xl font-bold text-[#DBEAFE]">
                      {step}
                    </span>
                    <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#EFF6FF]">
                      <Icon className="h-5 w-5 text-[#2563EB]" />
                    </div>
                    <h3 className="mb-2 font-semibold text-[#0D1B35]">
                      {title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#4A6285]">
                      {body}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Qualifications ── */}
        <section className="bg-[#F5FAFF] py-20 md:py-28">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="grid gap-12 lg:grid-cols-2 lg:items-center"
            >
              <div>
                <motion.p
                  variants={fadeUp}
                  className="mb-4 text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB]"
                >
                  Reconnaissances officielles
                </motion.p>

                <motion.h2
                  variants={fadeUp}
                  className="font-display text-3xl font-semibold text-[#0D1B35] md:text-4xl"
                >
                  Nos qualifications
                </motion.h2>

                <motion.p
                  variants={fadeUp}
                  className="mt-4 text-[#4A6285] leading-relaxed"
                >
                  La qualification d'un bureau d'étude en rénovation
                  énergétique est le gage de son sérieux et de sa compétence.
                  Elle conditionne l'accès de vos projets aux aides financières
                  de l'État et garantit que les missions sont réalisées par des
                  professionnels formés et contrôlés.
                </motion.p>

                <motion.div
                  variants={staggerContainer}
                  className="mt-8 space-y-4"
                >
                  {[
                    {
                      title: "Qualification RGE (Reconnu Garant de l'Environnement)",
                      body: "La qualification RGE est obligatoire pour que vos travaux soient éligibles à MaPrimeRénov', aux CEE et à l'éco-PTZ. Elle est renouvelée tous les quatre ans après audit de compétences.",
                    },
                    {
                      title: "OPQIBI — Organisme de Qualification de l'Ingénierie",
                      body: "L'OPQIBI qualifie les bureaux d'ingénierie sur des référentiels techniques précis (thermique du bâtiment, fluides, énergie). Elle atteste de notre niveau d'expertise auprès des maîtres d'ouvrage publics et privés.",
                    },
                    {
                      title: "Auditeur agréé ADEME",
                      body: "Notre équipe comprend des auditeurs agréés par l'ADEME pour la réalisation des audits énergétiques réglementaires définis par le décret n°2022-1035, obligatoires depuis le 1er avril 2023 pour les logements classés F ou G.",
                    },
                  ].map(({ title, body }) => (
                    <motion.div
                      key={title}
                      variants={fadeUp}
                      className="flex gap-4 rounded-xl border border-[#DBEAFE] bg-white p-5"
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        <Award className="h-5 w-5 text-[#2563EB]" />
                      </div>
                      <div>
                        <p className="mb-1 font-semibold text-[#0D1B35] text-sm">
                          {title}
                        </p>
                        <p className="text-sm leading-relaxed text-[#4A6285]">
                          {body}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <motion.div variants={fadeUp} className="relative">
                <div className="overflow-hidden rounded-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80"
                    alt="Ingénieur en bureau d'étude analysant des plans de rénovation énergétique"
                    width={700}
                    height={520}
                    className="w-full object-cover"
                  />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-5 -left-5 rounded-2xl bg-[#2563EB] px-6 py-4 shadow-xl">
                  <p className="font-display text-3xl font-bold text-white">RGE</p>
                  <p className="mt-0.5 text-xs text-[#BFDBFE]">
                    Qualification officielle
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ── */}
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
                Vous avez des questions ?
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="font-display text-3xl font-semibold text-[#0D1B35] md:text-4xl"
              >
                Questions fréquentes
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-4 max-w-2xl text-[#4A6285] leading-relaxed"
              >
                Vous trouverez ci-dessous les réponses aux questions les plus
                souvent posées sur le rôle d'un bureau d'étude en rénovation
                énergétique, les aides disponibles et la qualification RGE.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-10 max-w-3xl divide-y-0 rounded-2xl border border-[#DBEAFE] bg-white px-6 py-2"
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

        {/* ── CTA ── */}
        <section className="bg-[#0D1B35] py-20 md:py-28">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center"
            >
              <motion.p
                variants={fadeUp}
                className="mb-4 text-[0.72rem] uppercase tracking-[0.25em] text-[#93C5FD]"
              >
                Passez à l'action
              </motion.p>

              <motion.h2
                variants={fadeUp}
                className="font-display text-3xl font-semibold text-white md:text-4xl"
              >
                Lancez votre projet de rénovation
              </motion.h2>

              <motion.p
                variants={fadeUp}
                className="mt-4 mx-auto max-w-xl text-[#94A3B8] leading-relaxed"
              >
                Contactez notre bureau d'étude pour un premier échange sans
                engagement. Nous analyserons votre situation, estimerons les
                gains potentiels et vous présenterons les aides mobilisables
                pour votre projet.
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
                  href="/nos-prestations"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-4 text-sm font-medium text-white transition-colors hover:border-white/50"
                >
                  Découvrir nos prestations
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
