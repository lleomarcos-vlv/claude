import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/money";
import { ORDER_STATUS_LABEL } from "@/lib/schemas";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    products,
    activeProducts,
    featuredProducts,
    categories,
    orders,
    newOrders,
    customOrders,
    media,
    videos,
    unreadMessages,
    promotions,
    viewsAgg,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { available: true } }),
    prisma.product.count({ where: { featured: true } }),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "novo" } }),
    prisma.customOrder.count({ where: { status: "novo" } }),
    prisma.mediaAsset.count({ where: { kind: "image" } }),
    prisma.mediaAsset.count({ where: { kind: "video" } }),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.promotion.count({ where: { active: true } }),
    prisma.product.aggregate({ _sum: { viewCount: true } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { items: true } }),
  ]);

  const cards = [
    { label: "Produtos cadastrados", value: products, href: "/admin/produtos", accent: false },
    { label: "Produtos ativos", value: activeProducts, href: "/admin/produtos", accent: false },
    { label: "Em destaque", value: featuredProducts, href: "/admin/produtos", accent: false },
    { label: "Categorias", value: categories, href: "/admin/categorias", accent: false },
    { label: "Pedidos novos", value: newOrders, href: "/admin/pedidos", accent: newOrders > 0 },
    { label: "Pedidos no total", value: orders, href: "/admin/pedidos", accent: false },
    { label: "Encomendas novas", value: customOrders, href: "/admin/encomendas", accent: customOrders > 0 },
    { label: "Promoções ativas", value: promotions, href: "/admin/promocoes", accent: false },
    { label: "Fotos", value: media, href: "/admin/galeria", accent: false },
    { label: "Vídeos", value: videos, href: "/admin/galeria", accent: false },
    { label: "Visualizações", value: viewsAgg._sum.viewCount ?? 0, href: "/admin/produtos", accent: false },
    { label: "Mensagens não lidas", value: unreadMessages, href: "/admin/mensagens", accent: unreadMessages > 0 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">Painel</p>
          <h1 className="mt-1 font-display text-3xl">Bom dia, Villa Reis</h1>
          <p className="mt-1 text-sm text-muted">
            Tudo o que você altera aqui aparece no site na hora.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/produtos/novo" className="btn btn-primary">
            + Novo produto
          </Link>
          <Link href="/" target="_blank" className="btn btn-outline">
            Ver o site
          </Link>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`card p-5 transition hover:-translate-y-0.5 ${
              card.accent ? "border-gold bg-gold/5" : ""
            }`}
          >
            <p className="text-xs uppercase tracking-[0.12em] text-muted">{card.label}</p>
            <p className="mt-2 font-display text-3xl text-espresso">{card.value}</p>
          </Link>
        ))}
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl">Últimos pedidos</h2>
          <Link href="/admin/pedidos" className="text-sm font-semibold text-crust hover:underline">
            Ver todos →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            Nenhum pedido recebido ainda. Os pedidos feitos pelo site aparecem aqui.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="pb-3">Código</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Itens</th>
                  <th className="pb-3">Total</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="py-3 font-mono text-xs">{order.code}</td>
                    <td className="py-3">{order.customerName}</td>
                    <td className="py-3 text-muted">{order.items.length}</td>
                    <td className="py-3 font-semibold">{formatBRL(order.totalCents)}</td>
                    <td className="py-3">
                      <span className="badge bg-cream-deep text-ink">
                        {ORDER_STATUS_LABEL[order.status as keyof typeof ORDER_STATUS_LABEL] ??
                          order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card p-6">
        <h2 className="font-display text-xl">Como cadastrar um produto</h2>
        <ol className="mt-4 space-y-2 text-sm text-muted">
          <li>1. Abra Produtos e clique em Novo produto.</li>
          <li>2. Preencha nome, preço e categoria.</li>
          <li>3. Em Fotos e vídeos, arraste os arquivos ou escolha no computador/celular.</li>
          <li>4. Marque destaque, novidade ou artesanal conforme o caso.</li>
          <li>5. Clique em Salvar produto: ele já aparece no site.</li>
        </ol>
      </section>
    </div>
  );
}
