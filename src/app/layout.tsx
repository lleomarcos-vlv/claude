import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/cart-context";
import { ServiceWorker } from "@/components/service-worker";
import { env } from "@/lib/env";
import { getSettings } from "@/lib/settings";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    metadataBase: new URL(env.siteUrl),
    title: {
      default: settings.seoTitle,
      template: `%s | ${settings.brandName}`,
    },
    description: settings.seoDescription,
    applicationName: settings.brandName,
    manifest: "/manifest.webmanifest",
    appleWebApp: {
      capable: true,
      title: settings.brandName,
      statusBarStyle: "default",
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: env.siteUrl,
      siteName: settings.brandName,
      title: settings.seoTitle,
      description: settings.seoDescription,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: settings.brandName }],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.seoTitle,
      description: settings.seoDescription,
      images: ["/og.png"],
    },
    icons: {
      icon: [
        { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    },
    alternates: { canonical: "/" },
    robots: { index: true, follow: true },
  };
}

export const viewport: Viewport = {
  themeColor: "#241609",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen antialiased">
        <CartProvider>{children}</CartProvider>
        <ServiceWorker />
      </body>
    </html>
  );
}
