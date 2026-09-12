"use client";

import { useState } from "react";

export function CustomOrderForm({ types, brandName }: { types: string[]; brandName: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ code: string; whatsappUrl: string } | null>(null);
  const [reference, setReference] = useState<{ id: string; thumbUrl: string | null } | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleReference(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");

    const body = new FormData();
    body.append("file", file);
    const response = await fetch("/api/custom-orders/upload", { method: "POST", body });
    const payload = await response.json().catch(() => ({}));
    setUploading(false);

    if (!response.ok) {
      setError(payload.error ?? "Não foi possível enviar a imagem.");
      return;
    }
    setReference({ id: payload.data.id, thumbUrl: payload.data.thumbUrl });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("sending");
    setError("");

    const response = await fetch("/api/custom-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        phone: formData.get("phone"),
        desiredDate: formData.get("desiredDate") || null,
        desiredTime: formData.get("desiredTime") || null,
        peopleCount: formData.get("peopleCount") || null,
        categoryName: formData.get("categoryName") || null,
        productName: formData.get("productName") || null,
        description: formData.get("description"),
        notes: formData.get("notes") || null,
        referenceMediaId: reference?.id ?? null,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("idle");
      setError(payload.error ?? "Não foi possível enviar a solicitação.");
      return;
    }

    setResult(payload.data);
    setStatus("done");
    window.open(payload.data.whatsappUrl, "_blank", "noopener");
  }

  if (status === "done" && result) {
    return (
      <div className="card p-10 text-center">
        <p className="kicker">Protocolo {result.code}</p>
        <h2 className="mt-3 font-display text-3xl">Solicitação enviada!</h2>
        <p className="mt-3 text-muted">
          A equipe da {brandName} recebeu sua encomenda e responde com o orçamento pelo WhatsApp.
        </p>
        <a
          href={result.whatsappUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="btn btn-whats mt-6 w-full"
        >
          Abrir conversa no WhatsApp
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="name">
            Nome *
          </label>
          <input id="name" name="name" required minLength={2} className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="phone">
            Telefone / WhatsApp *
          </label>
          <input id="phone" name="phone" required inputMode="tel" className="field" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label" htmlFor="desiredDate">
            Data desejada
          </label>
          <input id="desiredDate" name="desiredDate" type="date" className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="desiredTime">
            Horário
          </label>
          <input id="desiredTime" name="desiredTime" type="time" className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="peopleCount">
            Pessoas
          </label>
          <input id="peopleCount" name="peopleCount" type="number" min={0} className="field" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="categoryName">
            Tipo de encomenda
          </label>
          <select id="categoryName" name="categoryName" className="field">
            <option value="">Selecione</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="productName">
            Produto
          </label>
          <input id="productName" name="productName" placeholder="Ex.: Bolo de chocolate" className="field" />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="description">
          Descrição da encomenda *
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={5}
          rows={4}
          placeholder="Sabor, recheio, tamanho, tema da festa, restrições alimentares..."
          className="field"
        />
      </div>

      <div>
        <label className="field-label" htmlFor="notes">
          Observações
        </label>
        <textarea id="notes" name="notes" rows={2} className="field" />
      </div>

      <div>
        <span className="field-label">Foto de referência</span>
        <div className="flex items-center gap-4">
          <label className="btn btn-outline cursor-pointer">
            {uploading ? "Enviando..." : "Escolher imagem"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleReference}
              disabled={uploading}
            />
          </label>
          {reference?.thumbUrl ? (
            <img
              src={reference.thumbUrl}
              alt="Referência enviada"
              className="h-16 w-16 rounded-xl border border-line object-cover"
            />
          ) : (
            <span className="text-xs text-muted">JPG, PNG ou WEBP até 8 MB</span>
          )}
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button type="submit" className="btn btn-gold w-full" disabled={status === "sending"}>
        {status === "sending" ? "Enviando..." : "Solicitar orçamento"}
      </button>
    </form>
  );
}
