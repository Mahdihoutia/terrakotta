"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, TrendingDown, Calendar } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

type ProjectType = "Tous" | "Résidentiel" | "Tertiaire" | "Collectivité" | "Industrie";

const FILTERS: ProjectType[] = [
  "Tous",
  "Résidentiel",
  "Tertiaire",
  "Collectivité",
  "Industrie",
];

const PROJECTS = [
  {
    title: "Résidence Les Oliviers",
    type: "Résidentiel" as const,
    category: "Copropriété — 48 logements",
    location: "Aix-en-Provence",
    year: "2024",
    result: "– 42% de consommation énergétique",
    scope: "Isolation thermique par l'extérieur, remplacement des menuiseries, rénovation du système de chauffage collectif, ventilation double flux.",
    image: "https://images.unsplash.com/photo-1772544541450-b0648648507f?w=900&q=80",
  },
  {
    title: "Groupe scolaire Mistral",
    type: "Collectivité" as const,
    category: "Équipement public",
    location: "Marseille",
    year: "2023",
    result: "Passage de E à B sur le DPE",
    scope: "Audit énergétique, maîtrise d'œuvre complète, isolation toiture et murs, PAC air/eau, éclairage LED, GTC.",
    image: "https://images.unsplash.com/photo-1741638511380-0ba689024c59?w=900&q=80",
  },
  {
    title: "Tour Ariane — La Défense",
    type: "Tertiaire" as const,
    category: "Bureaux — 5 800 m²",
    location: "Île-de-France",
    year: "2024",
    result: "Conformité décret tertiaire – 45%",
    scope: "Audit énergétique tertiaire, remplacement CTA double flux, relamping LED, optimisation GTC, régulation terminale, suivi OPERAT.",
    image: "https://images.unsplash.com/photo-1448630360428-65456885c650?w=900&q=80",
  },
  // ─── Résidentiel IDF (+150 logements) ──────────────────────
  {
    title: "Les Jardins d'Arcueil",
    type: "Résidentiel" as const,
    category: "Copropriété — 210 logements",
    location: "Arcueil, Île-de-France",
    year: "2024",
    result: "– 52% de consommation énergétique",
    scope: "ITE sur 8 bâtiments, remplacement menuiseries aluminium, modernisation chaufferie gaz collective, calorifugeage réseau, VMC hygroréglable B.",
    image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=900&q=80",
  },
  {
    title: "Résidence Olympe de Gouges",
    type: "Résidentiel" as const,
    category: "Copropriété — 186 logements",
    location: "Vitry-sur-Seine, Île-de-France",
    year: "2023",
    result: "Passage de F à C sur le DPE",
    scope: "Isolation extérieure colorée, remplacement fenêtres triple vitrage, installation PAC air/eau collective, toiture végétalisée, pilotage GTB.",
    image: "https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=900&q=80",
  },
  {
    title: "Grand ensemble Romain Rolland",
    type: "Résidentiel" as const,
    category: "Rénovation globale — 154 logements",
    location: "Champigny-sur-Marne, Île-de-France",
    year: "2023",
    result: "Label BBC Rénovation — DPE A",
    scope: "Rénovation globale performante : ITE biosourcée, menuiseries bois-alu, PAC géothermique, VMC double flux, panneaux solaires hybrides, pilotage intelligent.",
    image: "https://images.unsplash.com/photo-1460317442991-0ec209397118?w=900&q=80",
  },
  // ─── Tertiaire IDF (+5 000 m²) ───────────────────────────
  {
    title: "Campus Carrefour — Massy",
    type: "Tertiaire" as const,
    category: "Bureaux — 12 000 m²",
    location: "Massy, Île-de-France",
    year: "2024",
    result: "Conformité décret tertiaire – 48%",
    scope: "Audit énergétique tertiaire, remplacement CTA et groupes froids, relamping LED intelligent, façade double peau, optimisation GTC, reporting OPERAT.",
    image: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=900&q=80",
  },
  {
    title: "Siège Natixis — Charenton",
    type: "Tertiaire" as const,
    category: "Bureaux végétalisés — 8 500 m²",
    location: "Charenton-le-Pont, Île-de-France",
    year: "2023",
    result: "– 42% consommation, certification HQE Excellent",
    scope: "Rénovation BBC tertiaire, toiture et façades végétalisées, PAC réversible, free-cooling, gestion dynamique de l'éclairage et des stores, suivi IoT.",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=900&q=80",
  },
  // ─── Industrie ────────────────────────────────────────────
  {
    title: "Centrale frigorifique Auchan Logistique",
    type: "Industrie" as const,
    category: "Plateforme logistique — groupes froids",
    location: "Lille, Hauts-de-France",
    year: "2023",
    result: "– 38% de consommation frigorifique",
    scope: "Audit des groupes froids, remplacement compresseurs haute efficacité, passage au R-454C, récupération de chaleur sur condenseurs, pilotage centralisé.",
    image: "https://images.unsplash.com/photo-1757573538081-c469f75cdd7a?w=900&q=80",
  },
  {
    title: "Récupération de chaleur — Usine Roquette",
    type: "Industrie" as const,
    category: "Agroalimentaire — récupération de chaleur",
    location: "Lestrem, Hauts-de-France",
    year: "2024",
    result: "850 MWh/an de chaleur récupérée",
    scope: "Étude de faisabilité, dimensionnement échangeurs thermiques, raccordement réseau de chaleur interne, instrumentation et suivi de performance énergétique.",
    image: "https://images.unsplash.com/photo-1650551182991-b07558247564?w=900&q=80",
  },
  {
    title: "Décarbonation chaufferie — Saint-Gobain Pont-à-Mousson",
    type: "Industrie" as const,
    category: "Sidérurgie — conversion biomasse",
    location: "Pont-à-Mousson, Grand Est",
    year: "2024",
    result: "– 60% d'émissions CO₂ sur site",
    scope: "Audit process industriel, étude de conversion fioul vers biomasse, dimensionnement chaudière bois 8 MW, réseau vapeur, traitement fumées et monitoring continu.",
    image: "https://images.unsplash.com/photo-1513828583688-c52646db42da?w=900&q=80",
  },
];

export default function NosReferencesPage() {
  const [filter, setFilter] = useState<ProjectType>("Tous");

  const filtered =
    filter === "Tous"
      ? PROJECTS
      : PROJECTS.filter((p) => p.type === filter);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mb-14"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] mb-4">
              Nos références
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-[#2C1810] leading-[1.05] mb-8">
              Des réalisations
              <br />
              <span className="italic text-[#8B4513]">concrètes</span>
            </h1>
            <p className="text-[1rem] text-[#6B5B50] leading-relaxed max-w-xl">
              Chaque projet raconte une transformation. Découvrez comment nous
              avons accompagné nos clients vers un bâti plus performant.
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-3 mb-16"
          >
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 text-[0.78rem] font-medium uppercase tracking-[0.12em] border transition-all duration-300 ${
                  filter === f
                    ? "bg-[#8B4513] border-[#8B4513] text-white"
                    : "bg-transparent border-[#D4C4B0] text-[#6B5B50] hover:border-[#8B4513] hover:text-[#8B4513]"
                }`}
              >
                {f}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="pb-24 md:pb-36">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div
            key={filter}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filtered.map((project, i) => (
              <motion.article
                key={`${filter}-${project.title}`}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                animate="visible"
                className="group border border-[#E8E0D4] bg-white hover:border-[#C4956A]/40 transition-colors duration-500"
              >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="inline-block bg-[#2C1810]/80 backdrop-blur-sm px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.15em] text-[#F5F0EB]">
                        {project.type}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-4 text-[0.75rem] text-[#8B7B6E]">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        {project.location}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        {project.year}
                      </span>
                    </div>

                    <h3 className="font-display text-2xl md:text-3xl font-normal text-[#2C1810] mb-2">
                      {project.title}
                    </h3>
                    <p className="text-[0.82rem] text-[#8B7B6E] mb-4">
                      {project.category}
                    </p>
                    <p className="text-[0.88rem] text-[#6B5B50] leading-relaxed mb-6">
                      {project.scope}
                    </p>

                    <div className="flex items-center gap-2 pt-4 border-t border-[#E8E0D4]">
                      <TrendingDown size={16} className="text-[#8B4513]" />
                      <span className="text-[0.85rem] font-semibold text-[#8B4513]">
                        {project.result}
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}
