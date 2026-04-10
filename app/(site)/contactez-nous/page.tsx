"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, ArrowRight, CheckCircle } from "lucide-react";

const COORDONNEES = [
  {
    icon: Mail,
    label: "Email",
    value: "contact@terrakotta.fr",
    href: "mailto:contact@terrakotta.fr",
  },
  {
    icon: Phone,
    label: "Téléphone",
    value: "+33 1 84 16 11 78",
    href: "tel:+33184161178",
  },
  {
    icon: MapPin,
    label: "Adresse",
    value: "115 Rue Saint-Dominique, 75007 Paris",
  },
  {
    icon: Clock,
    label: "Horaires",
    value: "Lun – Ven : 9h00 – 18h00",
  },
];

const TYPES_PROJET = [
  "Audit énergétique",
  "Maîtrise d'œuvre & AMO",
  "Accompagnement aides",
  "Étude thermique",
  "Conseil patrimonial",
  "Autre",
];

export default function ContactezNousPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Anti-spam : honeypot
    if (formData.get("website")) return;

    const typeProjet = formData.get("type") as string;
    const message = formData.get("message") as string;
    const notes = [
      typeProjet ? `Type de projet : ${typeProjet}` : "",
      message,
    ]
      .filter(Boolean)
      .join("\n\n");

    setSending(true);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.get("nom"),
          prenom: formData.get("prenom") || undefined,
          email: formData.get("email"),
          telephone: formData.get("telephone") || undefined,
          raisonSociale: formData.get("raisonSociale") || undefined,
          fonction: formData.get("fonction") || undefined,
          source: "SITE_WEB",
          statut: "NOUVEAU",
          notes,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'envoi");
      }

      setSubmitted(true);
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer ou nous contacter par téléphone.");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#8B4513] mb-4">
              Contact
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-[#2C1810] leading-[1.05] mb-8">
              Parlons de votre
              <br />
              <span className="italic text-[#8B4513]">projet</span>
            </h1>
            <p className="text-[1rem] text-[#6B5B50] leading-relaxed max-w-xl">
              Que vous soyez particulier, professionnel ou collectivité,
              décrivez-nous votre besoin. Nous vous répondons sous 48h.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form + Coordonnées */}
      <section className="pb-24 md:pb-36">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-7"
            >
              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border border-[#E8E0D4] bg-white p-12 md:p-16 text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#8B4513]/10 mb-6">
                    <CheckCircle size={32} className="text-[#8B4513]" />
                  </div>
                  <h2 className="font-display text-3xl font-light text-[#2C1810] mb-4">
                    Message envoyé
                  </h2>
                  <p className="text-[0.95rem] text-[#6B5B50] leading-relaxed max-w-md mx-auto">
                    Merci pour votre message. Nous vous répondrons dans les
                    plus brefs délais, généralement sous 48h ouvrées.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Honeypot */}
                  <div className="hidden" aria-hidden="true">
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="nom"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#6B5B50] mb-2"
                      >
                        Nom *
                      </label>
                      <input
                        id="nom"
                        name="nom"
                        type="text"
                        required
                        className="w-full border border-[#D4C4B0] bg-white px-4 py-3.5 text-[0.9rem] text-[#2C1810] outline-none transition-colors focus:border-[#8B4513] placeholder:text-[#B0A090]"
                        placeholder="Votre nom"
                        style={{ background: "white", borderColor: "#D4C4B0" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="prenom"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#6B5B50] mb-2"
                      >
                        Prénom *
                      </label>
                      <input
                        id="prenom"
                        name="prenom"
                        type="text"
                        required
                        className="w-full border border-[#D4C4B0] bg-white px-4 py-3.5 text-[0.9rem] text-[#2C1810] outline-none transition-colors focus:border-[#8B4513] placeholder:text-[#B0A090]"
                        placeholder="Votre prénom"
                        style={{ background: "white", borderColor: "#D4C4B0" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#6B5B50] mb-2"
                      >
                        Email *
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full border border-[#D4C4B0] bg-white px-4 py-3.5 text-[0.9rem] text-[#2C1810] outline-none transition-colors focus:border-[#8B4513] placeholder:text-[#B0A090]"
                        placeholder="votre@email.fr"
                        style={{ background: "white", borderColor: "#D4C4B0" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="telephone"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#6B5B50] mb-2"
                      >
                        Téléphone
                      </label>
                      <input
                        id="telephone"
                        name="telephone"
                        type="tel"
                        className="w-full border border-[#D4C4B0] bg-white px-4 py-3.5 text-[0.9rem] text-[#2C1810] outline-none transition-colors focus:border-[#8B4513] placeholder:text-[#B0A090]"
                        placeholder="06 XX XX XX XX"
                        style={{ background: "white", borderColor: "#D4C4B0" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="raisonSociale"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#6B5B50] mb-2"
                      >
                        Raison sociale
                      </label>
                      <input
                        id="raisonSociale"
                        name="raisonSociale"
                        type="text"
                        className="w-full border border-[#D4C4B0] bg-white px-4 py-3.5 text-[0.9rem] text-[#2C1810] outline-none transition-colors focus:border-[#8B4513] placeholder:text-[#B0A090]"
                        placeholder="Nom de l'entreprise"
                        style={{ background: "white", borderColor: "#D4C4B0" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="fonction"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#6B5B50] mb-2"
                      >
                        Fonction
                      </label>
                      <input
                        id="fonction"
                        name="fonction"
                        type="text"
                        className="w-full border border-[#D4C4B0] bg-white px-4 py-3.5 text-[0.9rem] text-[#2C1810] outline-none transition-colors focus:border-[#8B4513] placeholder:text-[#B0A090]"
                        placeholder="Votre poste"
                        style={{ background: "white", borderColor: "#D4C4B0" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="type"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#6B5B50] mb-2"
                      >
                        Type de projet
                      </label>
                      <select
                        id="type"
                        name="type"
                        className="w-full border border-[#D4C4B0] bg-white px-4 py-3.5 text-[0.9rem] text-[#2C1810] outline-none transition-colors focus:border-[#8B4513] appearance-none"
                        style={{ background: "white", borderColor: "#D4C4B0" }}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Sélectionnez
                        </option>
                        {TYPES_PROJET.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#6B5B50] mb-2"
                    >
                      Votre message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      className="w-full border border-[#D4C4B0] bg-white px-4 py-3.5 text-[0.9rem] text-[#2C1810] outline-none transition-colors focus:border-[#8B4513] placeholder:text-[#B0A090] resize-none"
                      placeholder="Décrivez votre projet, le type de bâtiment, vos objectifs..."
                      style={{ background: "white", borderColor: "#D4C4B0" }}
                    />
                  </div>

                  {error && (
                    <p className="text-[0.85rem] text-red-600 bg-red-50 border border-red-200 px-4 py-3">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={sending}
                    className="group inline-flex items-center gap-3 bg-[#8B4513] px-10 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#6B3A1F] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending ? "Envoi en cours…" : "Envoyer le message"}
                    {!sending && (
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover:translate-x-1"
                      />
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Coordonnées */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="lg:col-span-4 lg:col-start-9"
            >
              <div className="border border-[#E8E0D4] bg-[#F5F0EB] p-8 md:p-10">
                <h2 className="font-display text-2xl font-normal text-[#2C1810] mb-8">
                  Nos coordonnées
                </h2>
                <ul className="space-y-6">
                  {COORDONNEES.map((c) => (
                    <li key={c.label} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full border border-[#D4C4B0] flex items-center justify-center shrink-0 mt-0.5">
                        <c.icon size={18} className="text-[#8B4513]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[0.72rem] uppercase tracking-[0.15em] text-[#8B7B6E] mb-1">
                          {c.label}
                        </p>
                        {c.href ? (
                          <a
                            href={c.href}
                            className="text-[0.9rem] text-[#2C1810] hover:text-[#8B4513] transition-colors"
                          >
                            {c.value}
                          </a>
                        ) : (
                          <p className="text-[0.9rem] text-[#2C1810]">
                            {c.value}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Note */}
              <div className="mt-8 border-l-2 border-[#8B4513] pl-6">
                <p className="text-[0.85rem] text-[#6B5B50] leading-relaxed italic">
                  Nous nous engageons à vous répondre sous 48 heures ouvrées.
                  Pour les demandes urgentes, n&apos;hésitez pas à nous
                  appeler directement.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
