import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { services } from "@/content/services";
import { blogPosts } from "@/content/blog";
import { cities } from "@/content/cities";
import { gallery } from "@/content/gallery";

export const revalidate = 3600;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string) => `${siteUrl}${path}`;

  const staticPages: MetadataRoute.Sitemap = [
    { url: url("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: url("/planos"), lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: url("/servicos"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/agendamento"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/orcamento"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: url("/simulador"), lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: url("/antes-e-depois"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/atendemos"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: url("/avaliacoes"), lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: url("/sobre"), lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: url("/blog"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: url("/faq"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: url("/contato"), lastModified: now, changeFrequency: "yearly", priority: 0.65 },
    { url: url("/entrar"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: url("/cadastro"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: url("/privacidade"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: url("/termos"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: url("/cookies"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  return [
    ...staticPages,
    ...services.map((s) => ({
      url: url(`/servicos/${s.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.85,
    })),
    ...cities.map((c) => ({
      url: url(`/atendemos/${c.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...gallery.map((g) => ({
      url: url(`/antes-e-depois/${g.slug}`),
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...blogPosts.map((p) => ({
      url: url(`/blog/${p.slug}`),
      lastModified: new Date(p.updatedAt ?? p.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
  ];
}
