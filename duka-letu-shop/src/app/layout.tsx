import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: { default: "Duka Letu · Electronics, hardware & home goods", template: "%s · Duka Letu" },
  description: "Shop lighting, torches, speakers, sockets, tools and kitchen goods online. Pick up in the shop or get it delivered in town. Pay with M-Pesa.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#113a40", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-KE">
      <body>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-sm focus:bg-surface focus:px-3 focus:py-2 focus:font-semibold">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
