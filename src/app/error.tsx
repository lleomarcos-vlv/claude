"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[erro de página]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-24 text-center">
      <Link href="/" aria-label="Verde Fixo">
        <Logo height={30} />
      </Link>

      <span className="mt-16 flex h-16 w-16 items-center justify-center rounded-full bg-ambar-50 text-ambar-600">
        <Icon name="alert" size={30} />
      </span>
      <h1 className="mt-6 text-title font-semibold text-verde-800">Algo deu errado</h1>
      <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-cinza-700">
        Tivemos um problema inesperado ao carregar esta página. Tente novamente — se persistir, chame nossa equipe.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn btn-primary btn-lg">
          <Icon name="refresh" size={18} />
          Tentar novamente
        </button>
        <Link href="/" className="btn btn-outline btn-lg">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
