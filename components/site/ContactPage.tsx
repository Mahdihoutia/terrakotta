"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, ArrowRight, CheckCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";

interface Props {
  locale: Locale;
  dict: Dictionary["contact"];
  /** Valeurs envoyées à l'API : libellés FR, pour garder des leads homogènes dans le dashboard. */
  projectTypeValues: string[];
}

export default function ContactPage({ locale, dict, projectTypeValues }: Props) {
  const contactDetails = [
    {
      icon: Mail,
      label: dict.details.email,
      value: "contact@kilowater.fr",
      href: "mailto:contact@kilowater.fr",
    },
    {
      icon: Phone,
      label: dict.details.phone,
      value: "+33 1 84 16 11 78",
      href: "tel:+33184161178",
    },
    {
      icon: MapPin,
      label: dict.details.address,
      value: dict.details.addressValue,
    },
    {
      icon: Clock,
      label: dict.details.hours,
      value: dict.details.hoursValue,
    },
  ];
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

    setSending(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: formData.get("nom"),
          prenom: formData.get("prenom") || undefined,
          email: formData.get("email"),
          telephone: formData.get("telephone") || undefined,
          raisonSociale: formData.get("raisonSociale") || undefined,
          fonction: formData.get("fonction") || undefined,
          typeProjet: (formData.get("type") as string) || undefined,
          message: formData.get("message"),
          locale,
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'envoi");
      }

      setSubmitted(true);
    } catch {
      setError(dict.form.error);
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
            <p className="text-[0.72rem] uppercase tracking-[0.25em] text-[#2563EB] mb-4">
              {dict.hero.eyebrow}
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-light text-[#0D1B35] leading-[1.05] mb-8">
              {dict.hero.title}
              <br />
              <span className="italic text-[#2563EB]">{dict.hero.titleAccent}</span>
            </h1>
            <p className="text-[1rem] text-[#4A6285] leading-relaxed max-w-xl">
              {dict.hero.intro}
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
                  className="border border-[#DBEAFE] bg-white p-12 md:p-16 text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2563EB]/10 mb-6">
                    <CheckCircle size={32} className="text-[#2563EB]" />
                  </div>
                  <h2 className="font-display text-3xl font-light text-[#0D1B35] mb-4">
                    {dict.success.title}
                  </h2>
                  <p className="text-[0.95rem] text-[#4A6285] leading-relaxed max-w-md mx-auto">
                    {dict.success.text}
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
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#4A6285] mb-2"
                      >
                        {dict.form.lastName.label}
                      </label>
                      <input
                        id="nom"
                        name="nom"
                        type="text"
                        required
                        className="w-full border border-[#BFDBFE] bg-white px-4 py-3.5 text-[0.9rem] text-[#0D1B35] outline-none transition-colors focus:border-[#2563EB] placeholder:text-[#BAD0E8]"
                        placeholder={dict.form.lastName.placeholder}
                        style={{ background: "white", borderColor: "#BFDBFE" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="prenom"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#4A6285] mb-2"
                      >
                        {dict.form.firstName.label}
                      </label>
                      <input
                        id="prenom"
                        name="prenom"
                        type="text"
                        required
                        className="w-full border border-[#BFDBFE] bg-white px-4 py-3.5 text-[0.9rem] text-[#0D1B35] outline-none transition-colors focus:border-[#2563EB] placeholder:text-[#BAD0E8]"
                        placeholder={dict.form.firstName.placeholder}
                        style={{ background: "white", borderColor: "#BFDBFE" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#4A6285] mb-2"
                      >
                        {dict.form.email.label}
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full border border-[#BFDBFE] bg-white px-4 py-3.5 text-[0.9rem] text-[#0D1B35] outline-none transition-colors focus:border-[#2563EB] placeholder:text-[#BAD0E8]"
                        placeholder={dict.form.email.placeholder}
                        style={{ background: "white", borderColor: "#BFDBFE" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="telephone"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#4A6285] mb-2"
                      >
                        {dict.form.phone.label}
                      </label>
                      <input
                        id="telephone"
                        name="telephone"
                        type="tel"
                        className="w-full border border-[#BFDBFE] bg-white px-4 py-3.5 text-[0.9rem] text-[#0D1B35] outline-none transition-colors focus:border-[#2563EB] placeholder:text-[#BAD0E8]"
                        placeholder={dict.form.phone.placeholder}
                        style={{ background: "white", borderColor: "#BFDBFE" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="raisonSociale"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#4A6285] mb-2"
                      >
                        {dict.form.company.label}
                      </label>
                      <input
                        id="raisonSociale"
                        name="raisonSociale"
                        type="text"
                        className="w-full border border-[#BFDBFE] bg-white px-4 py-3.5 text-[0.9rem] text-[#0D1B35] outline-none transition-colors focus:border-[#2563EB] placeholder:text-[#BAD0E8]"
                        placeholder={dict.form.company.placeholder}
                        style={{ background: "white", borderColor: "#BFDBFE" }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="fonction"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#4A6285] mb-2"
                      >
                        {dict.form.jobTitle.label}
                      </label>
                      <input
                        id="fonction"
                        name="fonction"
                        type="text"
                        className="w-full border border-[#BFDBFE] bg-white px-4 py-3.5 text-[0.9rem] text-[#0D1B35] outline-none transition-colors focus:border-[#2563EB] placeholder:text-[#BAD0E8]"
                        placeholder={dict.form.jobTitle.placeholder}
                        style={{ background: "white", borderColor: "#BFDBFE" }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="type"
                        className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#4A6285] mb-2"
                      >
                        {dict.form.projectType.label}
                      </label>
                      <select
                        id="type"
                        name="type"
                        className="w-full border border-[#BFDBFE] bg-white px-4 py-3.5 text-[0.9rem] text-[#0D1B35] outline-none transition-colors focus:border-[#2563EB] appearance-none"
                        style={{ background: "white", borderColor: "#BFDBFE" }}
                        defaultValue=""
                      >
                        <option value="" disabled>
                          {dict.form.projectType.placeholder}
                        </option>
                        {projectTypeValues.map((value, i) => (
                          <option key={value} value={value}>
                            {dict.form.projectTypes[i] ?? value}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-[0.75rem] uppercase tracking-[0.15em] text-[#4A6285] mb-2"
                    >
                      {dict.form.message.label}
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      className="w-full border border-[#BFDBFE] bg-white px-4 py-3.5 text-[0.9rem] text-[#0D1B35] outline-none transition-colors focus:border-[#2563EB] placeholder:text-[#BAD0E8] resize-none"
                      placeholder={dict.form.message.placeholder}
                      style={{ background: "white", borderColor: "#BFDBFE" }}
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
                    className="group inline-flex items-center gap-3 bg-[#2563EB] px-10 py-4 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:bg-[#1E40AF] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {sending ? dict.form.sending : dict.form.submit}
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
              <div className="border border-[#DBEAFE] bg-[#F5FAFF] p-8 md:p-10">
                <h2 className="font-display text-2xl font-normal text-[#0D1B35] mb-8">
                  {dict.details.heading}
                </h2>
                <ul className="space-y-6">
                  {contactDetails.map((c) => (
                    <li key={c.label} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full border border-[#BFDBFE] flex items-center justify-center shrink-0 mt-0.5">
                        <c.icon size={18} className="text-[#2563EB]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[0.72rem] uppercase tracking-[0.15em] text-[#94A3B8] mb-1">
                          {c.label}
                        </p>
                        {c.href ? (
                          <a
                            href={c.href}
                            className="text-[0.9rem] text-[#0D1B35] hover:text-[#2563EB] transition-colors"
                          >
                            {c.value}
                          </a>
                        ) : (
                          <p className="text-[0.9rem] text-[#0D1B35]">
                            {c.value}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Note */}
              <div className="mt-8 border-l-2 border-[#2563EB] pl-6">
                <p className="text-[0.85rem] text-[#4A6285] leading-relaxed italic">
                  {dict.details.note}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
