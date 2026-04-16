import Link from "next/link";
import { ArrowUpRight, Mail, Phone, MapPin, Zap } from "lucide-react";

const FOOTER_NAV = [
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/nos-prestations", label: "Nos prestations" },
  { href: "/nos-references", label: "Nos références" },
  { href: "/laboratoire-idees", label: "Laboratoire d'idées" },
  { href: "/contactez-nous", label: "Contactez-nous" },
];

const FOOTER_EXPERTISES = [
  { href: "/bureau-d-etude-renovation-energetique", label: "Bureau d'étude" },
  { href: "/audit-energetique", label: "Audit énergétique" },
  { href: "/accompagnement-cee", label: "Accompagnement CEE" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0D1B35] text-[#BFDBFE]">
      {/* CTA Band */}
      <div className="border-b border-[#1B3356]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.2em] text-[#7BAAC8] mb-4">
                Prêt à transformer votre bâtiment ?
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-[#EFF6FF] leading-[1.1]">
                Parlons de votre
                <br />
                <span className="italic text-[#60A5FA]">projet</span>
              </h2>
            </div>
            <Link
              href="/contactez-nous"
              className="group inline-flex items-center gap-3 border border-[#60A5FA] px-8 py-4 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[#EFF6FF] transition-all duration-300 hover:bg-[#60A5FA] hover:text-[#0D1B35]"
            >
              Contactez-nous
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
              Bureau d&apos;étude spécialisé en rénovation énergétique.
              Nous accompagnons particuliers, professionnels et collectivités
              vers un bâti plus performant et durable.
            </p>
          </div>

          {/* Navigation */}
          <div className="md:col-span-2">
            <h3 className="text-[0.7rem] uppercase tracking-[0.2em] text-[#7BAAC8] mb-6">
              Navigation
            </h3>
            <ul className="space-y-3">
              {FOOTER_NAV.map((link) => (
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
              Expertises
            </h3>
            <ul className="space-y-3">
              {FOOTER_EXPERTISES.map((link) => (
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
              Contact
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
          <p className="text-[0.75rem] text-[#5E80A8]">
            &copy; {new Date().getFullYear()} Kilowater. Tous droits réservés.
          </p>
          <p className="text-[0.75rem] text-[#5E80A8]">
            Bureau d&apos;étude en rénovation énergétique
          </p>
        </div>
      </div>
    </footer>
  );
}
