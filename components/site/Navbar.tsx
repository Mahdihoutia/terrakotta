"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/nos-prestations", label: "Nos prestations" },
  { href: "/nos-references", label: "Nos références" },
  { href: "/laboratoire-idees", label: "Laboratoire d'idées" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(139,69,19,0.08)]"
            : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-[1400px] items-center justify-between px-6 md:px-10 lg:px-16 py-5">
          {/* Logo / Wordmark */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="h-8 w-8 rounded-sm bg-[#8B4513] transition-transform duration-300 group-hover:rotate-6" />
              <div className="absolute inset-0 h-8 w-8 rounded-sm border border-[#8B4513]/30 translate-x-1 translate-y-1 transition-transform duration-300 group-hover:translate-x-1.5 group-hover:translate-y-1.5" />
            </div>
            <span className={`font-display text-[1.35rem] font-semibold tracking-[0.02em] transition-colors duration-500 ${
              scrolled ? "text-[#2C1810]" : "text-white"
            }`}>
              TERRAKOTTA
            </span>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-10">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`group relative text-[0.82rem] font-medium uppercase tracking-[0.14em] transition-colors duration-500 ${
                    scrolled
                      ? "text-[#5C4033] hover:text-[#8B4513]"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                  <span className={`absolute -bottom-1 left-0 h-[1.5px] w-0 transition-all duration-300 group-hover:w-full ${
                    scrolled ? "bg-[#8B4513]" : "bg-white"
                  }`} />
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA Desktop */}
          <Link
            href="/contactez-nous"
            className={`hidden lg:inline-flex items-center gap-2 rounded-none border px-6 py-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-white transition-all duration-500 ${
              scrolled
                ? "border-[#8B4513] bg-[#8B4513] hover:bg-transparent hover:text-[#8B4513]"
                : "border-white/40 bg-white/10 backdrop-blur-sm hover:bg-white hover:text-[#2C1810]"
            }`}
          >
            Démarrer un projet
          </Link>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden relative z-50 p-2 transition-colors duration-500 ${
              scrolled ? "text-[#2C1810]" : "text-white"
            }`}
            aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-[#FAF8F5] flex flex-col justify-center items-center"
          >
            <nav className="flex flex-col items-center gap-8">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-display text-3xl font-light text-[#2C1810] hover:text-[#8B4513] transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.08, duration: 0.4 }}
              >
                <Link
                  href="/contactez-nous"
                  onClick={() => setMobileOpen(false)}
                  className="mt-4 inline-flex border border-[#8B4513] bg-[#8B4513] px-8 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white"
                >
                  Démarrer un projet
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
