import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import { SearchProvider } from "@/components/dashboard/SearchProvider";
import { Cormorant_Garamond, Manrope } from "next/font/google";

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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <div
        className={`${cormorant.variable} ${manrope.variable} flex h-screen overflow-hidden bg-tk-bg`}
        style={{ fontFamily: "var(--font-body), system-ui, sans-serif" }}
      >
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SearchProvider>
  );
}
