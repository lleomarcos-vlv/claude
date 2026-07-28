"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { isAppRoute } from "@/lib/routes";

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
};

const STORAGE_KEY = "vf_consent";
export const CONSENT_EVENT = "vf:consent";

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentState) : null;
  } catch {
    return null;
  }
}

function saveConsent(state: ConsentState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* modo privado pode bloquear o storage */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }));
}

/**
 * Banner de consentimento em conformidade com a LGPD.
 *
 * Nenhum script de medição (GA4, GTM, Meta Pixel) é carregado antes da escolha:
 * o <Analytics /> só monta as tags depois do evento de consentimento. As opções
 * ficam disponíveis a qualquer momento pelo link "Cookies" no rodapé.
 */
export function CookieConsent() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  useEffect(() => {
    // Espera a primeira interação/pintura para não competir com o LCP.
    const timer = window.setTimeout(() => setVisible(readConsent() === null), 1200);
    const reopen = () => {
      const current = readConsent();
      setAnalytics(current?.analytics ?? true);
      setMarketing(current?.marketing ?? true);
      setDetails(true);
      setVisible(true);
    };
    window.addEventListener("vf:open-consent", reopen);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("vf:open-consent", reopen);
    };
  }, []);

  function decide(next: { analytics: boolean; marketing: boolean }) {
    saveConsent({ necessary: true, ...next, decidedAt: new Date().toISOString() });
    setVisible(false);
  }

  // Nas áreas logadas o consentimento não aparece (o banner já foi decidido no site).
  if (!visible || isAppRoute(pathname)) return null;

  return (
    <div
      role="dialog"
      aria-label="Preferências de cookies"
      aria-modal="false"
      className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-md"
    >
      <div className="rounded-2xl border border-cinza-200 bg-white p-5 shadow-float">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-verde-100 text-verde-700">
            <Icon name="shield" size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[0.9375rem] font-semibold text-verde-800">Sua privacidade, sua escolha</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-cinza-700">
              Usamos cookies necessários para o site funcionar e, com sua permissão, cookies de medição e
              marketing. Você decide — e pode mudar depois.{" "}
              <Link href="/privacidade" className="font-medium text-verde-600 underline decoration-verde-300 underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>
        </div>

        {details ? (
          <div className="mt-4 space-y-2.5 rounded-xl bg-verde-50 p-3.5">
            <Row
              title="Necessários"
              description="Sessão, segurança e preferências. Não podem ser desativados."
              checked
              disabled
            />
            <Row
              title="Medição"
              description="Google Analytics — entender quais páginas ajudam mais."
              checked={analytics}
              onChange={setAnalytics}
            />
            <Row
              title="Marketing"
              description="Meta Pixel e remarketing — mostrar anúncios relevantes."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => decide({ analytics: true, marketing: true })} className="btn btn-primary btn-sm flex-1">
            Aceitar todos
          </button>
          {details ? (
            <button type="button" onClick={() => decide({ analytics, marketing })} className="btn btn-outline btn-sm flex-1">
              Salvar escolha
            </button>
          ) : (
            <button type="button" onClick={() => setDetails(true)} className="btn btn-outline btn-sm flex-1">
              Personalizar
            </button>
          )}
          <button
            type="button"
            onClick={() => decide({ analytics: false, marketing: false })}
            className="btn btn-ghost btn-sm w-full sm:w-auto"
          >
            Só os necessários
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  title,
  description,
  checked,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? "opacity-70" : "cursor-pointer"}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-cinza-400 text-verde-600 accent-verde-600"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-verde-800">{title}</span>
        <span className="block text-xs leading-relaxed text-cinza-600">{description}</span>
      </span>
    </label>
  );
}

/** Botão usado na página de cookies para reabrir o painel de preferências. */
export function ConsentReopenButton({ className = "btn btn-outline btn-md" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event("vf:open-consent"))}>
      Gerenciar preferências de cookies
    </button>
  );
}
