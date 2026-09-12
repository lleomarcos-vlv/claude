import { prisma } from "./db";
import { mediaUrls, type MediaUrls } from "./media";
import { resolvePrice } from "./pricing";

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  unit: string;
  available: boolean;
  orderable: boolean;
  featured: boolean;
  isNew: boolean;
  artisanal: boolean;
  priceCents: number;
  oldPriceCents: number | null;
  discountPct: number;
  onSale: boolean;
  categoryName: string;
  categorySlug: string;
  image: MediaUrls | null;
};

const productInclude = {
  category: { select: { name: true, slug: true } },
  mainImage: true,
  promotions: true,
  media: { include: { media: true }, orderBy: { position: "asc" } },
} as const;

type ProductWithRelations = Awaited<
  ReturnType<typeof prisma.product.findFirstOrThrow<{ include: typeof productInclude }>>
>;

export function toProductCard(product: ProductWithRelations): ProductCard {
  const price = resolvePrice(product);
  const firstImage =
    product.mainImage ?? product.media.find((item) => item.media.kind === "image")?.media ?? null;
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    shortDesc: product.shortDesc,
    unit: product.unit,
    available: product.available,
    orderable: product.orderable,
    featured: product.featured,
    isNew: product.isNew,
    artisanal: product.artisanal,
    priceCents: price.priceCents,
    oldPriceCents: price.oldPriceCents,
    discountPct: price.discountPct,
    onSale: price.onSale,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    image: mediaUrls(firstImage, product.name),
  };
}

export async function listProducts(filters?: {
  categorySlug?: string;
  search?: string;
  featured?: boolean;
  isNew?: boolean;
  artisanal?: boolean;
  onSaleOnly?: boolean;
  take?: number;
}): Promise<ProductCard[]> {
  const products = await prisma.product.findMany({
    where: {
      available: true,
      category: { active: true },
      ...(filters?.categorySlug ? { category: { slug: filters.categorySlug, active: true } } : {}),
      ...(filters?.featured ? { featured: true } : {}),
      ...(filters?.isNew ? { isNew: true } : {}),
      ...(filters?.artisanal ? { artisanal: true } : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search } },
              { shortDesc: { contains: filters.search } },
              { description: { contains: filters.search } },
            ],
          }
        : {}),
    },
    include: productInclude,
    orderBy: [{ position: "asc" }, { name: "asc" }],
    // Com onSaleOnly o corte precisa vir DEPOIS do filtro de promoção ativa,
    // senão ofertas fora das primeiras posições somem da vitrine.
    take: filters?.onSaleOnly ? undefined : filters?.take,
  });

  const cards = products.map(toProductCard);
  if (!filters?.onSaleOnly) return cards;
  const onSale = cards.filter((card) => card.onSale);
  return filters.take ? onSale.slice(0, filters.take) : onSale;
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: productInclude,
  });
  if (!product || !product.available) return null;

  const gallery = product.media
    .map((item) => mediaUrls(item.media, product.name))
    .filter((item): item is MediaUrls => Boolean(item));

  const mainImage = mediaUrls(product.mainImage, product.name);
  const images = mainImage
    ? [mainImage, ...gallery.filter((item) => item.original !== mainImage.original && item.kind === "image")]
    : gallery.filter((item) => item.kind === "image");

  return {
    card: toProductCard(product),
    description: product.description,
    ingredients: product.ingredients,
    extraInfo: product.extraInfo,
    images,
    videos: gallery.filter((item) => item.kind === "video"),
  };
}

export async function listCategories(options?: { onlyHome?: boolean; onlyOrders?: boolean }) {
  const categories = await prisma.category.findMany({
    where: {
      active: true,
      ...(options?.onlyHome ? { showOnHome: true } : {}),
      ...(options?.onlyOrders ? { forOrders: true } : {}),
    },
    include: { image: true, _count: { select: { products: { where: { available: true } } } } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    emoji: category.emoji,
    description: category.description,
    productCount: category._count.products,
    image: mediaUrls(category.image, category.name),
  }));
}

export async function listHeroBanners() {
  const now = new Date();
  const banners = await prisma.banner.findMany({
    where: {
      active: true,
      placement: "hero",
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    include: { media: true },
    orderBy: { position: "asc" },
  });

  return banners.map((banner) => ({
    id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    buttonLabel: banner.buttonLabel,
    buttonLink: banner.buttonLink,
    media: mediaUrls(banner.media, banner.title ?? "Padaria Villa Reis"),
  }));
}

export async function listGallery(take = 12) {
  const items = await prisma.galleryItem.findMany({
    where: { active: true },
    include: { media: true },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    take,
  });
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    caption: item.caption,
    media: mediaUrls(item.media, item.title ?? "Padaria Villa Reis"),
  }));
}

export async function listInstagramPosts(take = 6) {
  const posts = await prisma.instagramPost.findMany({
    where: { active: true },
    include: { media: true },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
    take,
  });
  return posts.map((post) => ({
    id: post.id,
    caption: post.caption,
    link: post.link,
    media: mediaUrls(post.media, post.caption ?? "Padaria Villa Reis"),
  }));
}
