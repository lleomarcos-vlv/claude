import type { Metadata } from "next";
import { site, siteUrl } from "@/lib/site";
import { services } from "@/content/services";
import { plans } from "@/content/plans";
import { faq } from "@/content/faq";
import { cities } from "@/content/cities";
import { money } from "@/lib/format";

/** Metadata padrão de uma página, com canonical, Open Graph e Twitter Card. */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const url = `${siteUrl}${input.path}`;
  const image = input.image ?? "/img/og/default.png";

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    robots: input.noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    openGraph: {
      type: input.type ?? "website",
      url,
      siteName: site.name,
      title: input.title,
      description: input.description,
      locale: "pt_BR",
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
      ...(input.modifiedTime ? { modifiedTime: input.modifiedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}

// ---------------------------------------------------------------------------
// JSON-LD (Schema.org)
// ---------------------------------------------------------------------------

const id = (path: string) => `${siteUrl}${path}`;

export function organizationSchema() {
  return {
    "@type": "LocalBusiness",
    "@id": id("/#organizacao"),
    additionalType: "https://schema.org/HomeAndConstructionBusiness",
    name: site.name,
    legalName: site.legalName,
    slogan: site.slogan,
    description: site.description,
    url: siteUrl,
    telephone: site.phone,
    email: site.email,
    image: id("/img/og/default.png"),
    logo: id("/logo.svg"),
    priceRange: "R$$",
    currenciesAccepted: "BRL",
    paymentAccepted: "PIX, Cartão de Crédito, Boleto",
    foundingDate: site.founded,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.zip,
      addressCountry: site.address.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: site.address.lat, longitude: site.address.lng },
    openingHoursSpecification: site.openingHoursSpec.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days.map((d) => `https://schema.org/${d}`),
      opens: h.opens,
      closes: h.closes,
    })),
    areaServed: cities.map((c) => ({ "@type": "City", name: c.city, address: { "@type": "PostalAddress", addressRegion: c.state } })),
    sameAs: Object.values(site.social),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: site.stats.rating,
      reviewCount: site.stats.reviews,
      bestRating: 5,
      worstRating: 1,
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Serviços de jardinagem e paisagismo",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.name, description: s.shortDesc, url: id(`/servicos/${s.slug}`) },
      })),
    },
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": id("/#website"),
    url: siteUrl,
    name: site.name,
    inLanguage: "pt-BR",
    publisher: { "@id": id("/#organizacao") },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl}/blog?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function serviceSchema(service: (typeof services)[number]) {
  const offer =
    service.pricing.kind === "m2"
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "BRL",
          lowPrice: (service.pricing.minPerM2 / 100).toFixed(2),
          highPrice: (service.pricing.maxPerM2 / 100).toFixed(2),
          unitText: "m²",
          availability: "https://schema.org/InStock",
        }
      : { "@type": "Offer", priceCurrency: "BRL", availability: "https://schema.org/InStock", description: "Orçamento personalizado gratuito" };

  return {
    "@type": "Service",
    "@id": id(`/servicos/${service.slug}#servico`),
    name: service.name,
    description: service.description,
    serviceType: service.name,
    url: id(`/servicos/${service.slug}`),
    image: id(service.image),
    provider: { "@id": id("/#organizacao") },
    areaServed: cities.map((c) => ({ "@type": "City", name: c.city })),
    offers: offer,
  };
}

export function planSchema(plan: (typeof plans)[number]) {
  return {
    "@type": "Product",
    "@id": id(`/planos#${plan.slug}`),
    name: plan.name,
    description: `${plan.tagline} ${plan.features.join(". ")}.`,
    brand: { "@type": "Brand", name: site.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (plan.priceMonthly / 100).toFixed(2),
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: (plan.priceMonthly / 100).toFixed(2),
        priceCurrency: "BRL",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
      availability: "https://schema.org/InStock",
      url: id("/planos"),
    },
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@type": "FAQPage",
    "@id": id("/faq#faq"),
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: id(item.path),
    })),
  };
}

export function articleSchema(post: {
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  publishedAt: string;
  updatedAt?: string;
  author: { name: string; role: string };
  tags: string[];
}) {
  return {
    "@type": "BlogPosting",
    "@id": id(`/blog/${post.slug}#artigo`),
    headline: post.title,
    description: post.excerpt,
    image: id(post.cover),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    inLanguage: "pt-BR",
    author: { "@type": "Person", name: post.author.name, jobTitle: post.author.role },
    publisher: { "@id": id("/#organizacao") },
    mainEntityOfPage: { "@type": "WebPage", "@id": id(`/blog/${post.slug}`) },
    keywords: post.tags.join(", "),
  };
}

export function reviewsSchema(reviews: { name: string; rating: number; text: string; city: string }[]) {
  return {
    "@type": "ItemList",
    "@id": id("/avaliacoes#lista"),
    itemListElement: reviews.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Review",
        author: { "@type": "Person", name: r.name },
        reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
        reviewBody: r.text,
        itemReviewed: { "@id": id("/#organizacao") },
        locationCreated: { "@type": "Place", name: r.city },
      },
    })),
  };
}

/** Todas as FAQs do site, para a página dedicada. */
export const allFaqSchema = () => faqSchema(faq);

/** Preço formatado usado nos textos de SEO. */
export const fromPrice = (cents: number) => `a partir de ${money(cents)}`;
