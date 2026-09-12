"use client";

import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/whatsapp";

/** Botao flutuante de WhatsApp: sempre acessivel, acima da barra do celular. */
export function WhatsAppFab({ phone, brandName }: { phone: string; brandName: string }) {
  const pathname = usePathname();

  // No carrinho o proprio botao de enviar pedido ja e o WhatsApp: evitamos
  // duplicar a acao e cobrir os campos do formulario no celular.
  if (pathname.startsWith("/carrinho") || pathname.startsWith("/admin")) return null;

  return (
    <a
      href={whatsappLink(phone, `Ola, ${brandName}! Gostaria de falar com vocês.`)}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Falar no WhatsApp"
      className="fixed bottom-[5.5rem] right-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1faa54] text-white shadow-[0_16px_30px_-12px_rgba(31,170,84,0.8)] transition hover:scale-105 lg:bottom-6 lg:right-6"
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-8.6 15.06L2 22l5.1-1.33A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.02.79.8-2.95-.19-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.15c-.25-.13-1.45-.71-1.67-.79-.22-.08-.39-.12-.55.13-.16.25-.63.79-.77.95-.14.16-.28.18-.53.06a6.7 6.7 0 0 1-3.3-2.88c-.25-.43.25-.4.71-1.32.08-.16.04-.3-.02-.42-.06-.13-.55-1.33-.76-1.81-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.25-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64 1.53.66 2.13.72 2.9.6.46-.06 1.45-.59 1.65-1.16.2-.57.2-1.06.14-1.16-.06-.11-.22-.17-.47-.3Z" />
      </svg>
    </a>
  );
}
