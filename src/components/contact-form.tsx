"use client";

import { useState } from "react";

export function ContactForm({ className = "" }: { className?: string }) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    setError("");

    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setStatus("error");
      setError(payload.error ?? "Não foi possível enviar. Tente novamente.");
      return;
    }

    form.reset();
    setStatus("done");
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
      <div>
        <label className="field-label" htmlFor="contact-name">
          Nome
        </label>
        <input id="contact-name" name="name" required minLength={2} className="field" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="contact-phone">
            Telefone
          </label>
          <input id="contact-phone" name="phone" inputMode="tel" className="field" />
        </div>
        <div>
          <label className="field-label" htmlFor="contact-email">
            E-mail
          </label>
          <input id="contact-email" name="email" type="email" className="field" />
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="contact-message">
          Mensagem
        </label>
        <textarea id="contact-message" name="message" required minLength={5} rows={4} className="field" />
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {status === "done" ? (
        <p className="text-sm text-success">Mensagem enviada. Obrigado pelo contato!</p>
      ) : null}

      <button type="submit" className="btn btn-primary w-full" disabled={status === "sending"}>
        {status === "sending" ? "Enviando..." : "Enviar mensagem"}
      </button>
    </form>
  );
}
