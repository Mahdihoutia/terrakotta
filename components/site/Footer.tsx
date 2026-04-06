import Link from "next/link";
import { ArrowUpRight, Mail, Phone, MapPin } from "lucide-react";

const FOOTER_LINKS = [
  { href: "/qui-sommes-nous", label: "Qui sommes-nous" },
  { href: "/nos-prestations", label: "Nos prestations" },
  { href: "/nos-references", label: "Nos références" },
  { href: "/laboratoire-idees", label: "Laboratoire d'idées" },
  { href: "/contactez-nous", label: "Contactez-nous" },
];

export default function Footer() {
  return (
    <footer className="bg-[#2C1810] text-[#D4C4B0]">
      {/* CTA Band */}
      <div className="border-b border-[#4A3728]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 py-20 md:py-28">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
            <div>
              <p className="text-[0.75rem] uppercase tracking-[0.2em] text-[#A0876E] mb-4">
                Prêt à transformer votre bâtiment ?
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-light text-[#F5F0EB] leading-[1.1]">
                Parlons de votre
                <br />
                <span className="italic text-[#C4956A]">projet</span>
              </h2>
            </div>
            <Link
              href="/contactez-nous"
              className="group inline-flex items-center gap-3 border border-[#C4956A] px-8 py-4 text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-[#F5F0EB] transition-all duration-300 hover:bg-[#C4956A] hover:text-[#2C1810]"
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
            <div className="flex items-center gap-3 mb-6">
              <div className="h-7 w-7 rounded-sm bg-[#C4956A]" />
              <span className="font-display text-xl font-semibold tracking-[0.02em] text-[#F5F0EB]">
                TERRAKOTTA
              </span>
            </div>
            <p className="text-[0.9rem] leading-relaxed text-[#A0876E] max-w-sm">
              Bureau d&apos;étude spécialisé en rénovation énergétique.
              Nous accompagnons particuliers, professionnels et collectivités
              vers un bâti plus performant et durable.
            </p>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3">
            <h3 className="text-[0.7rem] uppercase tracking-[0.2em] text-[#A0876E] mb-6">
              Navigation
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.88rem] text-[#D4C4B0] hover:text-[#F5F0EB] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h3 className="text-[0.7rem] uppercase tracking-[0.2em] text-[#A0876E] mb-6">
              Contact
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail size={16} className="mt-1 text-[#C4956A] shrink-0" />
                <span className="text-[0.88rem]">contact@terrakotta.fr</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone size={16} className="mt-1 text-[#C4956A] shrink-0" />
                <span className="text-[0.88rem]">04 XX XX XX XX</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={16} className="mt-1 text-[#C4956A] shrink-0" />
                <span className="text-[0.88rem]">
                  Marseille, France
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#4A3728]">
        <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[0.75rem] text-[#7A6555]">
            &copy; {new Date().getFullYear()} Terrakotta. Tous droits réservés.
          </p>
          <p className="text-[0.75rem] text-[#7A6555]">
            Bureau d&apos;étude en rénovation énergétique
          </p>
        </div>
      </div>
    </footer>
  );
}
