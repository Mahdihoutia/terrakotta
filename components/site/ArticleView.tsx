"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowLeft, ArrowRight } from "lucide-react";
import { CATEGORY_COLORS, type ArticleSummary } from "@/lib/articles";
import type { Locale } from "@/lib/i18n/config";
import type { LabContent } from "@/lib/i18n/content/lab";
import { ROUTES } from "@/lib/i18n/routes";

/* ─────────── Animation ─────────── */
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const stagger = {
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

interface Props {
  locale: Locale;
  content: LabContent;
  article: ArticleSummary;
  /** Corps de l'article déjà converti en HTML côté serveur. */
  contentHtml: string;
  related: ArticleSummary[];
}

/* ─────────── Page ─────────── */
export default function ArticleView({ locale, content, article, contentHtml, related }: Props) {
  const labHref = ROUTES[locale].lab;

  return (
    <>
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative">
        {/* Image */}
        <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <Image
            src={article.image}
            alt={article.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>

        {/* Content over image */}
        <div className="absolute inset-0 flex items-end">
          <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10 lg:px-16 pb-12 md:pb-16">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="max-w-3xl"
            >
              <motion.div variants={fadeIn}>
                <span
                  className={`inline-block px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.15em] text-white mb-5 ${
                    CATEGORY_COLORS[article.category] || "bg-[#6B5B50]"
                  }`}
                >
                  {content.categories[article.category]}
                </span>
              </motion.div>

              <motion.h1
                variants={fadeIn}
                className="font-display text-3xl md:text-5xl lg:text-6xl font-light text-white leading-[1.1] mb-5"
              >
                {article.title}
              </motion.h1>

              <motion.div
                variants={fadeIn}
                className="flex items-center gap-4 text-[0.8rem] text-white/80"
              >
                <span>{article.date}</span>
                <span className="w-1 h-1 rounded-full bg-white/40" />
                <span className="flex items-center gap-1.5">
                  <Clock size={14} />
                  {article.readTime}
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ ARTICLE BODY ═══════════ */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="max-w-3xl mx-auto">
            {/* Back link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mb-12"
            >
              <Link
                href={labHref}
                className="inline-flex items-center gap-2 text-[0.78rem] font-medium uppercase tracking-[0.12em] text-[#8B4513] hover:text-[#6B3A1F] transition-colors"
              >
                <ArrowLeft size={14} />
                {content.article.back}
              </Link>
            </motion.div>

            {/* Excerpt */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-[1.15rem] leading-[1.8] text-[#6B5B50] font-light mb-12 pb-12 border-b border-[#E8E0D4]"
            >
              {article.excerpt}
            </motion.p>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="prose-kilowater"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </div>
        </div>
      </section>

      {/* ═══════════ RELATED ARTICLES ═══════════ */}
      {related.length > 0 && (
        <section className="py-20 md:py-28 bg-[#F5F0EB]">
          <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-center gap-6 mb-2">
                <div className="h-px flex-1 bg-[#D4C4B0]" />
                <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] shrink-0">
                  {content.article.related}
                </p>
                <div className="h-px flex-1 bg-[#D4C4B0]" />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rel, i) => (
                <motion.article
                  key={rel.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.1,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1] as const,
                  }}
                  className="group bg-white border border-[#E8E0D4] hover:border-[#C4956A]/40 transition-colors duration-500"
                >
                  <Link href={`${labHref}/${rel.slug}`} className="block">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={rel.image}
                        alt={rel.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute top-4 left-4">
                        <span
                          className={`inline-block px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.15em] text-white ${
                            CATEGORY_COLORS[rel.category] || "bg-[#6B5B50]"
                          }`}
                        >
                          {content.categories[rel.category]}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3 text-[0.72rem] text-[#8B7B6E]">
                      <span>{rel.date}</span>
                      <span className="w-1 h-1 rounded-full bg-[#D4C4B0]" />
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {rel.readTime}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-normal text-[#2C1810] leading-snug mb-4">
                      <Link
                        href={`${labHref}/${rel.slug}`}
                        className="hover:text-[#8B4513] transition-colors"
                      >
                        {rel.title}
                      </Link>
                    </h3>
                    <Link
                      href={`${labHref}/${rel.slug}`}
                      className="group/link inline-flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-[#8B4513] hover:text-[#6B3A1F] transition-colors"
                    >
                      {content.read}
                      <ArrowRight
                        size={13}
                        className="transition-transform group-hover/link:translate-x-1"
                      />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
