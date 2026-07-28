"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { trackConversion } from "@/components/layout/Analytics";

/**
 * Inscrição na newsletter. Sem captcha visível — o servidor aplica rate limit e
 * honeypot, mantendo o atrito perto de zero para um campo de baixo risco.
 */
export function NewsletterForm({ source = "site", variant = "light" }: { source?: string; variant?: "light" | "dark" }) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [renderedAt] = useState(() => Date.now());
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const dark = variant === "dark";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source, honeypot, renderedAt }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };

      if (!res.ok || !data.ok) {
        setState("error");
        setMessage(data.error ?? "Não foi possível concluir a inscrição.");
        return;
      }
      setState("done");
      setMessage(data.message ?? "Inscrição confirmada!");
      trackConversion("newsletter_inscrito", { source });
    } catch {
      setState("error");
      setMessage("Falha de conexão. Tente novamente.");
    }
  }

  if (state === "done") {
    return (
      <div
        className={`flex items-start gap-3 rounded-2xl border p-5 ${
          dark ? "border-white/20 bg-white/10 text-white" : "border-verde-300 bg-verde-50 text-verde-800"
        }`}
        role="status"
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${dark ? "bg-verde-300 text-verde-800" : "bg-verde-600 text-white"}`}>
          <Icon name="check" size={18} />
        </span>
        <div>
          <p className="font-semibold">Pronto, você está na lista 🌿</p>
          <p className={`mt-1 text-sm ${dark ? "text-verde-200" : "text-cinza-700"}`}>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label htmlFor={`news-${source}`} className="sr-only">
          Seu e-mail
        </label>
        <input
          id={`news-${source}`}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com.br"
          autoComplete="email"
          className={`h-13 flex-1 rounded-full px-5 text-[0.9375rem] transition-colors focus:outline-2 focus:outline-offset-2 ${
            dark
              ? "border border-white/20 bg-white/10 text-white placeholder:text-verde-300/70 focus:border-verde-300 focus:outline-verde-300/40"
              : "border border-cinza-300 bg-white text-verde-800 placeholder:text-cinza-400 focus:border-verde-500 focus:outline-verde-500/30"
          }`}
        />
        <button
          type="submit"
          disabled={state === "loading"}
          className={`btn btn-lg shrink-0 ${dark ? "btn-accent" : "btn-primary"}`}
        >
          {state === "loading" ? <Icon name="spinner" size={18} className="animate-spin" /> : null}
          Quero receber
        </button>
      </div>

      {/* Honeypot */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>

      {state === "error" ? (
        <p className={`mt-2.5 flex items-center gap-1.5 text-sm ${dark ? "text-ambar-200" : "text-red-600"}`} role="alert">
          <Icon name="alert" size={15} />
          {message}
        </p>
      ) : (
        <p className={`mt-2.5 text-xs ${dark ? "text-verde-300/80" : "text-cinza-600"}`}>
          Um e-mail por mês. Cancele quando quiser. Veja a{" "}
          <Link href="/privacidade" className={dark ? "underline hover:text-white" : "underline hover:text-verde-700"}>
            Política de Privacidade
          </Link>
          .
        </p>
      )}
    </form>
  );
}
