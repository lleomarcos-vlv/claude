import type { MediaUrls } from "@/lib/media";

type Props = {
  media: MediaUrls | null;
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** "card" usa thumb/mobile; "hero" e "detail" usam desktop/original. */
  quality?: "card" | "detail" | "hero";
  fallbackLabel?: string;
};

/**
 * Exibe as variantes geradas no upload (thumb/mobile/desktop) via srcset.
 * O arquivo ORIGINAL continua guardado e é usado no zoom da página do produto.
 */
export function MediaImage({
  media,
  alt,
  className = "",
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  quality = "card",
  fallbackLabel,
}: Props) {
  if (!media) {
    return (
      <div
        className={`flex items-center justify-center bg-cream-deep text-muted ${className}`}
        aria-label={alt || fallbackLabel || "Imagem indisponivel"}
      >
        <span className="font-display text-sm opacity-60">{fallbackLabel ?? "Villa Reis"}</span>
      </div>
    );
  }

  if (media.kind === "video") {
    return (
      <video
        className={className}
        src={media.original}
        poster={media.poster ?? undefined}
        controls
        playsInline
        preload="metadata"
      />
    );
  }

  const src = quality === "card" ? media.mobile : media.desktop;
  const srcSet = [
    `${media.thumb} 480w`,
    `${media.mobile} 800w`,
    `${media.desktop} 1600w`,
  ].join(", ");

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt ?? media.alt}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      width={media.width ?? undefined}
      height={media.height ?? undefined}
    />
  );
}
