import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { dateLong } from "@/lib/format";
import type { BlogPost } from "@/content/blog";

export function PostCard({ post, featured = false }: { post: BlogPost; featured?: boolean }) {
  return (
    <article className={`card card-hover group flex h-full flex-col overflow-hidden ${featured ? "sm:col-span-2" : ""}`}>
      <Link href={`/blog/${post.slug}`} className={`relative block overflow-hidden bg-verde-100 ${featured ? "aspect-[2/1]" : "aspect-[16/9]"}`}>
        <Image
          src={post.cover}
          alt=""
          fill
          sizes={featured ? "(max-width: 640px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          style={{ transitionTimingFunction: "var(--ease-out-soft)" }}
        />
        <span className="absolute top-3.5 left-3.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-verde-700 shadow-card backdrop-blur-sm">
          {post.category}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="flex items-center gap-2 text-xs text-cinza-600">
          <time dateTime={post.publishedAt}>{dateLong(post.publishedAt)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min de leitura</span>
        </p>

        <h3 className={`mt-3 font-semibold text-verde-800 ${featured ? "text-2xl" : "text-lg"}`}>
          <Link href={`/blog/${post.slug}`} className="hover:text-verde-600">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-cinza-700">{post.excerpt}</p>

        <Link
          href={`/blog/${post.slug}`}
          className="mt-5 inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-verde-600 hover:text-verde-700"
        >
          Ler artigo
          <Icon name="arrow-right" size={16} />
        </Link>
      </div>
    </article>
  );
}

export function BlogTeaser({ posts }: { posts: BlogPost[] }) {
  return (
    <section className="section bg-cinza-50">
      <div className="container-page">
        <SectionHeading
          eyebrow="Blog"
          title="Dicas de quem cuida de jardim todo dia"
          description="Conteúdo escrito pelo nosso agrônomo e pela nossa paisagista — técnico, sem enrolação e aplicável no seu quintal."
          action={
            <Link href="/blog" className="btn btn-outline btn-md">
              Ver todos os artigos
              <Icon name="arrow-right" size={17} />
            </Link>
          }
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((post, i) => (
            <Reveal key={post.slug} delay={i * 90}>
              <PostCard post={post} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
