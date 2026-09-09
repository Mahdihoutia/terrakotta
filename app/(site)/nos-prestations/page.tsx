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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const PRESTATIONS = [
  {
    icon: FileCheck,
    pilier: "Pilier 1 — CEE",
    title: "Certificats d'économie d'énergie (CEE)",
    id: "cee",
    desc: "Notre cœur de métier et notre porte d'entrée. Nous auditons le gisement d'économies d'énergie mobilisable sur votre patrimoine, montons les dossiers de Certificats d'Économies d'Énergie et les valorisons via mandat sur EMMY. Un seul interlocuteur, du diagnostic au versement de la prime.",
    details: [
      "Audit du gisement d'économies d'énergie",
      "Constitution et dépôt des dossiers CEE",
      "Valorisation via mandat EMMY",
      "Optimisation des kWh cumac & suivi jusqu'au versement",
    ],
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
  },
  {
    icon: LineChart,
    pilier: "Pilier 2 — Décarbonation",
    title: "Bilan carbone & trajectoire de décarbonation",
    id: "decarbonation",
    desc: "La montée en gamme naturelle après l'audit CEE. Nous mesurons votre empreinte, structurons une trajectoire de réduction crédible et vous mettons en conformité avec vos obligations, à l'échelle du bâtiment comme du parc immobilier.",
    details: [
      "Bilan carbone scopes 1, 2 & 3",
      "Trajectoire de réduction (référentiel SBTi ou équivalent)",
      "Conformité CSRD & décret tertiaire (DEET / BACS)",
      "Plan pluriannuel de décarbonation du patrimoine",
    ],
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  },
  {
    icon: Repeat,
    pilier: "Pilier 3 — Courtage environnemental",
    title: "Courtage de produits environnementaux",
    id: "courtage",
    desc: "Notre rôle d'agrégateur : consolider une offre fragmentée et la rendre accessible aux acheteurs. Nous connectons porteurs de projets et entreprises sur l'ensemble des actifs environnementaux, avec une exigence forte sur la crédibilité des projets — pas seulement la mise en relation.",
    details: [
      "Crédits carbone volontaires (Label Bas Carbone, standards internationaux)",
      "Garanties d'origine (électricité, biométhane)",
      "Biotickets (IRICC)",
      "Sélection exigeante des projets & mise en relation offre / demande",
    ],
    image: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&q=80",
  },
  {
    icon: BarChart3,
    pilier: "Pilier 1 — Mesure & performance",
    title: "Commissionnement & suivi de performance",
    id: "suivi",
    desc: "Vérification de la performance réelle des installations après travaux. Nous mesurons, ajustons et optimisons pour garantir que les objectifs d'économies et de réduction d'émissions sont tenus dans la durée.",
    details: [
      "Mesure des consommations réelles",
      "Ajustement des réglages et paramètres",
      "Rapport de performance annuel",
      "Garantie de résultat énergétique (GRE)",
    ],
    image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80",
  },
];

export default function NosPrestationsPage() {
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
              Nos prestations — Une offre intégrée
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-[#0D1B35] leading-[1.05] mb-8">
              Une offre intégrée,
              <br />
              <span className="italic text-[#2563EB]">une seule chaîne de valeur</span>
            </h1>
            <p className="text-[1rem] text-[#4A6285] leading-relaxed max-w-xl">
              De l&apos;étude de gisement CEE au conseil en décarbonation, jusqu&apos;au
              courtage des produits environnementaux : un interlocuteur unique
              entre vos obligations énergétiques et les mécanismes qui les financent.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Prestations List */}
      <section className="pb-24 md:pb-36">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="space-y-0">
            {PRESTATIONS.map((p, i) => (
              <motion.article
                key={p.title}
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
                    alt={p.title}
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
                        {p.pilier}
                      </p>
                      <h2 className="font-display text-3xl md:text-4xl font-normal text-[#0D1B35]">
                        {p.title}
                      </h2>
                    </div>
                  </div>

                  <p className="text-[0.92rem] text-[#4A6285] leading-[1.8] mb-8">
                    {p.desc}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {p.details.map((d) => (
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
                    href="/contactez-nous"
                    className="group inline-flex items-center gap-2 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-[#2563EB] hover:text-[#1E40AF] transition-colors w-fit"
                  >
                    Nous contacter
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </Link>
                </div>
              </motion.article>
            ))}
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
              Votre projet
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#0D1B35] leading-[1.1] mb-6">
              Chaque bâtiment mérite
              <br />
              <span className="italic text-[#2563EB]">une solution sur mesure</span>
            </h2>
            <p className="text-[0.95rem] text-[#4A6285] leading-relaxed max-w-md mx-auto mb-10">
              Décrivez-nous votre projet et nous vous proposerons un
              accompagnement adapté à vos objectifs et votre budget.
            </p>
            <Link
              href="/contactez-nous"
              className="group inline-flex items-center gap-3 bg-[#2563EB] px-10 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#1E40AF]"
            >
              Contactez-nous
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </div>
      </section>

      <RelatedLinks
        title="Explorer notre offre"
        subtitle="Trois leviers complémentaires, un seul interlocuteur — de la valorisation de vos économies d'énergie au courtage de vos actifs environnementaux."
        links={[
          {
            href: "/accompagnement-cee",
            eyebrow: "Pilier 1",
            title: "Certificats d'économie d'énergie (CEE)",
            description: "Notre cœur de métier : audit du gisement, montage des dossiers et valorisation via mandat EMMY. Du diagnostic au versement de la prime.",
          },
          {
            href: "/conseil-decarbonation",
            eyebrow: "Pilier 2",
            title: "Conseil en décarbonation",
            description: "Bilan carbone scopes 1, 2 & 3, trajectoire de réduction (SBTi) et mise en conformité CSRD et décret tertiaire.",
          },
          {
            href: "/courtage-environnemental",
            eyebrow: "Pilier 3",
            title: "Courtage environnemental",
            description: "Crédits carbone volontaires, garanties d'origine et biotickets : nous connectons porteurs de projets et entreprises, avec une sélection exigeante.",
          },
        ]}
      />
    </>
  );
}
