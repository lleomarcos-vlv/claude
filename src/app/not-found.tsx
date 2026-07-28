import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import { nav } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-24 text-center">
      <Link href="/" aria-label="Verde Fixo">
        <Logo height={30} />
      </Link>

      <p className="mt-16 text-8xl font-semibold tracking-[-0.04em] text-verde-200 sm:text-9xl">404</p>
      <h1 className="mt-4 text-title font-semibold text-verde-800">Este caminho não tem jardim</h1>
      <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-cinza-700">
        A página que você procurou não existe ou foi movida. Vamos te levar de volta ao verde.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary btn-lg">
          <Icon name="home" size={18} />
          Voltar ao início
        </Link>
        <Link href="/agendamento" className="btn btn-outline btn-lg">
          Agendar serviço
        </Link>
      </div>

      <nav aria-label="Páginas principais" className="mt-12 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="text-cinza-600 hover:text-verde-700">
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
