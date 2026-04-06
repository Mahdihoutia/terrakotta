"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

type ProjectType = "Tous" | "Résidentiel" | "Tertiaire" | "Collectivité";

const FILTERS: ProjectType[] = [
  "Tous",
  "Résidentiel",
  "Tertiaire",
  "Collectivité",
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
    image: "https://images.unsplash.com/photo-1494526585095-c41746248156?w=900&q=80",
  },
  {
    title: "Groupe scolaire Mistral",
    type: "Collectivité" as const,
    category: "Équipement public",
    location: "Marseille",
    year: "2023",
    result: "Passage de E à B sur le DPE",
    scope: "Audit énergétique, maîtrise d'œuvre complète, isolation toiture et murs, PAC air/eau, éclairage LED, GTC.",
    image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=900&q=80",
  },
  {
    title: "Mas de la Garrigue",
    type: "Résidentiel" as const,
    category: "Maison individuelle",
    location: "Lubéron",
    year: "2024",
    result: "– 55% de consommation",
    scope: "Rénovation globale performante : isolation bio-sourcée, menuiseries bois-alu, poêle à granulés, VMC hygroréglable B.",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=900&q=80",
  },
  {
    title: "Immeuble Canebière",
    type: "Résidentiel" as const,
    category: "Copropriété — 32 logements",
    location: "Marseille",
    year: "2023",
    result: "Label BBC Rénovation",
    scope: "Rénovation globale BBC : ITE sous enduit, ventilation centralisée, solaire thermique collectif, pilotage intelligent.",
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=900&q=80",
  },
  {
    title: "Siège social Provençale",
    type: "Tertiaire" as const,
    category: "Bureaux — 2 400 m²",
    location: "Aix-en-Provence",
    year: "2023",
    result: "Conformité décret tertiaire – 40%",
    scope: "Audit tertiaire, plan d'actions, remplacement CTA, relamping LED, optimisation GTC, suivi de performance.",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=900&q=80",
  },
  {
    title: "Médiathèque Saint-Charles",
    type: "Collectivité" as const,
    category: "Équipement culturel",
    location: "Marseille",
    year: "2022",
    result: "– 48% sur la facture énergie",
    scope: "Diagnostic patrimonial, scénarios de rénovation, maîtrise d'œuvre travaux, commissionnement des équipements.",
    image: "https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=900&q=80",
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
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {filtered.map((project, i) => (
                <motion.article
                  key={project.title}
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
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
