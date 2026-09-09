"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import RelatedLinks from "@/components/site/RelatedLinks";
import {
  ArrowRight,
  Leaf,
  Zap,
  Fuel,
  BadgeCheck,
} from "lucide-react";

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
  {
    icon: Leaf,
    num: "01",
    title: "Crédits carbone volontaires",
    desc: "Mise en relation entre porteurs de projets (Label Bas Carbone, standards internationaux) et entreprises acheteuses. Nous sourçons, qualifions et négocions pour votre compte.",
  },
  {
    icon: Zap,
    num: "02",
    title: "Garanties d'origine",
    desc: "Approvisionnement en garanties d'origine électricité et biométhane pour tracer et verdir vos consommations, avec le bon niveau de qualité selon vos objectifs de reporting.",
  },
  {
    icon: Fuel,
    num: "03",
    title: "Biotickets (IRICC)",
    desc: "Intermédiation sur les certificats liés aux énergies renouvelables dans les transports (IRICC), entre producteurs et acteurs soumis à obligation.",
  },
  {
    icon: BadgeCheck,
    num: "04",
    title: "Sélection & sourcing",
    desc: "Notre vraie valeur ajoutée : une sélection exigeante des projets crédibles. Pas de simple mise en relation — un filtre sur la qualité et l'additionnalité, contre le greenwashing.",
  },
];

const VIGILANCE = [
  {
    title: "Volontaire n'est pas réglementé",
    text: "Les crédits carbone volontaires ne se substituent pas aux quotas EU ETS / ETS2. Nous cadrons clairement l'usage de chaque produit pour éviter toute confusion et tout risque de greenwashing (durcissement EmpCo attendu).",
  },
  {
    title: "La qualité avant le volume",
    text: "La crédibilité de certains standards internationaux s'est dégradée. Nous privilégions des projets vérifiables, additionnels et documentés — quitte à écarter des volumes bon marché mais fragiles.",
  },
  {
    title: "Un réseau des deux côtés",
    text: "Notre rôle d'agrégateur consolide une offre fragmentée (petits producteurs, porteurs de projets locaux) pour la rendre accessible aux acheteurs, dans une relation transparente.",
  },
];

export default function CourtageEnvironnementalPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1920&q=80"
            alt="Actifs environnementaux — énergies renouvelables"
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
              Pilier 3 — Courtage environnemental
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.05] mb-8">
              Courtage de produits
              <br />
              <span className="italic text-[#60A5FA]">environnementaux</span>
            </h1>
            <p className="text-[1rem] text-[#BFDBFE] leading-relaxed max-w-xl mb-10">
              Crédits carbone volontaires, garanties d&apos;origine et biotickets.
              Nous connectons porteurs de projets et entreprises, avec une
              exigence forte sur la crédibilité des projets — pas seulement la
              mise en relation.
            </p>
            <Link
              href="/contactez-nous"
              className="group inline-flex items-center gap-3 bg-[#2563EB] px-8 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#1E40AF]"
            >
              Nous contacter
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
              Ce que nous courtons
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#0D1B35] leading-[1.1]">
              Un accès simple à un
              <span className="italic text-[#2563EB]"> marché fragmenté</span>
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
                  {p.title}
                </h3>
                <p className="text-[0.88rem] text-[#4A6285] leading-relaxed">
                  {p.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Points de vigilance */}
      <section className="py-24 md:py-32 bg-[#0D1B35]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="max-w-2xl mb-16">
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#60A5FA] mb-4">
              Notre exigence
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#F5FAFF] leading-[1.1]">
              La crédibilité
              <span className="italic text-[#60A5FA]"> avant tout</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VIGILANCE.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.6 }}
                className="border-t border-[#1B3356] pt-6"
              >
                <h3 className="font-display text-xl text-[#F5FAFF] mb-3">{item.title}</h3>
                <p className="text-[0.9rem] text-[#7BAAC8] leading-[1.7]">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <RelatedLinks
        variant="dark"
        title="Explorer notre offre"
        subtitle="Le courtage environnemental prolonge naturellement notre accompagnement, du financement des économies d'énergie à la valorisation de vos actifs."
        links={[
          {
            href: "/accompagnement-cee",
            eyebrow: "Pilier 1",
            title: "Certificats d'économie d'énergie (CEE)",
            description: "Notre cœur de métier : audit du gisement, montage des dossiers et valorisation via mandat EMMY.",
          },
          {
            href: "/conseil-decarbonation",
            eyebrow: "Pilier 2",
            title: "Conseil en décarbonation",
            description: "Bilan carbone scopes 1, 2 & 3, trajectoire de réduction (SBTi) et conformité CSRD / décret tertiaire.",
          },
          {
            href: "/contactez-nous",
            eyebrow: "Échanger",
            title: "Parlons de vos actifs",
            description: "Un besoin de crédits carbone, de garanties d'origine ou de biotickets : notre équipe vous répond sous 48h.",
          },
        ]}
      />
    </>
  );
}
