"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowRight, Leaf, Droplets, Sun, TreePine, Wind, Globe } from "lucide-react";

/* ─────────── Types ─────────── */
type Category = "Tous" | "Climat" | "Biodiversité" | "Énergie" | "Urbanisme" | "Matériaux";

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: Category;
  readTime: string;
  date: string;
  image: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  featured?: boolean;
}

/* ─────────── Data ─────────── */
const CATEGORIES: Category[] = [
  "Tous",
  "Climat",
  "Biodiversité",
  "Énergie",
  "Urbanisme",
  "Matériaux",
];

const CATEGORY_COLORS: Record<string, string> = {
  Climat: "bg-[#8B4513]",
  Biodiversité: "bg-[#5B7A3A]",
  Énergie: "bg-[#C4956A]",
  Urbanisme: "bg-[#6B5B50]",
  Matériaux: "bg-[#A0876E]",
};

const ARTICLES: Article[] = [
  {
    slug: "passoires-thermiques-2025",
    title: "Passoires thermiques : ce qui change en 2025 pour les propriétaires",
    excerpt:
      "Depuis le 1er janvier 2025, les logements classés G au DPE sont interdits à la location. Décryptage des obligations, des aides disponibles et des stratégies de rénovation pour les propriétaires bailleurs concernés par cette échéance réglementaire.",
    category: "Énergie",
    readTime: "8 min",
    date: "28 mars 2026",
    image: "https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=900&q=80",
    icon: Sun,
    featured: true,
  },
  {
    slug: "ilots-chaleur-urbains-solutions",
    title: "Îlots de chaleur urbains : quand la ville surchauffe, le bâtiment peut répondre",
    excerpt:
      "Les épisodes caniculaires se multiplient et les centres-villes enregistrent jusqu'à +8 °C par rapport aux zones rurales. Toitures végétalisées, façades bio-climatiques, matériaux à forte inertie : panorama des solutions architecturales pour rafraîchir nos villes.",
    category: "Climat",
    readTime: "10 min",
    date: "15 mars 2026",
    image: "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=900&q=80",
    icon: Wind,
    featured: true,
  },
  {
    slug: "biodiversite-urbaine-batiment",
    title: "Biodiversité et bâtiment : comment la rénovation peut devenir un levier écologique",
    excerpt:
      "Nichoirs intégrés, corridors écologiques en toiture, façades refuges pour les pollinisateurs… La rénovation énergétique peut aller au-delà de la performance thermique et contribuer activement au retour de la biodiversité en milieu urbain.",
    category: "Biodiversité",
    readTime: "7 min",
    date: "2 mars 2026",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80",
    icon: TreePine,
  },
  {
    slug: "re2020-bilan-carbone-construction",
    title: "RE 2020 : le bilan carbone au cœur de la construction neuve",
    excerpt:
      "La RE 2020 introduit pour la première fois l'analyse du cycle de vie (ACV) comme critère réglementaire. Poids carbone des matériaux, énergie grise, stockage biogénique : comprendre les nouveaux indicateurs qui redessinent la façon de construire.",
    category: "Matériaux",
    readTime: "12 min",
    date: "18 février 2026",
    image: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=900&q=80",
    icon: Globe,
  },
  {
    slug: "renovation-globale-copropriete",
    title: "Rénovation globale en copropriété : retour d'expérience sur 48 logements à Aix",
    excerpt:
      "De l'audit initial à la livraison, récit d'une rénovation ambitieuse : isolation par l'extérieur, chaufferie bois, ventilation double flux et production solaire. Résultats mesurés après un an d'exploitation : –42 % sur la facture énergétique collective.",
    category: "Énergie",
    readTime: "9 min",
    date: "5 février 2026",
    image: "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?w=900&q=80",
    icon: Sun,
  },
  {
    slug: "materiaux-biosources-renovation",
    title: "Fibre de bois, chanvre, liège : les matériaux biosourcés en rénovation",
    excerpt:
      "Longtemps cantonnés à la construction neuve, les isolants biosourcés gagnent le marché de la rénovation. Performance thermique, régulation hygrométrique, bilan carbone : comparatif technique face aux isolants conventionnels.",
    category: "Matériaux",
    readTime: "8 min",
    date: "22 janvier 2026",
    image: "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=900&q=80",
    icon: Leaf,
  },
  {
    slug: "eau-pluviale-batiment-resilient",
    title: "Gestion des eaux pluviales : vers un bâtiment résilient face aux inondations",
    excerpt:
      "Imperméabilisation des sols, ruissellement urbain, épisodes cévenols de plus en plus fréquents : la gestion de l'eau devient un enjeu majeur de la conception et de la rénovation. Noues, jardins de pluie, toitures rétention — les solutions existent.",
    category: "Climat",
    readTime: "7 min",
    date: "10 janvier 2026",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=900&q=80",
    icon: Droplets,
  },
  {
    slug: "ville-permeabilite-nature",
    title: "Désimperméabiliser la ville : quand le béton laisse place à la nature",
    excerpt:
      "Les collectivités françaises s'engagent dans la désimperméabilisation des sols urbains. Cours d'école, parkings, pieds d'immeubles : chaque mètre carré reconquis par le vivant contribue à la résilience climatique du territoire.",
    category: "Urbanisme",
    readTime: "6 min",
    date: "18 décembre 2025",
    image: "https://images.unsplash.com/photo-1518005068251-37900150dfca?w=900&q=80",
    icon: TreePine,
  },
  {
    slug: "confort-ete-renovation",
    title: "Confort d'été : la face cachée de la rénovation énergétique",
    excerpt:
      "Isoler un bâtiment pour l'hiver sans penser à l'été, c'est risquer la surchauffe. Protections solaires, inertie thermique, ventilation nocturne, brasseurs d'air : stratégies pour un confort quatre saisons sans climatisation.",
    category: "Énergie",
    readTime: "8 min",
    date: "3 décembre 2025",
    image: "https://images.unsplash.com/photo-1558449028-b53a39d100fc?w=900&q=80",
    icon: Sun,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/* ─────────── Page ─────────── */
export default function LaboratoireIdeesPage() {
  const [filter, setFilter] = useState<Category>("Tous");

  const featured = ARTICLES.filter((a) => a.featured);
  const regular = ARTICLES.filter((a) => !a.featured);
  const filtered =
    filter === "Tous" ? regular : regular.filter((a) => a.category === filter);

  return (
    <>
      {/* ═══════════ HERO ═══════════ */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl mb-6"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] mb-4">
              Laboratoire d&apos;idées
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-[#2C1810] leading-[1.05] mb-8">
              Penser le bâti
              <br />
              <span className="italic text-[#8B4513]">autrement</span>
            </h1>
            <p className="text-[1rem] text-[#6B5B50] leading-relaxed max-w-xl">
              Réflexions, décryptages et retours d&apos;expérience sur la
              rénovation énergétique, le climat, la biodiversité et les
              matériaux de demain. Un espace pour explorer les idées qui
              façonnent le bâtiment durable.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FEATURED ARTICLES ═══════════ */}
      <section className="pb-20 md:pb-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featured.map((article, i) => (
              <motion.article
                key={article.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
                className="group relative overflow-hidden bg-white border border-[#E8E0D4] hover:border-[#C4956A]/40 transition-colors duration-500"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute top-5 left-5">
                    <span
                      className={`inline-block px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.15em] text-white ${
                        CATEGORY_COLORS[article.category] || "bg-[#6B5B50]"
                      }`}
                    >
                      {article.category}
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <h2 className="font-display text-2xl md:text-3xl font-light text-white leading-snug">
                      {article.title}
                    </h2>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <p className="text-[0.88rem] text-[#6B5B50] leading-relaxed mb-6">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[0.75rem] text-[#8B7B6E]">
                      <span>{article.date}</span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        {article.readTime}
                      </span>
                    </div>
                    <Link
                      href={`/laboratoire-idees/${article.slug}`}
                      className="group/link inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[#8B4513] hover:text-[#6B3A1F] transition-colors"
                    >
                      Lire
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover/link:translate-x-1"
                      />
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ EDITORIAL DIVIDER ═══════════ */}
      <section className="pb-16 md:pb-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="flex items-center gap-6">
            <div className="h-px flex-1 bg-[#E8E0D4]" />
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] shrink-0">
              Tous les articles
            </p>
            <div className="h-px flex-1 bg-[#E8E0D4]" />
          </div>
        </div>
      </section>

      {/* ═══════════ FILTERS ═══════════ */}
      <section className="pb-12">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap gap-3"
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-5 py-2.5 text-[0.75rem] font-medium uppercase tracking-[0.12em] border transition-all duration-300 ${
                  filter === cat
                    ? "bg-[#8B4513] border-[#8B4513] text-white"
                    : "bg-transparent border-[#D4C4B0] text-[#6B5B50] hover:border-[#8B4513] hover:text-[#8B4513]"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ ARTICLES GRID ═══════════ */}
      <section className="pb-24 md:pb-36">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((article, i) => {
                const Icon = article.icon;
                return (
                  <motion.article
                    key={article.slug}
                    variants={fadeUp}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                    className="group flex flex-col border border-[#E8E0D4] bg-white hover:border-[#C4956A]/40 transition-colors duration-500"
                  >
                    {/* Image */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={article.image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4">
                        <span
                          className={`inline-block px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.15em] text-white ${
                            CATEGORY_COLORS[article.category] || "bg-[#6B5B50]"
                          }`}
                        >
                          {article.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-6 md:p-7">
                      <div className="flex items-center gap-3 mb-4 text-[0.72rem] text-[#8B7B6E]">
                        <span>{article.date}</span>
                        <span className="w-1 h-1 rounded-full bg-[#D4C4B0]" />
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          {article.readTime}
                        </span>
                      </div>

                      <h3 className="font-display text-xl md:text-[1.35rem] font-normal text-[#2C1810] leading-snug mb-3">
                        {article.title}
                      </h3>

                      <p className="text-[0.85rem] text-[#6B5B50] leading-relaxed mb-6 flex-1">
                        {article.excerpt.length > 160
                          ? article.excerpt.slice(0, 160) + "…"
                          : article.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-[#E8E0D4]">
                        <Icon
                          size={18}
                          className="text-[#C4956A]"
                          strokeWidth={1.5}
                        />
                        <Link
                          href={`/laboratoire-idees/${article.slug}`}
                          className="group/link inline-flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#8B4513] hover:text-[#6B3A1F] transition-colors"
                        >
                          Lire l&apos;article
                          <ArrowRight
                            size={13}
                            className="transition-transform group-hover/link:translate-x-1"
                          />
                        </Link>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="font-display text-2xl text-[#D4C4B0] italic mb-2">
                Aucun article dans cette catégorie
              </p>
              <p className="text-[0.85rem] text-[#8B7B6E]">
                De nouveaux contenus seront publiés prochainement.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══════════ NEWSLETTER CTA ═══════════ */}
      <section className="py-20 md:py-28 bg-[#F5F0EB]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#D4C4B0] mb-6">
              <Leaf size={24} className="text-[#8B4513]" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-light text-[#2C1810] leading-[1.2] mb-4">
              Restons en <span className="italic text-[#8B4513]">veille</span>
            </h2>
            <p className="text-[0.92rem] text-[#6B5B50] leading-relaxed mb-8">
              Recevez nos analyses et décryptages sur la transition énergétique
              du bâtiment, directement dans votre boîte mail. Pas de spam,
              uniquement du contenu utile.
            </p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                placeholder="votre@email.fr"
                className="flex-1 border border-[#D4C4B0] bg-white px-4 py-3.5 text-[0.88rem] text-[#2C1810] outline-none focus:border-[#8B4513] placeholder:text-[#B0A090]"
                style={{ background: "white", borderColor: "#D4C4B0" }}
              />
              <button
                type="submit"
                className="bg-[#8B4513] px-6 py-3.5 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#6B3A1F] shrink-0"
              >
                S&apos;abonner
              </button>
            </form>
          </motion.div>
        </div>
      </section>
    </>
  );
}
