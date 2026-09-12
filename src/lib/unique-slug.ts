import { prisma } from "./db";
import { randomSuffix, slugify } from "./slug";

async function unique(
  base: string,
  exists: (slug: string) => Promise<string | null>,
  prefix: string,
): Promise<string> {
  const root = slugify(base) || `${prefix}-${randomSuffix()}`;
  let candidate = root;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const foundId = await exists(candidate);
    if (!foundId) return candidate;
    candidate = `${root}-${randomSuffix(3)}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export function uniqueProductSlug(base: string, currentId?: string): Promise<string> {
  return unique(
    base,
    async (slug) => {
      const found = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
      return found && found.id !== currentId ? found.id : null;
    },
    "produto",
  );
}

export function uniqueCategorySlug(base: string, currentId?: string): Promise<string> {
  return unique(
    base,
    async (slug) => {
      const found = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
      return found && found.id !== currentId ? found.id : null;
    },
    "categoria",
  );
}
