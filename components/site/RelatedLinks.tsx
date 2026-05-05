import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface RelatedLink {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
}

interface Props {
  title?: string;
  subtitle?: string;
  links: RelatedLink[];
  variant?: "light" | "dark";
}

export default function RelatedLinks({
  title = "Aller plus loin",
  subtitle,
  links,
  variant = "light",
}: Props) {
  const isDark = variant === "dark";
  return (
    <section
      className={`py-20 md:py-28 ${isDark ? "bg-[#0D1B35] text-[#EFF6FF]" : "bg-[#F5FAFF] text-[#0D1B35]"}`}
    >
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <p
            className={`text-[0.72rem] uppercase tracking-[0.25em] mb-4 ${
              isDark ? "text-[#60A5FA]" : "text-[#2563EB]"
            }`}
          >
            Pour aller plus loin
          </p>
          <h2
            className={`font-display text-3xl md:text-4xl lg:text-5xl font-light leading-[1.1] ${
              isDark ? "text-white" : "text-[#0D1B35]"
            }`}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className={`mt-4 text-[0.95rem] leading-relaxed ${
                isDark ? "text-[#BFDBFE]" : "text-[#4A6285]"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#DBEAFE]">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group p-8 md:p-10 transition-colors duration-300 ${
                isDark
                  ? "bg-[#0D1B35] hover:bg-[#1B3356]"
                  : "bg-white hover:bg-[#EFF6FF]"
              }`}
            >
              <p
                className={`text-[0.7rem] uppercase tracking-[0.18em] mb-4 ${
                  isDark ? "text-[#60A5FA]" : "text-[#2563EB]"
                }`}
              >
                {link.eyebrow}
              </p>
              <h3
                className={`font-display text-xl md:text-2xl font-normal leading-[1.2] mb-3 ${
                  isDark ? "text-white" : "text-[#0D1B35]"
                }`}
              >
                {link.title}
              </h3>
              <p
                className={`text-[0.88rem] leading-relaxed mb-6 ${
                  isDark ? "text-[#BFDBFE]" : "text-[#4A6285]"
                }`}
              >
                {link.description}
              </p>
              <span
                className={`inline-flex items-center gap-2 text-[0.78rem] font-semibold uppercase tracking-[0.14em] ${
                  isDark ? "text-[#60A5FA]" : "text-[#2563EB]"
                }`}
              >
                Découvrir
                <ArrowUpRight
                  size={14}
                  className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
