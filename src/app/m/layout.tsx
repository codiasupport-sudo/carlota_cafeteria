import type { Metadata, Viewport } from "next";
import { Pacifico, Poppins } from "next/font/google";

const script = Pacifico({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-script",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: "La Carlota · Menú",
  description: "Menú de La Carlota — Sabores que se quedan contigo",
};

export const viewport: Viewport = {
  themeColor: "#62110D",
  width: "device-width",
  initialScale: 1,
};

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${script.variable} ${poppins.variable} min-h-screen bg-carlota-red text-white selection:bg-white selection:text-carlota-wine font-sans`}
      style={{ fontFamily: "var(--font-poppins), sans-serif" }}
    >
      {children}
    </div>
  );
}
