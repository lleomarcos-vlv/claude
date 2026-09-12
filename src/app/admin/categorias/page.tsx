import { CategoriesManager } from "@/components/admin/categories-manager";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Organização</p>
        <h1 className="mt-1 font-display text-3xl">Categorias</h1>
        <p className="mt-1 text-sm text-muted">
          A ordem definida aqui é a ordem que aparece na home e no catalogo.
        </p>
      </header>

      <CategoriesManager
        initial={categories.map((category) => ({
          id: category.id,
          name: category.name,
          emoji: category.emoji ?? "",
          description: category.description ?? "",
          position: category.position,
          active: category.active,
          showOnHome: category.showOnHome,
          forOrders: category.forOrders,
          productCount: category._count.products,
        }))}
      />
    </div>
  );
}
