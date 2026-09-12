"use client";

import { useRouter } from "next/navigation";
import { whatsappLink } from "@/lib/whatsapp";

type Message = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  read: boolean;
  createdAt: string;
};

export function MessagesList({ messages }: { messages: Message[] }) {
  const router = useRouter();

  async function toggleRead(id: string, read: boolean) {
    await fetch(`/api/admin/messages/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read }),
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir esta mensagem?")) return;
    await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
    router.refresh();
  }

  if (messages.length === 0) {
    return <div className="card p-10 text-center text-muted">Nenhuma mensagem recebida.</div>;
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <article
          key={message.id}
          className={`card p-5 ${message.read ? "" : "border-gold bg-gold/5"}`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-display text-lg">{message.name}</p>
              <p className="text-sm text-muted">
                {[message.phone, message.email].filter(Boolean).join(" • ")} •{" "}
                {new Date(message.createdAt).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div className="flex gap-1.5">
              {message.phone ? (
                <a
                  href={whatsappLink(message.phone, `Ola, ${message.name}!`)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-success"
                >
                  whatsapp
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => toggleRead(message.id, !message.read)}
                className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-espresso"
              >
                {message.read ? "marcar não lida" : "marcar lida"}
              </button>
              <button
                type="button"
                onClick={() => remove(message.id)}
                className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-muted hover:text-danger"
              >
                excluir
              </button>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-line text-sm">{message.message}</p>
        </article>
      ))}
    </div>
  );
}
