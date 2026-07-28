import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/admin/", "/area-cliente", "/area-cliente/", "/uploads/", "/pesquisa/"],
      },
      // Bots de IA que respeitam robots.txt: liberamos o conteúdo editorial.
      { userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot"], allow: ["/blog", "/servicos", "/planos"], disallow: "/" },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
