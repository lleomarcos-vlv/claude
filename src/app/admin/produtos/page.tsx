import Link from "next/link";
import { prisma } from "@/lib/db";
import { mediaUrls } from "@/lib/media";
import { formatBRL } from "@/lib/money";
import { ProductRowActions } from "@/components/admin/product-row-actions";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q } } : undefined,
    include: { category: true, mainImage: true, promotions: true },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Catalogo</p>
          <h1 className="mt-1 font-display text-3xl">Produtos</h1>
          <p className="mt-1 text-sm text-muted">{products.length} produto(s) cadastrado(s)</p>
        </div>
        <Link href="/admin/produtos/novo" className="btn btn-primary">
          + Novo produto
        </Link>
      </header>

      <form className="flex gap-2" action="/admin/produtos">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar por nome"
          className="field max-w-sm"
        />
        <button className="btn btn-outline" type="submit">
          Buscar
        </button>
      </form>

      {products.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="font-display text-2xl">Nenhum produto ainda</p>
          <p className="mt-2 text-muted">Cadastre o primeiro item do cardapio.</p>
          <Link href="/admin/produtos/novo" className="btn btn-primary mt-6">
            + Novo produto
          </Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="p-4">Produto</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Preço</th>
                <th className="p-4">Situação</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((product) => {
                const image = mediaUrls(product.mainImage, product.name);
                return (
                  <tr key={product.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-cream-deep">
                          {image ? (
                            <img src={image.thumb} alt="" className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/admin/produtos/${product.id}`}
                            className="block truncate font-medium text-espresso hover:text-crust"
                          >
                            {product.name}
                          </Link>
                          <p className="truncate text-xs text-muted">{product.viewCount} visualizações</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-muted">{product.category.name}</td>
                    <td className="p-4 font-semibold">{formatBRL(product.priceCents)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        <span
                          className={`badge ${
                            product.available ? "bg-success/15 text-success" : "bg-danger/10 text-danger"
                          }`}
                        >
                          {product.available ? "ativo" : "oculto"}
                        </span>
                        {product.featured ? (
                          <span className="badge bg-gold/20 text-crust">destaque</span>
                        ) : null}
                        {product.isNew ? (
                          <span className="badge bg-espresso/10 text-espresso">novidade</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4">
                      <ProductRowActions
                        id={product.id}
                        available={product.available}
                        featured={product.featured}
                        name={product.name}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
