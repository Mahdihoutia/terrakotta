import { Cormorant_Garamond, Manrope } from "next/font/google";
import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Terrakotta — Bureau d'étude en rénovation énergétique",
    template: "%s | Terrakotta",
  },
  description:
    "Bureau d'étude spécialisé en rénovation énergétique. Audit, maîtrise d'œuvre et accompagnement CEE/MaPrimeRénov' pour particuliers, professionnels et collectivités.",
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${cormorant.variable} ${manrope.variable} font-body bg-[#FAF8F5] text-[#2C1810] min-h-screen`}
      style={{
        fontFamily: "var(--font-body), system-ui, sans-serif",
      }}
    >
      <style>{`
        .font-display { font-family: var(--font-display), Georgia, serif; }
        .font-body { font-family: var(--font-body), system-ui, sans-serif; }
      `}</style>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
