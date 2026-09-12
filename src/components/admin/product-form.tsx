"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MediaManager } from "./media-manager";
import type { MediaRef } from "./media-picker";
import { centsToInput, parseBRLToCents } from "@/lib/money";

export type ProductFormValues = {
  id?: string;
  name: string;
  shortDesc: string;
  description: string;
  ingredients: string;
  extraInfo: string;
  priceCents: number;
  unit: string;
  categoryId: string;
  available: boolean;
  featured: boolean;
  isNew: boolean;
  artisanal: boolean;
  orderable: boolean;
  position: number;
  mainImageId: string | null;
  media: MediaRef[];
};

const UNITS = ["un", "kg", "500g", "fatia", "caixa", "duzia", "litro", "porcao"];

export function ProductForm({
  initial,
  categories,
}: {
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [priceInput, setPriceInput] = useState(centsToInput(initial.priceCents));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      name: values.name,
      shortDesc: values.shortDesc,
      description: values.description,
      ingredients: values.ingredients,
      extraInfo: values.extraInfo,
      priceCents: parseBRLToCents(priceInput),
      unit: values.unit,
      categoryId: values.categoryId,
      available: values.available,
      featured: values.featured,
      isNew: values.isNew,
      artisanal: values.artisanal,
      orderable: values.orderable,
      position: values.position,
      mainImageId: values.mainImageId,
      mediaIds: values.media.map((item) => item.id),
    };

    const response = await fetch(
      values.id ? `/api/admin/products/${values.id}` : "/api/admin/products",
      {
        method: values.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setError(result.error ?? "Não foi possível salvar o produto.");
      return;
    }

    router.push("/admin/produtos");
    router.refresh();
  }

  async function handleDelete() {
    if (!values.id) return;
    if (!window.confirm(`Excluir "${values.name}"? Esta ação não pode ser desfeita.`)) return;
    await fetch(`/api/admin/products/${values.id}`, { method: "DELETE" });
    router.push("/admin/produtos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="card p-6">
        <h2 className="font-display text-xl">Informações do produto</h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="name">
              Nome *
            </label>
            <input
              id="name"
              required
              className="field"
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
              placeholder="Ex.: Croissant Villa Reis"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="price">
              Preço (R$) *
            </label>
            <input
              id="price"
              required
              inputMode="decimal"
              className="field"
              value={priceInput}
              onChange={(event) => setPriceInput(event.target.value)}
              placeholder="9,90"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="unit">
              Unidade
            </label>
            <select
              id="unit"
              className="field"
              value={values.unit}
              onChange={(event) => set("unit", event.target.value)}
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="categoryId">
              Categoria *
            </label>
            <select
              id="categoryId"
              required
              className="field"
              value={values.categoryId}
              onChange={(event) => set("categoryId", event.target.value)}
            >
              <option value="">Selecionar</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label" htmlFor="position">
              Ordem de exibição
            </label>
            <input
              id="position"
              type="number"
              min={0}
              className="field"
              value={values.position}
              onChange={(event) => set("position", Number(event.target.value))}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="shortDesc">
              Descrição curta (aparece no card)
            </label>
            <input
              id="shortDesc"
              className="field"
              value={values.shortDesc}
              onChange={(event) => set("shortDesc", event.target.value)}
              placeholder="Croissant artesanal de massa folhada"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="description">
              Descrição completa
            </label>
            <textarea
              id="description"
              rows={4}
              className="field"
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="ingredients">
              Ingredientes
            </label>
            <textarea
              id="ingredients"
              rows={3}
              className="field"
              value={values.ingredients}
              onChange={(event) => set("ingredients", event.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="extraInfo">
              Informações adicionais
            </label>
            <textarea
              id="extraInfo"
              rows={3}
              className="field"
              value={values.extraInfo}
              onChange={(event) => set("extraInfo", event.target.value)}
              placeholder="Validade, conservação, alergênicos..."
            />
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-xl">Fotos e vídeos</h2>
        <p className="mt-1 text-sm text-muted">
          Envie direto do computador ou do celular. Guardamos o arquivo original e geramos as
          versões otimizadas automaticamente.
        </p>
        <div className="mt-5">
          <MediaManager
            media={values.media}
            mainImageId={values.mainImageId}
            onChange={(media) => set("media", media)}
            onMainChange={(id) => set("mainImageId", id)}
          />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-display text-xl">Exibição no site</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Toggle
            label="Produto disponível"
            hint="Desmarque para esconder do site sem excluir"
            checked={values.available}
            onChange={(value) => set("available", value)}
          />
          <Toggle
            label="Mais pedido (destaque)"
            hint="Aparece na secao Mais pedidos da home"
            checked={values.featured}
            onChange={(value) => set("featured", value)}
          />
          <Toggle
            label="Novidade"
            hint="Aparece na secao Novidades"
            checked={values.isNew}
            onChange={(value) => set("isNew", value)}
          />
          <Toggle
            label="Feito na Villa Reis"
            hint="Entra na vitrine de produtos artesanais"
            checked={values.artisanal}
            onChange={(value) => set("artisanal", value)}
          />
          <Toggle
            label="Pode ser adicionado ao carrinho"
            hint="Desmarque para itens so sob encomenda"
            checked={values.orderable}
            onChange={(value) => set("orderable", value)}
          />
        </div>
      </section>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-line bg-cream/95 py-4 backdrop-blur">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Salvando..." : "Salvar produto"}
        </button>
        <button type="button" className="btn btn-outline" onClick={() => router.back()}>
          Cancelar
        </button>
        {values.id ? (
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-outline ml-auto text-danger"
          >
            Excluir produto
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-white p-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-5 w-5 accent-[#C08A35]"
      />
      <span>
        <span className="block text-sm font-semibold text-espresso">{label}</span>
        {hint ? <span className="block text-xs text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}
