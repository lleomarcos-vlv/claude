"use client";

import { useState } from "react";
import { MediaImage } from "./media-image";
import type { MediaUrls } from "@/lib/media";

export function ProductGallery({
  images,
  videos,
  name,
}: {
  images: MediaUrls[];
  videos: MediaUrls[];
  name: string;
}) {
  const items = [...images, ...videos];
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <div>
      <div className="overflow-hidden rounded-[1.5rem] border border-line bg-cream-deep">
        <div className="aspect-[4/5] w-full sm:aspect-[4/4]">
          {current ? (
            <MediaImage
              media={current}
              quality="detail"
              priority
              alt={name}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center font-display text-muted">
              {name}
            </div>
          )}
        </div>
      </div>

      {items.length > 1 ? (
        <div className="scroll-x mt-4">
          {items.map((item, index) => (
            <button
              key={`${item.original}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Ver imagem ${index + 1} de ${name}`}
              className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                index === active ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {item.kind === "video" ? (
                <span className="flex h-full w-full items-center justify-center bg-espresso text-cream">
                  ▶
                </span>
              ) : (
                <img
                  src={item.thumb}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              )}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
