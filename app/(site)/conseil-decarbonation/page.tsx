"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import RelatedLinks from "@/components/site/RelatedLinks";
import {
  ArrowRight,
  Gauge,
  LineChart,
  ShieldCheck,
  Building2,
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
    icon: Gauge,
    num: "01",
    title: "Bilan carbone scopes 1, 2 & 3",
    desc: "Mesure de votre empreinte sur l'ensemble des postes d'émissions — énergie, procédés, achats, mobilité, déchets. Méthodologie ADEME (Bilan Carbone®) et Base Empreinte.",
  },
  {
    icon: LineChart,
    num: "02",
    title: "Trajectoire de réduction",
    desc: "Construction d'une trajectoire crédible et chiffrée (référentiel SBTi ou équivalent), priorisation des leviers par coût d'abattement et scénarios de réduction.",
  },
  {
    icon: ShieldCheck,
    num: "03",
    title: "Conformité réglementaire",
    desc: "Mise en conformité avec vos obligations : CSRD, décret tertiaire (DEET / OPERAT / BACS), futurs seuils CSDDD. Un cadrage clair de ce qui s'applique à votre organisation.",
  },
  {
    icon: Building2,
    num: "04",
    title: "Plan de décarbonation du parc",
    desc: "Déclinaison opérationnelle à l'échelle d'un bâtiment comme d'un patrimoine : plan pluriannuel, budget, jalons et suivi des gains réels dans la durée.",
  },
];

const ETAPES = [
  {
    step: "01",
    title: "Mesurer",
    text: "Collecte des données, calcul du bilan carbone scopes 1, 2 & 3 et identification des postes prioritaires.",
  },
  {
    step: "02",
    title: "Structurer",
    text: "Trajectoire de réduction, cadrage réglementaire et hiérarchisation des leviers par impact et coût.",
  },
  {
    step: "03",
    title: "Piloter",
    text: "Déploiement du plan d'action, suivi des indicateurs et reporting conforme à vos obligations.",
  },
];

const FAQS = [
  {
    q: "Qu'est-ce qu'un bilan carbone scopes 1, 2 et 3 ?",
    a: "Le scope 1 couvre vos émissions directes (combustion sur site, flotte), le scope 2 vos émissions liées à l'énergie achetée (électricité, réseau de chaleur), et le scope 3 l'ensemble des émissions indirectes de votre chaîne de valeur (achats, fret, déplacements, usage des produits). C'est souvent le scope 3 qui pèse le plus — et celui que nous aidons à structurer.",
  },
  {
    q: "Suis-je concerné par la CSRD ?",
    a: "La CSRD s'applique progressivement aux grandes entreprises et aux PME cotées, avec des seuils d'effectif, de bilan et de chiffre d'affaires. Même non assujettie, votre organisation peut être sollicitée par ses donneurs d'ordre au titre de leur propre scope 3. Nous cadrons précisément votre situation et le niveau d'exigence attendu.",
  },
  {
    q: "Quel lien avec le décret tertiaire ?",
    a: "Le décret tertiaire (DEET) impose aux bâtiments de plus de 1 000 m² une trajectoire de réduction des consommations, avec déclaration annuelle sur OPERAT. Le conseil en décarbonation intègre cette obligation dans une stratégie plus large, articulée avec la valorisation CEE de vos travaux.",
  },
  {
    q: "En quoi est-ce complémentaire des CEE ?",
    a: "L'étude de gisement CEE finance et déclenche les actions d'efficacité énergétique ; le conseil en décarbonation élargit la perspective à l'ensemble de vos émissions et à vos obligations extra-financières. Les deux se nourrissent : un client qui réalise un audit CEE a presque toujours besoin d'un cadrage décarbonation plus large.",
  },
];

export default function ConseilDecarbonationPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1920&q=80"
            alt="Trajectoire de décarbonation — paysage et énergie"
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
              Pilier 2 — Décarbonation
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.05] mb-8">
              Conseil en
              <br />
              <span className="italic text-[#60A5FA]">décarbonation</span>
            </h1>
            <p className="text-[1rem] text-[#BFDBFE] leading-relaxed max-w-xl mb-10">
              Mesurer votre empreinte, structurer une trajectoire de réduction
              crédible et vous mettre en conformité avec vos obligations. La
              montée en gamme naturelle après l&apos;audit CEE, à l&apos;échelle
              d&apos;un bâtiment comme d&apos;un parc immobilier.
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
              Notre accompagnement
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#0D1B35] leading-[1.1]">
              De la mesure
              <span className="italic text-[#2563EB]"> à l&apos;action</span>
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

      {/* Méthode */}
      <section className="py-24 md:py-32 bg-[#0D1B35]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#60A5FA] mb-4">
                Notre méthode
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-light text-[#F5FAFF] leading-[1.1]">
                Trois temps,
                <br />
                <span className="italic text-[#60A5FA]">un cap clair</span>
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6 grid grid-cols-1 gap-8">
              {ETAPES.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className="flex gap-6 border-b border-[#1B3356] pb-8 last:border-0"
                >
                  <span className="font-display text-3xl font-light text-[#60A5FA]/50 shrink-0">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="font-display text-xl text-[#F5FAFF] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[0.9rem] text-[#7BAAC8] leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
            Questions fréquentes
          </p>
          <h2 className="font-display text-4xl md:text-5xl font-light text-[#0D1B35] leading-[1.1] mb-16">
            Bien comprendre
            <span className="italic text-[#2563EB]"> la démarche</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            {FAQS.map((f) => (
              <div key={f.q} className="border-t border-[#DBEAFE] pt-6">
                <h3 className="font-display text-xl text-[#0D1B35] mb-3">{f.q}</h3>
                <p className="text-[0.9rem] text-[#4A6285] leading-[1.7]">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <RelatedLinks
        variant="dark"
        title="Explorer notre offre"
        subtitle="Le conseil en décarbonation s'articule avec nos deux autres piliers pour couvrir toute la chaîne, du financement à la valorisation."
        links={[
          {
            href: "/accompagnement-cee",
            eyebrow: "Pilier 1",
            title: "Certificats d'économie d'énergie (CEE)",
            description: "Notre cœur de métier : audit du gisement, montage des dossiers et valorisation via mandat EMMY.",
          },
          {
            href: "/courtage-environnemental",
            eyebrow: "Pilier 3",
            title: "Courtage environnemental",
            description: "Crédits carbone volontaires, garanties d'origine et biotickets, avec une sélection exigeante des projets.",
          },
          {
            href: "/contactez-nous",
            eyebrow: "Échanger",
            title: "Parlons de votre trajectoire",
            description: "Un bilan carbone à lancer, une obligation à cadrer : notre équipe vous répond sous 48h.",
          },
        ]}
      />
    </>
  );
}
