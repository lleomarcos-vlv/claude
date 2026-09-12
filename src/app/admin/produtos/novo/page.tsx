import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { position: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="space-y-6">
      <header>
        <Link href="/admin/produtos" className="text-sm text-muted hover:text-crust">
          ← Produtos
        </Link>
        <h1 className="mt-2 font-display text-3xl">Novo produto</h1>
      </header>

      {categories.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="font-display text-xl">Cadastre uma categoria primeiro</p>
          <Link href="/admin/categorias" className="btn btn-primary mt-4">
            Ir para categorias
          </Link>
        </div>
      ) : (
        <ProductForm
          categories={categories}
          initial={{
            name: "",
            shortDesc: "",
            description: "",
            ingredients: "",
            extraInfo: "",
            priceCents: 0,
            unit: "un",
            categoryId: categories[0].id,
            available: true,
            featured: false,
            isNew: true,
            artisanal: false,
            orderable: true,
            position: 0,
            mainImageId: null,
            media: [],
          }}
        />
      )}
    </div>
  );
}
