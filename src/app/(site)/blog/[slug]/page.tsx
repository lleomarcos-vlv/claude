import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { PostCard } from "@/components/sections/BlogTeaser";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { CtaBanner } from "@/components/sections/WhyChooseUs";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleSchema, breadcrumbSchema, pageMetadata } from "@/lib/seo";
import { extractHeadings, renderMarkdown } from "@/lib/markdown";
import { dateLong, initials } from "@/lib/format";
import { blogBySlug, blogPosts, recentPosts } from "@/content/blog";

export function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogBySlug(slug);
  if (!post) return {};

  return pageMetadata({
    title: post.seoTitle,
    description: post.seoDescription,
    path: `/blog/${post.slug}`,
    image: post.cover,
    type: "article",
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    keywords: post.tags,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = blogBySlug(slug);
  if (!post) notFound();

  const html = renderMarkdown(post.body);
  const headings = extractHeadings(post.body);
  const related = recentPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <article>
        {/* Cabeçalho do artigo */}
        <header className="border-b border-cinza-200 bg-verde-50 pt-28 pb-12 sm:pt-36">
          <div className="container-page">
            <nav aria-label="Trilha de navegação" className="mb-6">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-cinza-600">
                <li>
                  <Link href="/" className="hover:text-verde-700">
                    Início
                  </Link>
                </li>
                <li className="flex items-center gap-1.5">
                  <Icon name="chevron-right" size={13} className="opacity-50" />
                  <Link href="/blog" className="hover:text-verde-700">
                    Blog
                  </Link>
                </li>
                <li className="flex items-center gap-1.5">
                  <Icon name="chevron-right" size={13} className="opacity-50" />
                  <span className="text-verde-800">{post.category}</span>
                </li>
              </ol>
            </nav>

            <div className="max-w-3xl">
              <span className="badge-accent">{post.category}</span>
              <h1 className="mt-4 text-display font-semibold text-verde-800">{post.title}</h1>
              <p className="mt-5 text-lg leading-relaxed text-cinza-700">{post.excerpt}</p>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-verde-600 text-sm font-semibold text-white"
                  >
                    {initials(post.author.name)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-verde-800">{post.author.name}</p>
                    <p className="text-xs text-cinza-600">{post.author.role}</p>
                  </div>
                </div>

                <p className="flex items-center gap-2 text-sm text-cinza-600">
                  <Icon name="calendar" size={15} />
                  <time dateTime={post.publishedAt}>{dateLong(post.publishedAt)}</time>
                </p>
                <p className="flex items-center gap-2 text-sm text-cinza-600">
                  <Icon name="clock" size={15} />
                  {post.readingMinutes} min de leitura
                </p>
                {post.updatedAt ? (
                  <p className="text-sm text-cinza-600">Atualizado em {dateLong(post.updatedAt)}</p>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {/* Capa */}
        <div className="container-page -mt-1">
          <div className="relative aspect-[2/1] overflow-hidden rounded-b-3xl bg-verde-100 sm:aspect-[2.4/1]">
            <Image src={post.cover} alt="" fill priority sizes="100vw" className="object-cover" />
          </div>
        </div>

        {/* Corpo */}
        <div className="container-page grid gap-12 py-14 lg:grid-cols-[1fr_16rem] lg:gap-16">
          <div className="prose-vf max-w-3xl" dangerouslySetInnerHTML={{ __html: html }} />

          <aside className="lg:sticky lg:top-24 lg:self-start">
            {headings.length ? (
              <nav aria-label="Neste artigo" className="card p-5">
                <h2 className="text-xs font-semibold tracking-[0.1em] text-cinza-600 uppercase">Neste artigo</h2>
                <ol className="mt-3.5 space-y-2.5">
                  {headings.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className="text-sm leading-snug text-cinza-800 hover:text-verde-600">
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}

            <div className="card mt-5 border-verde-300 p-5">
              <p className="eyebrow">Verde Fixo</p>
              <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-cinza-800">
                Quer o jardim assim sem fazer nada? Assine um plano e a gente cuida o ano inteiro.
              </p>
              <Link href="/planos" className="btn btn-primary btn-sm mt-4 w-full">
                Ver planos
              </Link>
              <Link href="/simulador" className="btn btn-ghost btn-sm mt-2 w-full border border-cinza-200">
                Simular meu jardim
              </Link>
            </div>

            <ul className="mt-5 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <li key={tag} className="chip text-[0.7rem]">
                  {tag}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </article>

      {/* Newsletter */}
      <section className="border-y border-cinza-200 bg-cinza-50 py-12">
        <div className="container-page grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16">
          <div>
            <h2 className="text-xl font-semibold text-verde-800">Gostou? Recebe as próximas por e-mail</h2>
            <p className="mt-2 text-[0.9375rem] text-cinza-700">Um e-mail por mês, sem enrolação.</p>
          </div>
          <NewsletterForm source={`blog:${post.slug}`} />
        </div>
      </section>

      {/* Relacionados */}
      <section className="section-tight">
        <div className="container-page">
          <h2 className="text-title font-semibold text-verde-800">Continue lendo</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />

      <JsonLd
        data={[
          articleSchema(post),
          breadcrumbSchema([
            { name: "Início", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />
    </>
  );
}
