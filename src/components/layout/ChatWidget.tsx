"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LogoMark } from "@/components/brand/Logo";
import { site, whatsappLink } from "@/lib/site";

type Message = { role: "user" | "bot"; text: string; quickReplies?: string[]; link?: { href: string; label: string } };

const OPENING: Message = {
  role: "bot",
  text: "Oi! Sou a assistente da Verde Fixo 🌿 Posso te ajudar com preço, agendamento ou planos. O que você precisa?",
  quickReplies: ["Quero um orçamento", "Quanto custa?", "Como funcionam os planos?", "Quero agendar"],
};

/**
 * Chat de atendimento. Responde na hora as dúvidas mais frequentes com base
 * nas regras de preço do catálogo e, quando o assunto exige uma pessoa,
 * captura o contato e registra o lead em /api/chat para a equipe retomar.
 */
export function ChatWidget({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [messages, setMessages] = useState<Message[]>([OPENING]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  async function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-8).map((m) => ({ role: m.role, text: m.text })),
        }),
      });
      const data = (await res.json()) as { reply: string; quickReplies?: string[]; link?: Message["link"] };
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: data.reply, quickReplies: data.quickReplies, link: data.link },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Tive um problema para responder agora. Chama no WhatsApp que respondemos na hora.",
          link: { href: whatsappLink(), label: "Abrir WhatsApp" },
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-label="Chat de atendimento Verde Fixo"
      className="pointer-events-auto flex h-[min(30rem,72vh)] w-[min(23rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-cinza-200 bg-white shadow-float"
    >
      {/* Cabeçalho */}
      <div className="flex items-center gap-3 border-b border-cinza-200 bg-verde-800 px-4 py-3.5 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
          <LogoMark size={20} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Atendimento Verde Fixo</p>
          <p className="flex items-center gap-1.5 text-xs text-verde-300">
            <span className="h-1.5 w-1.5 rounded-full bg-verde-300 animate-shimmer" />
            Resposta imediata
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Fechar chat"
          className="flex h-8 w-8 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        >
          <Icon name="x" size={18} />
        </button>
      </div>

      {/* Conversa */}
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-verde-50/60 px-4 py-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                m.role === "user"
                  ? "rounded-br-md bg-verde-600 text-white"
                  : "rounded-bl-md border border-cinza-200 bg-white text-cinza-800"
              }`}
            >
              {m.text}
              {m.link ? (
                <Link
                  href={m.link.href}
                  target={m.link.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener"
                  onClick={() => onOpenChange(false)}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-verde-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-verde-700"
                >
                  {m.link.label}
                  <Icon name="arrow-right" size={14} />
                </Link>
              ) : null}
            </div>
          </div>
        ))}

        {busy ? (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl rounded-bl-md border border-cinza-200 bg-white px-4 py-3">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-verde-400 animate-shimmer"
                  style={{ animationDelay: `${i * 180}ms` }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Respostas rápidas da última mensagem do bot */}
        {!busy && messages.at(-1)?.role === "bot" && messages.at(-1)?.quickReplies?.length ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {messages.at(-1)!.quickReplies!.map((reply) => (
              <button
                key={reply}
                type="button"
                onClick={() => ask(reply)}
                className="rounded-full border border-verde-300 bg-white px-3 py-1.5 text-xs font-medium text-verde-700 transition-colors hover:bg-verde-100"
              >
                {reply}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Campo de envio */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-center gap-2 border-t border-cinza-200 bg-white px-3 py-3"
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escreva sua dúvida…"
          aria-label="Sua mensagem"
          maxLength={1000}
          className="h-10 flex-1 rounded-full border border-cinza-300 px-4 text-sm placeholder:text-cinza-400 focus:border-verde-500 focus:outline-2 focus:outline-verde-500/25"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          aria-label="Enviar mensagem"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-verde-600 text-white transition-colors hover:bg-verde-700 disabled:opacity-40"
        >
          <Icon name="send" size={18} />
        </button>
      </form>

      <a
        href={whatsappLink()}
        target="_blank"
        rel="noopener"
        className="flex items-center justify-center gap-2 border-t border-cinza-200 bg-verde-50 py-2.5 text-xs font-medium text-verde-700 hover:bg-verde-100"
      >
        <Icon name="whatsapp" size={15} />
        Prefere WhatsApp? {site.whatsappLabel}
      </a>
    </div>
  );
}
