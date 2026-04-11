"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowRight, Leaf } from "lucide-react";
import {
  ARTICLES,
  CATEGORIES,
  CATEGORY_COLORS,
  type Category,
} from "@/lib/articles";

/* ─────────── Animation ─────────── */
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
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
              Laboratoire d&apos;idées
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-[#0D1B35] leading-[1.05] mb-8">
              Penser le bâti
              <br />
              <span className="italic text-[#2563EB]">autrement</span>
            </h1>
            <p className="text-[1rem] text-[#4A6285] leading-relaxed max-w-xl">
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
                className="group relative overflow-hidden bg-white border border-[#DBEAFE] hover:border-[#60A5FA]/40 transition-colors duration-500"
              >
                <Link href={`/laboratoire-idees/${article.slug}`} className="block">
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
                          CATEGORY_COLORS[article.category] || "bg-[#4A6285]"
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
                </Link>
                <div className="p-6 md:p-8">
                  <p className="text-[0.88rem] text-[#4A6285] leading-relaxed mb-6">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[0.75rem] text-[#94A3B8]">
                      <span>{article.date}</span>
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        {article.readTime}
                      </span>
                    </div>
                    <Link
                      href={`/laboratoire-idees/${article.slug}`}
                      className="group/link inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[#2563EB] hover:text-[#1E40AF] transition-colors"
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
            <div className="h-px flex-1 bg-[#DBEAFE]" />
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] shrink-0">
              Tous les articles
            </p>
            <div className="h-px flex-1 bg-[#DBEAFE]" />
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
                    ? "bg-[#2563EB] border-[#2563EB] text-white"
                    : "bg-transparent border-[#BFDBFE] text-[#4A6285] hover:border-[#2563EB] hover:text-[#2563EB]"
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
                    className="group flex flex-col border border-[#DBEAFE] bg-white hover:border-[#60A5FA]/40 transition-colors duration-500"
                  >
                    {/* Image */}
                    <Link href={`/laboratoire-idees/${article.slug}`} className="block">
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
                              CATEGORY_COLORS[article.category] || "bg-[#4A6285]"
                            }`}
                          >
                            {article.category}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="flex flex-col flex-1 p-6 md:p-7">
                      <div className="flex items-center gap-3 mb-4 text-[0.72rem] text-[#94A3B8]">
                        <span>{article.date}</span>
                        <span className="w-1 h-1 rounded-full bg-[#BFDBFE]" />
                        <span className="flex items-center gap-1.5">
                          <Clock size={12} />
                          {article.readTime}
                        </span>
                      </div>

                      <h3 className="font-display text-xl md:text-[1.35rem] font-normal text-[#0D1B35] leading-snug mb-3">
                        <Link
                          href={`/laboratoire-idees/${article.slug}`}
                          className="hover:text-[#2563EB] transition-colors"
                        >
                          {article.title}
                        </Link>
                      </h3>

                      <p className="text-[0.85rem] text-[#4A6285] leading-relaxed mb-6 flex-1">
                        {article.excerpt.length > 160
                          ? article.excerpt.slice(0, 160) + "\u2026"
                          : article.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-[#DBEAFE]">
                        <Icon
                          size={18}
                          className="text-[#60A5FA]"
                          strokeWidth={1.5}
                        />
                        <Link
                          href={`/laboratoire-idees/${article.slug}`}
                          className="group/link inline-flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#2563EB] hover:text-[#1E40AF] transition-colors"
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
              <p className="font-display text-2xl text-[#BFDBFE] italic mb-2">
                Aucun article dans cette catégorie
              </p>
              <p className="text-[0.85rem] text-[#94A3B8]">
                De nouveaux contenus seront publiés prochainement.
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* ═══════════ NEWSLETTER CTA ═══════════ */}
      <section className="py-20 md:py-28 bg-[#F5FAFF]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#BFDBFE] mb-6">
              <Leaf size={24} className="text-[#2563EB]" strokeWidth={1.5} />
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-light text-[#0D1B35] leading-[1.2] mb-4">
              Restons en <span className="italic text-[#2563EB]">veille</span>
            </h2>
            <p className="text-[0.92rem] text-[#4A6285] leading-relaxed mb-8">
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
                className="flex-1 border border-[#BFDBFE] bg-white px-4 py-3.5 text-[0.88rem] text-[#0D1B35] outline-none focus:border-[#2563EB] placeholder:text-[#BAD0E8]"
                style={{ background: "white", borderColor: "#BFDBFE" }}
              />
              <button
                type="submit"
                className="bg-[#2563EB] px-6 py-3.5 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[#1E40AF] shrink-0"
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
