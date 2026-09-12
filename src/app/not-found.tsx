import Link from "next/link";

export default function NotFound() {
  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="kicker">Erro 404</p>
      <h1 className="mt-3 font-display text-4xl">Essa fornada ainda não saiu</h1>
      <p className="mt-3 max-w-md text-muted">
        A página que você procurou não existe ou foi movida. Que tal começar pelo catalogo?
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">
          Voltar ao início
        </Link>
        <Link href="/produtos" className="btn btn-outline">
          Ver produtos
        </Link>
      </div>
    </div>
  );
}
