import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Kilowater — Bureau d'étude en rénovation énergétique",
    template: "%s | Kilowater",
  },
  description:
    "Kilowater, bureau d'étude spécialisé en rénovation énergétique. Audit énergétique, maîtrise d'œuvre, accompagnement CEE et MaPrimeRénov' pour particuliers, professionnels et collectivités.",
  metadataBase: new URL("https://kilowater.fr"),
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{ duration: 4500 }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
