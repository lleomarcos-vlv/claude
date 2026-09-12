"use client";

import { useEffect, useState } from "react";
import { Uploader, type UploadedMedia } from "./uploader";

export type MediaRef = { id: string; kind: "image" | "video"; thumbUrl: string | null };

type LibraryItem = {
  id: string;
  kind: "image" | "video";
  folder: string;
  originalName: string;
  size: number;
  urls: { thumb: string; desktop: string; original: string } | null;
};

const FOLDERS = ["todas", "produtos", "banners", "categorias", "galeria", "instagram", "marca", "geral"];

export function MediaPicker({
  open,
  onClose,
  onSelect,
  folder = "produtos",
  multiple = true,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaRef[]) => void;
  folder?: string;
  multiple?: boolean;
}) {
  const [tab, setTab] = useState<"biblioteca" | "enviar">("enviar");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [filter, setFilter] = useState(folder);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || tab !== "biblioteca") return;
    setLoading(true);
    fetch(`/api/admin/media?folder=${filter}`)
      .then((response) => response.json())
      .then((payload) => setItems(payload.data ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open, tab, filter]);

  if (!open) return null;

  function confirmSelection() {
    const chosen = items
      .filter((item) => selected.includes(item.id))
      .map((item) => ({ id: item.id, kind: item.kind, thumbUrl: item.urls?.thumb ?? null }));
    onSelect(chosen);
    setSelected([]);
    onClose();
  }

  function handleUploaded(uploaded: UploadedMedia[]) {
    onSelect(uploaded.map((item) => ({ id: item.id, kind: item.kind, thumbUrl: item.thumbUrl })));
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-espresso/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-cream sm:rounded-3xl">
        <header className="flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <h2 className="font-display text-xl">Fotos e vídeos</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted"
            aria-label="Fechar"
          >
            ✕
          </button>
        </header>

        <div className="flex gap-2 border-b border-line bg-white px-5 pb-3">
          {(["enviar", "biblioteca"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === value ? "bg-espresso text-cream" : "text-muted hover:bg-cream-deep"
              }`}
            >
              {value === "enviar" ? "Enviar novos" : "Biblioteca"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {tab === "enviar" ? (
            <Uploader folder={folder} onUploaded={handleUploaded} />
          ) : (
            <>
              <div className="scroll-x mb-4">
                {FOLDERS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`badge border px-3 py-1.5 ${
                      filter === item ? "border-espresso bg-espresso text-cream" : "border-line bg-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="aspect-square rounded-xl shimmer" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <p className="py-12 text-center text-muted">
                  Nenhum arquivo nesta pasta. Use a aba &quot;Enviar novos&quot;.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {items.map((item) => {
                    const active = selected.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setSelected((current) =>
                            active
                              ? current.filter((id) => id !== item.id)
                              : multiple
                                ? [...current, item.id]
                                : [item.id],
                          )
                        }
                        className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-cream-deep transition ${
                          active ? "border-gold" : "border-transparent hover:border-line"
                        }`}
                        title={item.originalName}
                      >
                        {item.kind === "video" ? (
                          <span className="flex h-full w-full items-center justify-center bg-espresso text-2xl text-cream">
                            ▶
                          </span>
                        ) : (
                          <img
                            src={item.urls?.thumb}
                            alt={item.originalName}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        )}
                        {active ? (
                          <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs text-white">
                            ✓
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {tab === "biblioteca" ? (
          <footer className="flex items-center justify-between border-t border-line bg-white px-5 py-4">
            <span className="text-sm text-muted">{selected.length} selecionado(s)</span>
            <button
              type="button"
              className="btn btn-primary"
              onClick={confirmSelection}
              disabled={selected.length === 0}
            >
              Usar selecionados
            </button>
          </footer>
        ) : (
          <footer className="flex justify-end border-t border-line bg-white px-5 py-4">
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Concluir
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
