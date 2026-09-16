"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Zap,
  ChevronDown,
  LineChart,
  Repeat,
  FileCheck,
  ArrowRight,
  Users,
  Mail,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { ROUTES } from "@/lib/i18n/routes";
import LanguageSwitcher from "@/components/site/LanguageSwitcher";

const DROPDOWN_VIDEO = "https://assets.mixkit.co/videos/34104/34104-720.mp4";

interface Props {
  locale: Locale;
  dict: Dictionary["nav"];
  switcherDict: Dictionary["languageSwitcher"];
}

/** Construit les menus à partir du dictionnaire et des routes de la langue. */
function buildMenus(locale: Locale, dict: Dictionary["nav"]) {
  const routes = ROUTES[locale];
  const prestations = [
    { href: routes.services, ...dict.services.all, icon: Zap, accent: "#2563EB" },
    { href: routes.cee, ...dict.services.cee, icon: FileCheck, accent: "#059669" },
    { href: routes.decarbonation, ...dict.services.decarbonation, icon: LineChart, accent: "#1D4ED8" },
    { href: routes.brokerage, ...dict.services.brokerage, icon: Repeat, accent: "#0EA5E9" },
  ];
  const about = [
    { href: routes.about, ...dict.about.about, icon: Users, accent: "#2563EB" },
    { href: routes.contact, ...dict.about.contact, icon: Mail, accent: "#0EA5E9" },
  ];
  const links = [
    { href: routes.about, label: dict.links.about, dropdown: "about" as const },
    { href: routes.services, label: dict.links.services, dropdown: "prestations" as const },
    { href: routes.references, label: dict.links.references },
    { href: routes.lab, label: dict.links.lab },
  ];
  return { prestations, about, links, routes };
}

/* ─── Animations ─── */
const dropdownVariants = {
  hidden: {
    opacity: 0,
    y: 8,
    scale: 0.98,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    y: 6,
    scale: 0.98,
    transition: { duration: 0.15, ease: "easeIn" as const },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.04 * i, duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function Navbar({ locale, dict, switcherDict }: Props) {
  const pathname = usePathname();
  const {
    prestations: PRESTATIONS_ITEMS,
    about: ABOUT_ITEMS,
    links: NAV_LINKS,
    routes,
  } = buildMenus(locale, dict);
  const isHomepage = pathname === routes.home;
  const [scrolled, setScrolled] = useState(!isHomepage);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState<string | null>(null);
  const [mobileSubmenuKey, setMobileSubmenuKey] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const dropdownRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ─── Scroll handler ─── */
  useEffect(() => {
    if (!isHomepage) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHomepage]);

  /* ─── Body lock on mobile menu ─── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  /* ─── Close dropdown on route change ─── */
  useEffect(() => {
    setOpenDropdownKey(null);
    setMobileOpen(false);
    setMobileSubmenuKey(null);
  }, [pathname]);

  /* ─── Dropdown hover with delay ─── */
  const openDropdown = useCallback((key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdownKey(key);
  }, []);

  const closeDropdown = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpenDropdownKey(null), 180);
  }, []);

  useEffect(() => {
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, []);

  /* ─── Close on click outside ─── */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!openDropdownKey) return;
      const activeRef = dropdownRefs.current[openDropdownKey];
      if (activeRef && !activeRef.contains(e.target as Node)) {
        setOpenDropdownKey(null);
      }
    }
    if (openDropdownKey) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [openDropdownKey]);

  /* ─── Active state helpers ─── */
  const prestationPaths = PRESTATIONS_ITEMS.map((p) => p.href);
  const isPrestationActive = prestationPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  const aboutPaths = ABOUT_ITEMS.map((p) => p.href);
  const isAboutActive = aboutPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_0_rgba(37,99,235,0.08)]"
            : "bg-transparent"
        }`}
      >
        <nav className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 md:px-10 lg:px-16 py-5">
          {/* Logo */}
          <Link href={routes.home} className="group flex items-center gap-2">
            <Zap className="h-6 w-6 rotate-12 fill-[#3B82F6] text-[#3B82F6] transition-transform duration-300 group-hover:rotate-6" />
            <span
              className={`font-display text-[1.45rem] font-bold tracking-[0.08em] transition-colors duration-500 ${
                scrolled ? "text-[#0D1B35]" : "text-white"
              }`}
            >
              KILOWATER
            </span>
          </Link>

          {/* ─── Desktop Nav ─── */}
          <ul className="hidden xl:flex items-center gap-6 2xl:gap-10">
            {NAV_LINKS.map((link) => {
              const isActive =
                link.dropdown === "prestations"
                  ? isPrestationActive
                  : link.dropdown === "about"
                    ? isAboutActive
                    : pathname === link.href || pathname.startsWith(link.href + "/");

              if (link.dropdown) {
                const key = link.dropdown;
                const isOpen = openDropdownKey === key;
                const isPrestations = key === "prestations";
                const items = isPrestations ? PRESTATIONS_ITEMS : ABOUT_ITEMS;

                return (
                  <li
                    key={link.href}
                    className="relative"
                    ref={(el) => { dropdownRefs.current[key] = el; }}
                    onMouseEnter={() => openDropdown(key)}
                    onMouseLeave={closeDropdown}
                  >
                    <button
                      onClick={() => setOpenDropdownKey((k) => (k === key ? null : key))}
                      className={`group relative flex items-center gap-1 whitespace-nowrap text-[0.82rem] font-medium uppercase tracking-[0.14em] transition-colors duration-500 ${
                        scrolled
                          ? "text-[#1D4ED8] hover:text-[#2563EB]"
                          : "text-white/80 hover:text-white"
                      }`}
                    >
                      {link.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                      />
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className={`absolute -bottom-1 left-0 h-[1.5px] w-full ${scrolled ? "bg-[#2563EB]" : "bg-white"}`}
                        />
                      )}
                    </button>

                    {/* ─── Dropdown Panel ─── */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          variants={dropdownVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="absolute left-1/2 top-full pt-4 -translate-x-1/2"
                          style={{ width: isPrestations ? "680px" : "600px" }}
                        >
                          <div className="overflow-hidden rounded-2xl border border-[#E8F0FE] bg-white shadow-[0_25px_60px_-12px_rgba(13,27,53,0.15)]">
                            {isPrestations ? (
                              <div className="grid grid-cols-12">
                                {/* ── Links column ── */}
                                <div className="col-span-7 p-5">
                                  <p className="mb-3 text-[0.65rem] uppercase tracking-[0.2em] text-[#94A3B8]">
                                    {dict.services.heading}
                                  </p>
                                  <div className="space-y-0.5">
                                    {items.map((item, i) => {
                                      const Icon = item.icon;
                                      const isHovered = hoveredItem === i;
                                      return (
                                        <motion.div
                                          key={item.href}
                                          custom={i}
                                          variants={itemVariants}
                                          initial="hidden"
                                          animate="visible"
                                        >
                                          <Link
                                            href={item.href}
                                            onMouseEnter={() => setHoveredItem(i)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                            className={`group/item flex items-start gap-3.5 rounded-xl px-3.5 py-3 transition-all duration-200 ${
                                              isHovered ? "bg-[#F0F7FF]" : "hover:bg-[#F8FBFF]"
                                            }`}
                                          >
                                            <div
                                              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
                                              style={{ backgroundColor: isHovered ? `${item.accent}15` : "#F1F5F9" }}
                                            >
                                              <Icon
                                                size={18}
                                                strokeWidth={1.5}
                                                style={{ color: isHovered ? item.accent : "#64748B" }}
                                                className="transition-colors duration-200"
                                              />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[0.85rem] font-semibold text-[#0D1B35] group-hover/item:text-[#2563EB] transition-colors duration-200">
                                                  {item.label}
                                                </span>
                                                <ArrowRight
                                                  size={12}
                                                  className="opacity-0 -translate-x-1 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:translate-x-0 text-[#2563EB]"
                                                />
                                              </div>
                                              <p className="mt-0.5 text-[0.76rem] leading-snug text-[#64748B]">
                                                {item.desc}
                                              </p>
                                            </div>
                                          </Link>
                                        </motion.div>
                                      );
                                    })}
                                  </div>

                                  <div className="mt-3 border-t border-[#F1F5F9] pt-3">
                                    <Link
                                      href={routes.contact}
                                      className="group/cta flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-[0.78rem] font-semibold text-[#2563EB] transition-colors hover:bg-[#2563EB]/5"
                                    >
                                      {dict.services.contact}
                                      <ArrowRight size={13} className="transition-transform group-hover/cta:translate-x-0.5" />
                                    </Link>
                                  </div>
                                </div>

                                {/* ── Video column ── */}
                                <div className="col-span-5 relative overflow-hidden">
                                  <div className="absolute inset-0">
                                    <video
                                      ref={(el) => { if (el) el.playbackRate = 0.5; }}
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                      className="h-full w-full object-cover"
                                      aria-label={dict.services.videoLabel}
                                    >
                                      <source src={DROPDOWN_VIDEO} type="video/mp4" />
                                    </video>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B35]/80 via-[#0D1B35]/30 to-transparent" />
                                  </div>
                                  <div className="relative flex h-full flex-col justify-end p-5">
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.15, duration: 0.4 }}
                                    >
                                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#93C5FD] mb-1.5">
                                        {dict.services.promo.eyebrow}
                                      </p>
                                      <p className="font-display text-lg font-semibold text-white leading-snug">
                                        {dict.services.promo.title}
                                        <br />
                                        <span className="text-[#60A5FA]">{dict.services.promo.titleAccent}</span>
                                      </p>
                                      <p className="mt-2 text-[0.72rem] leading-relaxed text-[#CBD5E1]">
                                        {dict.services.promo.text}
                                      </p>
                                    </motion.div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* ── About dropdown with video ── */
                              <div className="grid grid-cols-12">
                                <div className="col-span-7 p-5">
                                  <p className="mb-3 text-[0.65rem] uppercase tracking-[0.2em] text-[#94A3B8]">
                                    {dict.about.heading}
                                  </p>
                                  <div className="space-y-0.5">
                                    {items.map((item, i) => {
                                      const Icon = item.icon;
                                      const isHovered = hoveredItem === i;
                                      return (
                                        <motion.div
                                          key={item.href}
                                          custom={i}
                                          variants={itemVariants}
                                          initial="hidden"
                                          animate="visible"
                                        >
                                          <Link
                                            href={item.href}
                                            onMouseEnter={() => setHoveredItem(i)}
                                            onMouseLeave={() => setHoveredItem(null)}
                                            className={`group/item flex items-start gap-3.5 rounded-xl px-3.5 py-3 transition-all duration-200 ${
                                              isHovered ? "bg-[#F0F7FF]" : "hover:bg-[#F8FBFF]"
                                            }`}
                                          >
                                            <div
                                              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
                                              style={{ backgroundColor: isHovered ? `${item.accent}15` : "#F1F5F9" }}
                                            >
                                              <Icon
                                                size={18}
                                                strokeWidth={1.5}
                                                style={{ color: isHovered ? item.accent : "#64748B" }}
                                                className="transition-colors duration-200"
                                              />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-[0.85rem] font-semibold text-[#0D1B35] group-hover/item:text-[#2563EB] transition-colors duration-200">
                                                  {item.label}
                                                </span>
                                                <ArrowRight
                                                  size={12}
                                                  className="opacity-0 -translate-x-1 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:translate-x-0 text-[#2563EB]"
                                                />
                                              </div>
                                              <p className="mt-0.5 text-[0.76rem] leading-snug text-[#64748B]">
                                                {item.desc}
                                              </p>
                                            </div>
                                          </Link>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* ── Video column ── */}
                                <div className="col-span-5 relative overflow-hidden">
                                  <div className="absolute inset-0">
                                    <video
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                      className="h-full w-full object-cover"
                                      aria-label={dict.about.videoLabel}
                                    >
                                      <source src="https://assets.mixkit.co/videos/47738/47738-720.mp4" type="video/mp4" />
                                    </video>
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B35]/85 via-[#0D1B35]/40 to-transparent" />
                                  </div>
                                  <div className="relative flex h-full flex-col justify-end p-5">
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: 0.15, duration: 0.4 }}
                                    >
                                      <p className="text-[0.65rem] uppercase tracking-[0.2em] text-[#93C5FD] mb-1.5">
                                        {dict.about.promo.eyebrow}
                                      </p>
                                      <p className="font-display text-lg font-semibold text-white leading-snug">
                                        {dict.about.promo.title}
                                        <br />
                                        <span className="text-[#60A5FA]">{dict.about.promo.titleAccent}</span>
                                      </p>
                                      <p className="mt-2 text-[0.72rem] leading-relaxed text-[#CBD5E1]">
                                        {dict.about.promo.text}
                                      </p>
                                    </motion.div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              }

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`group relative whitespace-nowrap text-[0.82rem] font-medium uppercase tracking-[0.14em] transition-colors duration-500 ${
                      scrolled
                        ? "text-[#1D4ED8] hover:text-[#2563EB]"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    {link.label}
                    <span
                      className={`absolute -bottom-1 left-0 h-[1.5px] transition-all duration-300 ${
                        isActive ? "w-full" : "w-0 group-hover:w-full"
                      } ${scrolled ? "bg-[#2563EB]" : "bg-white"}`}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Langue + CTA Desktop */}
          <div className="hidden xl:flex items-center gap-5 2xl:gap-6">
            <LanguageSwitcher
              locale={locale}
              dict={switcherDict}
              className={scrolled ? "text-[#1D4ED8]" : "text-white/80"}
            />
            <Link
              href={routes.contact}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-none border px-6 py-2.5 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-white transition-all duration-500 ${
                scrolled
                  ? "border-[#2563EB] bg-[#2563EB] hover:bg-transparent hover:text-[#2563EB]"
                  : "border-white/40 bg-white/10 backdrop-blur-sm hover:bg-white hover:text-[#0D1B35]"
              }`}
            >
              {dict.cta}
            </Link>
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`xl:hidden relative z-50 p-2 transition-colors duration-500 ${
              scrolled ? "text-[#0D1B35]" : "text-white"
            }`}
            aria-label={mobileOpen ? dict.closeMenu : dict.openMenu}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </nav>
      </motion.header>

      {/* ─── Mobile Menu ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-[#F8FBFF] flex flex-col justify-center items-center"
          >
            <nav className="flex flex-col items-center gap-6 w-full px-8">
              {NAV_LINKS.map((link, i) => {
                if (link.dropdown) {
                  const key = link.dropdown;
                  const submenuOpen = mobileSubmenuKey === key;
                  const items = key === "prestations" ? PRESTATIONS_ITEMS : ABOUT_ITEMS;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.4 }}
                      className="w-full max-w-sm text-center"
                    >
                      <button
                        onClick={() => setMobileSubmenuKey((k) => (k === key ? null : key))}
                        className="inline-flex items-center gap-2 font-display text-3xl font-light text-[#0D1B35] hover:text-[#2563EB] transition-colors"
                      >
                        {link.label}
                        <ChevronDown
                          size={20}
                          className={`transition-transform duration-300 ${submenuOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      <AnimatePresence>
                        {submenuOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 space-y-2">
                              {items.map((item, j) => {
                                const Icon = item.icon;
                                return (
                                  <motion.div
                                    key={item.href}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: j * 0.06 }}
                                  >
                                    <Link
                                      href={item.href}
                                      onClick={() => setMobileOpen(false)}
                                      className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm border border-[#E8F0FE] hover:border-[#2563EB]/20 transition-colors"
                                    >
                                      <div
                                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                        style={{ backgroundColor: `${item.accent}12` }}
                                      >
                                        <Icon size={16} style={{ color: item.accent }} strokeWidth={1.5} />
                                      </div>
                                      <div className="text-left">
                                        <p className="text-[0.9rem] font-semibold text-[#0D1B35]">
                                          {item.label}
                                        </p>
                                        <p className="text-[0.72rem] text-[#64748B] leading-snug">
                                          {item.desc}
                                        </p>
                                      </div>
                                    </Link>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="font-display text-3xl font-light text-[#0D1B35] hover:text-[#2563EB] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.08, duration: 0.4 }}
              >
                <Link
                  href={routes.contact}
                  onClick={() => setMobileOpen(false)}
                  className="mt-4 inline-flex border border-[#2563EB] bg-[#2563EB] px-8 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-white"
                >
                  {dict.cta}
                </Link>
              </motion.div>

              <LanguageSwitcher
                locale={locale}
                dict={switcherDict}
                align="center"
                className="mt-2 text-[#1D4ED8]"
              />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
