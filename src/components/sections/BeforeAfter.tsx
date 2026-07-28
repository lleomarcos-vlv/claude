"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { galleryCategories, type GalleryItem } from "@/content/gallery";

/**
 * Comparador antes/depois com alça arrastável.
 *
 * Acessível por teclado (setas movem 4%, Home/End vão aos extremos) e por leitor
 * de tela, que anuncia a posição como um slider de 0 a 100.
 */
export function BeforeAfterSlider({ item, priority = false }: { item: GalleryItem; priority?: boolean }) {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);

  const move = useCallback((clientX: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => move(e.clientX);
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, move]);

  return (
    <div
      ref={frameRef}
      className="group relative aspect-[3/2] w-full touch-pan-y overflow-hidden rounded-2xl bg-verde-100 select-none"
      onPointerDown={(e) => {
        setDragging(true);
        move(e.clientX);
      }}
    >
      {/* Depois (fundo) */}
      <Image
        src={item.after}
        alt={`${item.title} — depois do serviço da Verde Fixo`}
        fill
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority={priority}
        className="object-cover"
      />

      {/* Antes (recortado pela posição da alça) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image
          src={item.before}
          alt={`${item.title} — antes do serviço`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={priority}
          className="object-cover"
        />
      </div>

      {/* Rótulos */}
      <span
        className="absolute top-3.5 left-3.5 rounded-full bg-verde-900/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-opacity"
        style={{ opacity: position > 12 ? 1 : 0 }}
      >
        Antes
      </span>
      <span
        className="absolute top-3.5 right-3.5 rounded-full bg-verde-600/90 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-opacity"
        style={{ opacity: position < 88 ? 1 : 0 }}
      >
        Depois
      </span>

      {/* Alça */}
      <div className="pointer-events-none absolute inset-y-0" style={{ left: `${position}%` }}>
        <div className="absolute inset-y-0 -left-px w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.35)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-verde-700 shadow-float transition-transform group-hover:scale-110">
            <Icon name="chevron-left" size={14} className="-mr-0.5" />
            <Icon name="chevron-right" size={14} className="-ml-0.5" />
          </div>
        </div>
      </div>

      {/* Controle acessível por teclado, sobreposto à alça */}
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(position)}
        onChange={(e) => setPosition(Number(e.target.value))}
        aria-label={`Comparar antes e depois: ${item.title}`}
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

export function BeforeAfterGallery({ items, filterable = false }: { items: GalleryItem[]; filterable?: boolean }) {
  const [category, setCategory] = useState<string>("todos");
  const filtered = category === "todos" ? items : items.filter((i) => i.category === category);

  return (
    <div>
      {filterable ? (
        <div className="mb-10 flex flex-wrap gap-2" role="group" aria-label="Filtrar por tipo de serviço">
          {galleryCategories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              aria-pressed={category === c.value}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                category === c.value
                  ? "border-verde-600 bg-verde-600 text-white"
                  : "border-cinza-300 bg-white text-cinza-700 hover:border-verde-400 hover:bg-verde-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        {filtered.map((item, i) => (
          <Reveal key={item.slug} delay={(i % 2) * 90}>
            <article className="card overflow-hidden">
              <BeforeAfterSlider item={item} priority={i < 2} />
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {item.services.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
                <h3 className="mt-3.5 text-lg font-semibold text-verde-800">{item.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-cinza-700">{item.description}</p>

                <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-cinza-200 pt-4 text-sm">
                  <div>
                    <dt className="text-cinza-600">Local</dt>
                    <dd className="mt-0.5 font-medium text-verde-800">{item.city}</dd>
                  </div>
                  <div>
                    <dt className="text-cinza-600">Área</dt>
                    <dd className="mt-0.5 font-medium text-verde-800">{item.areaM2.toLocaleString("pt-BR")} m²</dd>
                  </div>
                  <div>
                    <dt className="text-cinza-600">Prazo</dt>
                    <dd className="mt-0.5 font-medium text-verde-800">{item.duration}</dd>
                  </div>
                </dl>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {!filtered.length ? (
        <p className="py-16 text-center text-cinza-600">Nenhum trabalho nesta categoria ainda.</p>
      ) : null}
    </div>
  );
}

/** Seção da home: um comparador em destaque + chamada para a galeria completa. */
export function BeforeAfterSection({ items }: { items: GalleryItem[] }) {
  const [index, setIndex] = useState(0);
  const item = items[index];

  return (
    <section className="section bg-verde-800">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow text-verde-300">Antes e depois</p>
            <h2 className="mt-3 text-display font-semibold text-white">A diferença que dá para ver</h2>
            <p className="mt-4 text-lg leading-relaxed text-verde-200">
              Arraste a alça e compare. São trabalhos reais executados pela nossa equipe na região de Campinas — nada de
              banco de imagens.
            </p>

            <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Escolher trabalho">
              {items.map((g, i) => (
                <button
                  key={g.slug}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-pressed={index === i}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    index === i
                      ? "border-verde-300 bg-verde-300 text-verde-800"
                      : "border-white/25 text-verde-200 hover:border-white/50 hover:bg-white/10"
                  }`}
                >
                  {galleryCategories.find((c) => c.value === g.category)?.label ?? g.category}
                </button>
              ))}
            </div>

            <Link href="/antes-e-depois" className="btn btn-onDark btn-lg mt-8">
              Ver galeria completa
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>

          <div>
            <BeforeAfterSlider item={item} />
            <div className="mt-5">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-verde-200">{item.description}</p>
              <p className="mt-3 text-sm text-verde-300">
                {item.city} · {item.areaM2.toLocaleString("pt-BR")} m² · {item.duration}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
