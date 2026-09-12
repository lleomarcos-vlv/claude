import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.siteUrl;
  const staticRoutes = ["", "/produtos", "/ofertas", "/café", "/encomendas", "/contato"].map(
    (route) => ({
      url: `${base}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : 0.8,
    }),
  );

  const [products, categories] = await Promise.all([
    prisma.product
      .findMany({ where: { available: true }, select: { slug: true, updatedAt: true } })
      .catch(() => []),
    prisma.category
      .findMany({ where: { active: true }, select: { slug: true, updatedAt: true } })
      .catch(() => []),
  ]);

  return [
    ...staticRoutes,
    ...categories.map((category) => ({
      url: `${base}/categoria/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${base}/produtos/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
