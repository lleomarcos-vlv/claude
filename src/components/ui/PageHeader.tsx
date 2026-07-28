import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/** Cabeçalho padrão das páginas internas, com trilha de navegação. */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
  actions,
  tone = "light",
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  breadcrumb?: { label: string; href?: string }[];
  actions?: ReactNode;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";

  return (
    <section className={dark ? "bg-mesh-verde pt-28 pb-16 sm:pt-36 sm:pb-20" : "border-b border-cinza-200 bg-verde-50 pt-28 pb-14 sm:pt-36 sm:pb-16"}>
      <div className="container-page">
        {breadcrumb?.length ? (
          <nav aria-label="Trilha de navegação" className="mb-6">
            <ol className={`flex flex-wrap items-center gap-1.5 text-sm ${dark ? "text-verde-300" : "text-cinza-600"}`}>
              <li>
                <Link href="/" className={dark ? "hover:text-white" : "hover:text-verde-700"}>
                  Início
                </Link>
              </li>
              {breadcrumb.map((item) => (
                <li key={item.label} className="flex items-center gap-1.5">
                  <Icon name="chevron-right" size={13} className="opacity-50" />
                  {item.href ? (
                    <Link href={item.href} className={dark ? "hover:text-white" : "hover:text-verde-700"}>
                      {item.label}
                    </Link>
                  ) : (
                    <span className={dark ? "text-white" : "text-verde-800"} aria-current="page">
                      {item.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        <div className={actions ? "flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between" : ""}>
          <div className="max-w-3xl">
            {eyebrow ? <p className={`eyebrow ${dark ? "text-verde-300" : ""}`}>{eyebrow}</p> : null}
            <h1 className={`mt-3 text-display font-semibold ${dark ? "text-white" : "text-verde-800"}`}>{title}</h1>
            {description ? (
              <div className={`mt-5 text-lg leading-relaxed ${dark ? "text-verde-200" : "text-cinza-700"}`}>{description}</div>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      </div>
    </section>
  );
}
