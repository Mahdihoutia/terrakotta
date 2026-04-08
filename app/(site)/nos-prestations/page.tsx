"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Thermometer,
  FileCheck,
  HardHat,
  Shield,
  BarChart3,
  FileText,
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
    icon: Thermometer,
    title: "Audit énergétique",
    desc: "Diagnostic complet de la performance thermique de votre bâtiment : analyse des déperditions, étude des systèmes énergétiques, simulation thermique dynamique. Nous identifions les leviers d'amélioration les plus efficaces et les hiérarchisons selon leur rapport coût/performance.",
    details: [
      "Analyse thermographique infrarouge",
      "Test d'étanchéité à l'air (Blower Door)",
      "Simulation thermique dynamique (STD)",
      "Préconisations chiffrées et hiérarchisées",
    ],
    image: "https://images.unsplash.com/photo-1744627049721-73c27008ad28?w=800&q=80",
  },
  {
    icon: HardHat,
    title: "Maîtrise d'œuvre & AMO",
    desc: "Pilotage complet des travaux de rénovation énergétique, de la conception à la réception, et missions d'Assistant à Maîtrise d'Ouvrage (AMO). Nous coordonnons l'ensemble des intervenants, veillons au respect du cahier des charges et garantissons la qualité d'exécution.",
    details: [
      "Conception technique détaillée",
      "Consultation et sélection des entreprises",
      "Direction de l'exécution des travaux (DET)",
      "Assistance aux opérations de réception (AOR)",
    ],
    image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80",
  },
  {
    icon: FileCheck,
    title: "Accompagnement aides & financements",
    desc: "Montage et suivi des dossiers de financement : MaPrimeRénov', Certificats d'Économies d'Énergie (CEE), aides de l'Anah, éco-PTZ et aides locales. Nous optimisons le plan de financement pour réduire le reste à charge.",
    details: [
      "Audit préalable d'éligibilité",
      "Montage des dossiers MaPrimeRénov'",
      "Valorisation des CEE (prime énergie)",
      "Suivi administratif jusqu'au versement",
    ],
    image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&q=80",
  },
  {
    icon: Shield,
    title: "Études thermiques réglementaires",
    desc: "Réalisation des études thermiques conformes aux réglementations en vigueur : RE 2020 pour le neuf, RT existant pour la rénovation. Nous garantissons la conformité de votre projet aux exigences réglementaires.",
    details: [
      "Études RT 2012 / RE 2020",
      "Attestations Bbio et conformité",
      "RT existant — élément par élément ou globale",
      "Modélisation des consommations prévisionnelles",
    ],
    image: "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=800&q=80",
  },
  {
    icon: BarChart3,
    title: "Commissionnement & suivi",
    desc: "Vérification de la performance réelle des installations après travaux. Nous mesurons, ajustons et optimisons pour garantir que les objectifs de performance sont atteints dans la durée.",
    details: [
      "Mesure des consommations réelles",
      "Ajustement des réglages et paramètres",
      "Rapport de performance annuel",
      "Garantie de résultat énergétique (GRE)",
    ],
    image: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80",
  },
  {
    icon: FileText,
    title: "Conseil & stratégie patrimoniale",
    desc: "Accompagnement stratégique pour les gestionnaires de patrimoine immobilier : plan pluriannuel de travaux, priorisation des investissements et trajectoire de décarbonation à l'échelle du portefeuille.",
    details: [
      "Plan pluriannuel de travaux (PPT)",
      "Diagnostic technique global (DTG)",
      "Stratégie de décarbonation du parc",
      "Conformité au décret tertiaire",
    ],
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
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
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] mb-4">
              Nos prestations
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-[#2C1810] leading-[1.05] mb-8">
              Une expertise
              <br />
              <span className="italic text-[#8B4513]">à 360°</span>
            </h1>
            <p className="text-[1rem] text-[#6B5B50] leading-relaxed max-w-xl">
              De l&apos;audit initial au suivi post-travaux, nous couvrons
              l&apos;ensemble du cycle de vie d&apos;un projet de rénovation
              énergétique avec rigueur et engagement.
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
                variants={fadeUp}
                custom={0}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 py-16 md:py-24 border-t border-[#E8E0D4] ${
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
                    <div className="w-12 h-12 rounded-full border border-[#D4C4B0] flex items-center justify-center">
                      <p.icon size={22} className="text-[#8B4513]" strokeWidth={1.5} />
                    </div>
                    <h2 className="font-display text-3xl md:text-4xl font-normal text-[#2C1810]">
                      {p.title}
                    </h2>
                  </div>

                  <p className="text-[0.92rem] text-[#6B5B50] leading-[1.8] mb-8">
                    {p.desc}
                  </p>

                  <ul className="space-y-3 mb-8">
                    {p.details.map((d) => (
                      <li
                        key={d}
                        className="flex items-center gap-3 text-[0.85rem] text-[#2C1810]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#8B4513] shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/contactez-nous"
                    className="group inline-flex items-center gap-2 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-[#8B4513] hover:text-[#6B3A1F] transition-colors w-fit"
                  >
                    Demander un devis
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
      <section className="py-24 md:py-32 bg-[#F5F0EB]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] mb-4">
              Votre projet
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#2C1810] leading-[1.1] mb-6">
              Chaque bâtiment mérite
              <br />
              <span className="italic text-[#8B4513]">une solution sur mesure</span>
            </h2>
            <p className="text-[0.95rem] text-[#6B5B50] leading-relaxed max-w-md mx-auto mb-10">
              Décrivez-nous votre projet et nous vous proposerons un
              accompagnement adapté à vos objectifs et votre budget.
            </p>
            <Link
              href="/contactez-nous"
              className="group inline-flex items-center gap-3 bg-[#8B4513] px-10 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#6B3A1F]"
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
    </>
  );
}
