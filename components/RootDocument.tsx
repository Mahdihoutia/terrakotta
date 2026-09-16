import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import "@/app/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface Props {
  lang: string;
  children: React.ReactNode;
}

/**
 * Document HTML commun à toutes les racines de l'application.
 *
 * Le projet utilise plusieurs root layouts (`(app)`, `(site)`, `(site-en)`)
 * afin que chaque version linguistique serve un `<html lang>` correct tout en
 * restant générée statiquement.
 */
export default function RootDocument({ lang, children }: Props) {
  return (
    <html
      lang={lang}
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
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
