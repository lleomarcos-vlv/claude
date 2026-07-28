"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, readConsent, type ConsentState } from "@/components/layout/CookieConsent";

export type MeasurementIds = { gtmId?: string; gaId?: string; metaPixelId?: string };

/**
 * Carrega as tags de medição apenas depois do consentimento (LGPD) e sempre com
 * `strategy="afterInteractive"`, para não entrar no caminho crítico do LCP.
 *
 * Os IDs chegam do servidor (painel administrativo ou variáveis de ambiente).
 * Sem IDs configurados nada é injetado — o site roda igual.
 */
export function Analytics({ gtmId, gaId, metaPixelId }: MeasurementIds) {
  const [consent, setConsent] = useState<ConsentState | null>(null);

  useEffect(() => {
    setConsent(readConsent());
    const onConsent = (e: Event) => setConsent((e as CustomEvent<ConsentState>).detail);
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  if (!consent) return null;

  return (
    <>
      {consent.analytics && gtmId ? (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      ) : null}

      {consent.analytics && gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}
gtag('js',new Date());
gtag('consent','default',{analytics_storage:'granted',ad_storage:'${consent.marketing ? "granted" : "denied"}'});
gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      ) : null}

      {consent.marketing && metaPixelId ? (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}

/**
 * Dispara um evento de conversão nas três plataformas de uma vez.
 * Usado nos formulários (agendamento, orçamento, assinatura, newsletter).
 */
export function trackConversion(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const w = window as typeof window & {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  };

  w.dataLayer?.push({ event, ...params });
  w.gtag?.("event", event, params);

  const metaEvent =
    event === "agendamento_concluido"
      ? "Schedule"
      : event === "orcamento_enviado"
        ? "Lead"
        : event === "assinatura_iniciada"
          ? "InitiateCheckout"
          : event === "assinatura_concluida"
            ? "Subscribe"
            : event === "newsletter_inscrito"
              ? "CompleteRegistration"
              : null;
  if (metaEvent) w.fbq?.("track", metaEvent, params);
}
