"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Award, Leaf, Users, Target, CheckCircle } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const VALEURS = [
  {
    icon: Target,
    title: "Exigence",
    desc: "Chaque projet est traité avec la rigueur et la précision d'un bureau d'étude de référence. Pas de compromis sur la qualité.",
  },
  {
    icon: Leaf,
    title: "Durabilité",
    desc: "Nous concevons des rénovations pérennes, avec des solutions qui font sens sur le plan environnemental et économique.",
  },
  {
    icon: Users,
    title: "Proximité",
    desc: "Un interlocuteur unique, disponible et transparent. Nous croyons que la confiance se construit dans l'échange.",
  },
  {
    icon: Award,
    title: "Expertise",
    desc: "Qualifications RGE, certifications et formation continue. Notre équipe maîtrise les évolutions réglementaires et techniques.",
  },
];

const CERTIFICATIONS = [
  "RGE — Reconnu Garant de l'Environnement",
  "Audit énergétique réglementaire",
  "Études thermiques RT 2012 / RE 2020",
  "DPE — Diagnostic de Performance Énergétique",
  "Certificats d'Économies d'Énergie (CEE)",
];

export default function QuiSommesNousPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end"
          >
            <div className="lg:col-span-7">
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] mb-4">
                Qui sommes-nous
              </p>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-[#2C1810] leading-[1.05]">
                Un bureau d&apos;étude
                <br />
                <span className="italic text-[#8B4513]">engagé</span>
              </h1>
            </div>
            <div className="lg:col-span-4 lg:col-start-9">
              <p className="text-[0.95rem] text-[#6B5B50] leading-relaxed">
                Fondé par des ingénieurs passionnés par la performance du bâti,
                Terrakotta accompagne la transition énergétique du parc immobilier
                français avec exigence et humanité.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Image + Texte */}
      <section className="pb-24 md:pb-36">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 relative aspect-[4/3] overflow-hidden"
            >
              <Image
                src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1200&q=80"
                alt="Architectes et maîtres d'œuvre collaborant sur un projet"
                fill
                className="object-cover"
              />
              {/* Decorative overlay corner */}
              <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-[#C4956A]/40 m-6" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 flex flex-col justify-center"
            >
              <div className="border-l-2 border-[#8B4513] pl-8 mb-10">
                <h2 className="font-display text-3xl md:text-4xl font-light text-[#2C1810] mb-6 leading-snug">
                  La rénovation énergétique est un acte
                  <span className="italic text-[#8B4513]"> technique</span>,
                  mais surtout un acte de
                  <span className="italic text-[#8B4513]"> responsabilité</span>.
                </h2>
              </div>
              <p className="text-[0.92rem] text-[#6B5B50] leading-[1.8] mb-6">
                Depuis notre création, nous avons accompagné plus de 150 projets
                de rénovation — des maisons individuelles aux copropriétés, des
                bâtiments tertiaires aux équipements publics.
              </p>
              <p className="text-[0.92rem] text-[#6B5B50] leading-[1.8]">
                Notre approche repose sur un diagnostic rigoureux, une conception
                technico-économique optimisée et un suivi de chantier sans faille.
                Chaque bâtiment mérite une solution sur mesure.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="py-24 md:py-36 bg-[#F5F0EB]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-20"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] mb-4">
              Nos valeurs
            </p>
            <h2 className="font-display text-4xl md:text-5xl font-light text-[#2C1810] leading-[1.1]">
              Ce qui nous <span className="italic text-[#8B4513]">guide</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#E8E0D4]">
            {VALEURS.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="bg-[#F5F0EB] p-8 md:p-10 text-center hover:bg-white transition-colors duration-500"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#D4C4B0] mb-6">
                  <v.icon size={24} className="text-[#8B4513]" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-xl font-normal text-[#2C1810] mb-3">
                  {v.title}
                </h3>
                <p className="text-[0.85rem] text-[#6B5B50] leading-relaxed">
                  {v.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-24 md:py-36">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="lg:col-span-5"
            >
              <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] mb-4">
                Qualifications
              </p>
              <h2 className="font-display text-4xl md:text-5xl font-light text-[#2C1810] leading-[1.1] mb-6">
                Des compétences
                <br />
                <span className="italic text-[#8B4513]">certifiées</span>
              </h2>
              <p className="text-[0.92rem] text-[#6B5B50] leading-relaxed">
                Nos qualifications garantissent à nos clients un niveau
                d&apos;expertise reconnu par les organismes officiels et
                indispensable pour l&apos;obtention des aides financières.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-6 lg:col-start-7"
            >
              <ul className="space-y-5">
                {CERTIFICATIONS.map((cert) => (
                  <li
                    key={cert}
                    className="flex items-start gap-4 border-b border-[#E8E0D4] pb-5"
                  >
                    <CheckCircle
                      size={20}
                      className="text-[#8B4513] mt-0.5 shrink-0"
                      strokeWidth={1.5}
                    />
                    <span className="text-[0.92rem] text-[#2C1810]">{cert}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
