import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Analytics } from "@/components/layout/Analytics";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { getConfigMany } from "@/lib/settings";
import { site, siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — ${site.slogan}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.legalName, url: siteUrl }],
  creator: site.legalName,
  publisher: site.legalName,
  category: "Jardinagem e Paisagismo",
  keywords: [
    "corte de grama",
    "jardinagem",
    "paisagismo",
    "manutenção de jardim",
    "poda de árvores",
    "limpeza de terreno",
    "plano de manutenção de jardim",
    "jardineiro Campinas",
    "empresa de jardinagem",
  ],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: site.name,
    title: `${site.name} — ${site.slogan}`,
    description: site.description,
    images: [{ url: "/img/og/default.png", width: 1200, height: 630, alt: `${site.name} — ${site.slogan}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.slogan}`,
    description: site.description,
    images: ["/img/og/default.png"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: true, address: true, email: true },
  other: { "geo.region": "BR-SP", "geo.placename": site.address.city },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1d3a31" },
  ],
  colorScheme: "light",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // IDs de medição configuráveis no painel administrativo (com fallback no ambiente).
  const measurement = await getConfigMany(["GTM_ID", "GA_ID", "META_PIXEL_ID"] as const);

  return (
    <html lang="pt-BR">
      <head>
        {/* Pré-conexão apenas com o que realmente é usado quando há consentimento */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://wa.me" />
        {/* Sem JavaScript, as animações de entrada não devem esconder conteúdo. */}
        <noscript>
          <style>{`.reveal{opacity:1 !important;transform:none !important}`}</style>
        </noscript>
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-verde-800 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Ir para o conteúdo
        </a>

        {/* O cabeçalho/rodapé do site vivem no grupo de rotas (site); as áreas
            logadas e de autenticação usam o próprio layout. */}
        {children}

        <Analytics gtmId={measurement.GTM_ID} gaId={measurement.GA_ID} metaPixelId={measurement.META_PIXEL_ID} />

        <JsonLd data={[organizationSchema(), websiteSchema()]} />
      </body>
    </html>
  );
}
