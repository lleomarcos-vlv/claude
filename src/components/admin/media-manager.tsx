"use client";

import { useState } from "react";
import { MediaPicker, type MediaRef } from "./media-picker";

/**
 * Galeria do produto: adicionar, reordenar, definir a foto principal e excluir.
 * A ordem exibida aqui é exatamenté a ordem que o cliente ve no site.
 */
export function MediaManager({
  media,
  mainImageId,
  folder = "produtos",
  onChange,
  onMainChange,
}: {
  media: MediaRef[];
  mainImageId: string | null;
  folder?: string;
  onChange: (media: MediaRef[]) => void;
  onMainChange: (id: string | null) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= media.length) return;
    const next = [...media];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function removeAt(index: number) {
    const removed = media[index];
    const next = media.filter((_, position) => position !== index);
    onChange(next);
    if (removed.id === mainImageId) {
      onMainChange(next.find((item) => item.kind === "image")?.id ?? null);
    }
  }

  function addMedia(added: MediaRef[]) {
    const next = [...media];
    for (const item of added) {
      if (!next.some((entry) => entry.id === item.id)) next.push(item);
    }
    onChange(next);
    if (!mainImageId) {
      onMainChange(next.find((item) => item.kind === "image")?.id ?? null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-outline" onClick={() => setPickerOpen(true)}>
          + Adicionar fotos e vídeos
        </button>
        <span className="text-xs text-muted">
          {media.length} arquivo(s) • a primeira imagem marcada como principal aparece no catalogo
        </span>
      </div>

      {media.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {media.map((item, index) => (
            <li
              key={item.id}
              className={`overflow-hidden rounded-xl border-2 bg-white ${
                item.id === mainImageId ? "border-gold" : "border-line"
              }`}
            >
              <div className="aspect-square bg-cream-deep">
                {item.kind === "video" ? (
                  <span className="flex h-full w-full items-center justify-center text-3xl">🎬</span>
                ) : item.thumbUrl ? (
                  <img src={item.thumbUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>

              <div className="flex items-center justify-between gap-1 p-1.5">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    className="h-7 w-7 rounded-lg border border-line text-xs text-muted hover:text-espresso"
                    aria-label="Mover para tras"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    className="h-7 w-7 rounded-lg border border-line text-xs text-muted hover:text-espresso"
                    aria-label="Mover para frente"
                  >
                    →
                  </button>
                </div>

                <div className="flex gap-1">
                  {item.kind === "image" ? (
                    <button
                      type="button"
                      onClick={() => onMainChange(item.id)}
                      className={`h-7 rounded-lg border px-2 text-[0.65rem] font-semibold ${
                        item.id === mainImageId
                          ? "border-gold bg-gold text-white"
                          : "border-line text-muted hover:text-espresso"
                      }`}
                    >
                      {item.id === mainImageId ? "principal" : "usar"}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    className="h-7 w-7 rounded-lg border border-line text-xs text-muted hover:text-danger"
                    aria-label="Remover"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-white p-6 text-center text-sm text-muted">
          Nenhuma foto ainda. Clique em &quot;Adicionar fotos e vídeos&quot; para enviar direto do
          computador ou do celular.
        </p>
      )}

      <MediaPicker
        open={pickerOpen}
        folder={folder}
        onClose={() => setPickerOpen(false)}
        onSelect={addMedia}
      />
    </div>
  );
}
