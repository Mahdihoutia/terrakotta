import Link from "next/link";
import {
  ArrowUpRight,
  Mail,
  Phone,
  MapPin,
  Zap,
  BadgeCheck,
  Leaf,
  FileCheck2,
  Gauge,
  TrendingDown,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/get-dictionary";
import { ROUTES } from "@/lib/i18n/routes";

const BADGE_ICONS = {
  emmy: FileCheck2,
  bilanCarbone: Gauge,
  sbti: TrendingDown,
  ghg: Leaf,
  go: BadgeCheck,
} as const;

interface Props {
  locale: Locale;
  dict: Dictionary["footer"];
}

export default function Footer({ locale, dict }: Props) {
  const routes = ROUTES[locale];
  const trustBadges = (Object.keys(BADGE_ICONS) as (keyof typeof BADGE_ICONS)[]).map(
    (key) => ({ icon: BADGE_ICONS[key], ...dict.badges[key] }),
  );
  const footerNav = [
    { href: routes.about, label: dict.nav.about },
    { href: routes.services, label: dict.nav.services },
    { href: routes.references, label: dict.nav.references },
    { href: routes.lab, label: dict.nav.lab },
    { href: routes.contact, label: dict.nav.contact },
  ];
  const footerExpertises = [
    { href: routes.cee, label: dict.expertises.cee },
    { href: routes.decarbonation, label: dict.expertises.decarbonation },
    { href: routes.brokerage, label: dict.expertises.brokerage },
  ];

  return (
    <footer className="bg-[#0D1B35] text-[#BFDBFE]">
      {/* CTA Band */}
      <div className="border-b border-[#1B3356]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.2em] text-[#7BAAC8] mb-4">
                {dict.ctaEyebrow}
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-[#EFF6FF] leading-[1.1]">
                {dict.ctaTitle}
                <br />
                <span className="italic text-[#60A5FA]">{dict.ctaTitleAccent}</span>
              </h2>
            </div>
            <Link
              href={routes.contact}
              className="group inline-flex items-center gap-3 border border-[#60A5FA] px-8 py-4 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[#EFF6FF] transition-all duration-300 hover:bg-[#60A5FA] hover:text-[#0D1B35]"
            >
              {dict.ctaButton}
              <ArrowUpRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 mb-6">
              <Zap className="h-6 w-6 rotate-12 fill-[#3B82F6] text-[#3B82F6]" />
              <span className="font-display text-2xl font-bold tracking-[0.08em] text-[#EFF6FF]">
                KILOWATER
              </span>
            </div>
            <p className="text-[0.9rem] leading-relaxed text-[#7BAAC8] max-w-sm">
              {dict.tagline}
            </p>

            {/* Trust badges — compact */}
            <div className="mt-6 max-w-sm">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[#7BAAC8] mb-3">
                {dict.badgesHeading}
              </p>
              <ul className="flex flex-wrap gap-1.5">
                {trustBadges.map(({ icon: Icon, label, sub }) => (
                  <li
                    key={label}
                    title={sub}
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#1B3356] bg-[#0D1B35]/60 px-2 py-1"
                  >
                    <Icon
                      size={11}
                      aria-hidden="true"
                      className="text-[#60A5FA] shrink-0"
                    />
                    <span className="text-[0.65rem] text-[#BFDBFE] leading-none">
                      {label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-2">
            <h3 className="text-[0.7rem] uppercase tracking-[0.2em] text-[#7BAAC8] mb-6">
              {dict.navHeading}
            </h3>
            <ul className="space-y-3">
              {footerNav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.88rem] text-[#BFDBFE] hover:text-[#EFF6FF] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Expertises */}
          <div className="md:col-span-2">
            <h3 className="text-[0.7rem] uppercase tracking-[0.2em] text-[#7BAAC8] mb-6">
              {dict.expertisesHeading}
            </h3>
            <ul className="space-y-3">
              {footerExpertises.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.88rem] text-[#BFDBFE] hover:text-[#EFF6FF] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-3">
            <h3 className="text-[0.7rem] uppercase tracking-[0.2em] text-[#7BAAC8] mb-6">
              {dict.contactHeading}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail size={16} className="mt-1 text-[#60A5FA] shrink-0" />
                <span className="text-[0.88rem]">contact@kilowater.fr</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="mt-1 text-[#60A5FA] shrink-0" />
                <span className="text-[0.88rem]">+33 1 84 16 11 78</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 text-[#60A5FA] shrink-0" />
                <span className="text-[0.88rem]">
                  115 Rue Saint-Dominique, 75007 Paris
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#1B3356]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[0.75rem] text-[#7BAAC8]">
            &copy; {new Date().getFullYear()} Kilowater. {dict.rights}
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.75rem] text-[#7BAAC8]">
            <li>
              <Link href={routes.cookies} className="hover:text-[#BFDBFE] transition-colors">
                {dict.cookies}
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
