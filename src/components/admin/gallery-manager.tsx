"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Uploader, type UploadedMedia } from "./uploader";

type Item = { id: string; caption: string; active: boolean; thumbUrl: string | null; link?: string };
type Asset = {
  id: string;
  kind: string;
  originalName: string;
  sizeMb: string;
  dimensions: string;
  thumbUrl: string | null;
  originalUrl: string | null;
};

export function GalleryManager({
  gallery,
  instagram,
  library,
}: {
  gallery: Item[];
  instagram: Item[];
  library: Asset[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"galeria" | "instagram" | "biblioteca">("galeria");

  async function addItem(endpoint: string, media: UploadedMedia[]) {
    for (const item of media) {
      await fetch(`/api/admin/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId: item.id, position: 0, active: true }),
      });
    }
    router.refresh();
  }

  async function patch(endpoint: string, id: string, data: Record<string, unknown>) {
    await fetch(`/api/admin/${endpoint}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  async function remove(endpoint: string, id: string) {
    if (!window.confirm("Remover este item?")) return;
    await fetch(`/api/admin/${endpoint}/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function deleteAsset(id: string) {
    if (!window.confirm("Excluir o arquivo definitivamente do storage?")) return;
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const current = tab === "galeria" ? gallery : instagram;
  const endpoint = tab === "galeria" ? "gallery" : "instagram";

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {(["galeria", "instagram", "biblioteca"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
              tab === value ? "bg-espresso text-cream" : "border border-line bg-white text-muted"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      {tab === "biblioteca" ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-4">Arquivo</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Tamanho</th>
                <th className="p-4">Dimensões</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {library.map((asset) => (
                <tr key={asset.id}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-cream-deep">
                        {asset.kind === "video" ? (
                          <span className="flex h-full w-full items-center justify-center">🎬</span>
                        ) : asset.thumbUrl ? (
                          <img src={asset.thumbUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <span className="max-w-[16rem] truncate">{asset.originalName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted">{asset.kind}</td>
                  <td className="p-4 text-muted">{asset.sizeMb} MB</td>
                  <td className="p-4 text-muted">{asset.dimensions}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      {asset.originalUrl ? (
                        <a
                          href={asset.originalUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-espresso"
                        >
                          original
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => deleteAsset(asset.id)}
                        className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-danger"
                      >
                        excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {library.length === 0 ? (
            <p className="p-8 text-center text-muted">Nenhum arquivo enviado ainda.</p>
          ) : null}
        </div>
      ) : (
        <>
          <div className="card p-5">
            <h2 className="font-display text-lg">
              Enviar para {tab === "galeria" ? "a galeria" : "o Instagram"}
            </h2>
            <div className="mt-4">
              <Uploader
                folder={tab === "galeria" ? "galeria" : "instagram"}
                onUploaded={(media) => addItem(endpoint, media)}
                label="Arraste fotos e vídeos aqui"
              />
            </div>
          </div>

          {current.length === 0 ? (
            <div className="card p-8 text-center text-muted">Nenhum item publicado.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {current.map((item) => (
                <div key={item.id} className="card overflow-hidden">
                  <div className="aspect-square bg-cream-deep">
                    {item.thumbUrl ? (
                      <img src={item.thumbUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-2xl">🎬</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 p-2">
                    <button
                      type="button"
                      onClick={() => patch(endpoint, item.id, { active: !item.active })}
                      className={`badge border px-2 py-1 text-[0.6rem] ${
                        item.active ? "border-success/40 text-success" : "border-line text-muted"
                      }`}
                    >
                      {item.active ? "no ar" : "oculto"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(endpoint, item.id)}
                      className="rounded-lg border border-line px-2 py-1 text-[0.6rem] text-muted hover:text-danger"
                    >
                      remover
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
