"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { FormAlert, SubmitButton, TextArea } from "@/components/forms/fields";

export function SurveyForm({ protocol, serviceName }: { protocol: string; serviceName: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [publish, setPublish] = useState(true);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    if (!rating) {
      setAlert("Escolha de 1 a 5 estrelas para enviar.");
      return;
    }

    setLoading(true);
    setAlert("");

    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ protocol, rating, npsScore: nps, comment, publish }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setAlert(data.error ?? "Não foi possível enviar sua avaliação.");
        return;
      }
      setDone(true);
    } catch {
      setAlert("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <p className="text-5xl">{rating >= 4 ? "🌿" : "🙏"}</p>
        <h2 className="mt-4 text-title font-semibold text-verde-800">Obrigado pelo retorno!</h2>
        <p className="mt-3 text-[0.9375rem] leading-relaxed text-cinza-700">
          {rating >= 4
            ? "Que bom que você gostou! Sua avaliação ajuda muito nossa equipe."
            : "Sentimos muito que não tenha ficado perfeito. Nossa equipe vai entrar em contato para resolver."}
        </p>
        <Link href="/" className="btn btn-primary btn-md mt-7">
          Voltar ao site
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-7">
      {alert ? <FormAlert kind="error">{alert}</FormAlert> : null}

      {/* Estrelas */}
      <fieldset className="text-center">
        <legend className="label mb-4 justify-center text-base">Que nota você dá para o serviço?</legend>
        <div className="flex justify-center gap-1.5" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              aria-label={`${value} ${value === 1 ? "estrela" : "estrelas"}`}
              className="p-1 transition-transform hover:scale-110"
            >
              <Icon
                name="star"
                size={40}
                filled={(hover || rating) >= value}
                className={(hover || rating) >= value ? "text-ambar-400" : "text-cinza-300"}
                style={{ color: (hover || rating) >= value ? "#f2c95e" : undefined }}
              />
            </button>
          ))}
        </div>
        {rating ? (
          <p className="mt-3 text-sm font-medium text-verde-700">
            {["", "Que pena…", "Podia ser melhor", "Foi ok", "Muito bom!", "Perfeito! 🌿"][rating]}
          </p>
        ) : null}
      </fieldset>

      {/* NPS */}
      <fieldset>
        <legend className="label">De 0 a 10, quanto você recomendaria a Verde Fixo?</legend>
        <div className="mt-2 grid grid-cols-11 gap-1.5">
          {Array.from({ length: 11 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setNps(i)}
              aria-pressed={nps === i}
              className={`flex h-10 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                nps === i
                  ? "border-verde-500 bg-verde-600 text-white"
                  : "border-cinza-300 text-cinza-700 hover:border-verde-400 hover:bg-verde-50"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-cinza-600">
          <span>Nada provável</span>
          <span>Muito provável</span>
        </div>
      </fieldset>

      <TextArea
        label="Quer deixar um comentário? (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={`Conte como foi o serviço de ${serviceName.toLowerCase()}…`}
      />

      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-verde-600"
        />
        <span className="text-sm leading-relaxed text-cinza-700">
          Autorizo a Verde Fixo a publicar meu comentário (com meu primeiro nome e cidade) no site.
        </span>
      </label>

      <SubmitButton loading={loading}>Enviar avaliação</SubmitButton>
    </form>
  );
}
