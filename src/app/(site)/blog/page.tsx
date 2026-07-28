import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { PostCard } from "@/components/sections/BlogTeaser";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { JsonLd } from "@/components/seo/JsonLd";
import { Reveal } from "@/components/ui/Reveal";
import { breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { blogCategories, recentPosts } from "@/content/blog";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Blog — Dicas de Jardinagem e Paisagismo",
  description:
    "Conteúdo técnico sobre gramado, adubação, poda, irrigação e custos de manutenção, escrito pelo agrônomo e pela paisagista da Verde Fixo.",
  path: "/blog",
});

export default function BlogPage() {
  const [featured, ...rest] = recentPosts;

  return (
    <>
      <PageHeader
        eyebrow="Blog"
        title="Dicas de quem cuida de jardim todo dia"
        description="Conteúdo técnico e aplicável, escrito pelo nosso engenheiro agrônomo e pela nossa paisagista. Sem promoção disfarçada de dica."
        breadcrumb={[{ label: "Blog" }]}
      />

      <section className="section">
        <div className="container-page">
          <div className="mb-10 flex flex-wrap gap-2">
            {blogCategories.map((category) => (
              <span key={category} className="chip">
                {category}
              </span>
            ))}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Reveal className="sm:col-span-2">
              <PostCard post={featured} featured />
            </Reveal>
            {rest.map((post, i) => (
              <Reveal key={post.slug} delay={(i % 3) * 90}>
                <PostCard post={post} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight bg-verde-800">
        <div className="container-page grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <h2 className="text-title font-semibold text-white">Receba as dicas antes de todo mundo</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-verde-200">
              Um e-mail por mês com o que fazer no jardim naquela estação. Cancele quando quiser.
            </p>
          </div>
          <NewsletterForm source="blog" variant="dark" />
        </div>
      </section>

      <JsonLd
        data={[
          {
            "@type": "Blog",
            "@id": `${siteUrl}/blog#blog`,
            name: "Blog Verde Fixo",
            description: "Dicas técnicas de jardinagem, paisagismo e manutenção de gramado.",
            url: `${siteUrl}/blog`,
            publisher: { "@id": `${siteUrl}/#organizacao` },
            blogPost: recentPosts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: `${siteUrl}/blog/${p.slug}`,
              datePublished: p.publishedAt,
              author: { "@type": "Person", name: p.author.name },
            })),
          },
          breadcrumbSchema([
            { name: "Início", path: "/" },
            { name: "Blog", path: "/blog" },
          ]),
        ]}
      />
    </>
  );
}
