"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MediaPicker, type MediaRef } from "./media-picker";

type Banner = {
  id: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonLink: string;
  placement: string;
  position: number;
  active: boolean;
  startsAt: string;
  endsAt: string;
  mediaId: string | null;
  thumbUrl: string | null;
};

const EMPTY: Omit<Banner, "id"> = {
  title: "",
  subtitle: "",
  buttonLabel: "Conheça nossos produtos",
  buttonLink: "/produtos",
  placement: "hero",
  position: 0,
  active: true,
  startsAt: "",
  endsAt: "",
  mediaId: null,
  thumbUrl: null,
};

export function BannersManager({ initial }: { initial: Banner[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Omit<Banner, "id">>(EMPTY);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function create(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const response = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        startsAt: draft.startsAt || null,
        endsAt: draft.endsAt || null,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? "Não foi possível salvar o banner.");
      return;
    }
    setDraft(EMPTY);
    router.refresh();
  }

  async function patch(id: string, data: Record<string, unknown>) {
    await fetch(`/api/admin/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este banner?")) return;
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function handlePick(media: MediaRef[]) {
    const first = media[0];
    if (first) setDraft((current) => ({ ...current, mediaId: first.id, thumbUrl: first.thumbUrl }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-3">
        {initial.length === 0 ? (
          <div className="card p-8 text-center text-muted">Nenhum banner cadastrado.</div>
        ) : (
          initial.map((banner) => (
            <div key={banner.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                {banner.thumbUrl ? (
                  <img src={banner.thumbUrl} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-display text-lg">{banner.title || "(sem título)"}</p>
                <p className="truncate text-sm text-muted">{banner.subtitle}</p>
                <p className="mt-1 text-xs text-muted">
                  {banner.placement} • ordem {banner.position}
                  {banner.startsAt ? ` • de ${banner.startsAt}` : ""}
                  {banner.endsAt ? ` até ${banner.endsAt}` : ""}
                </p>
              </div>

              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => patch(banner.id, { active: !banner.active })}
                  className={`badge border px-3 py-1.5 ${
                    banner.active ? "border-success/40 text-success" : "border-line text-muted"
                  }`}
                >
                  {banner.active ? "ativo" : "pausado"}
                </button>
                <button
                  type="button"
                  onClick={() => remove(banner.id)}
                  className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-danger"
                >
                  excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={create} className="card h-fit space-y-3 p-5">
        <h2 className="font-display text-lg">Novo banner</h2>

        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-line bg-white text-sm text-muted transition hover:border-gold"
        >
          {draft.thumbUrl ? (
            <img src={draft.thumbUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            "+ Escolher foto ou video"
          )}
        </button>

        <input
          className="field"
          placeholder="Título"
          value={draft.title}
          onChange={(event) => setDraft({ ...draft, title: event.target.value })}
        />
        <input
          className="field"
          placeholder="Subtítulo"
          value={draft.subtitle}
          onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="field"
            placeholder="Texto do botao"
            value={draft.buttonLabel}
            onChange={(event) => setDraft({ ...draft, buttonLabel: event.target.value })}
          />
          <input
            className="field"
            placeholder="Link"
            value={draft.buttonLink}
            onChange={(event) => setDraft({ ...draft, buttonLink: event.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Início</label>
            <input
              type="date"
              className="field"
              value={draft.startsAt}
              onChange={(event) => setDraft({ ...draft, startsAt: event.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Termino</label>
            <input
              type="date"
              className="field"
              value={draft.endsAt}
              onChange={(event) => setDraft({ ...draft, endsAt: event.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="field-label">Local</label>
            <select
              className="field"
              value={draft.placement}
              onChange={(event) => setDraft({ ...draft, placement: event.target.value })}
            >
              <option value="hero">Destaque da home</option>
              <option value="faixa">Faixa promocional</option>
            </select>
          </div>
          <div>
            <label className="field-label">Ordem</label>
            <input
              type="number"
              className="field"
              value={draft.position}
              onChange={(event) => setDraft({ ...draft, position: Number(event.target.value) })}
            />
          </div>
        </div>

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        <button type="submit" className="btn btn-primary w-full" disabled={saving}>
          {saving ? "Salvando..." : "Publicar banner"}
        </button>

        <MediaPicker
          open={pickerOpen}
          folder="banners"
          multiple={false}
          onClose={() => setPickerOpen(false)}
          onSelect={handlePick}
        />
      </form>
    </div>
  );
}
