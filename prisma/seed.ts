/**
 * Dados iniciais da Padaria Villa Reis.
 * Roda com: npm run seed
 *
 * Cria o administrador, as configurações, as categorias, um catalogo de
 * demonstração com imagens geradas, banners, galeria, promoções e pedidos
 * de exemplo. Reexecutar e seguro: registros existentes são mantidos.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generatePlaceholder } from "./seed-images";
import { processUpload } from "../src/lib/media";
import { DEFAULT_SETTINGS } from "../src/lib/settings";
import { slugify } from "../src/lib/slug";
import { discountPercent } from "../src/lib/money";

try {
  process.loadEnvFile?.(".env");
} catch {
  /* .env opcional quando as variaveis já estão no ambiente */
}

const prisma = new PrismaClient();

type SeedProduct = {
  name: string;
  price: number;
  short: string;
  description: string;
  ingredients: string;
  featured?: boolean;
  isNew?: boolean;
  artisanal?: boolean;
  unit?: string;
  orderable?: boolean;
};

const CATEGORIES: {
  name: string;
  emoji: string;
  palette: string;
  description: string;
  forOrders?: boolean;
  products: SeedProduct[];
}[] = [
  {
    name: "Pães",
    emoji: "🥖",
    palette: "paes",
    description: "Fermentação lenta, crosta crocante e miolo alveolado.",
    products: [
      {
        name: "Pão Francês da Casa",
        price: 1490,
        short: "Crocante por fora, macio por dentro, saindo do forno o dia todo.",
        description:
          "Nosso pão francês passa por fermentação controlada de 16 horas, o que garante casca fina e crocante e miolo leve. Preço por quilo.",
        ingredients: "Farinha de trigo, agua, sal, fermento biologico, melhorador natural.",
        featured: true,
        unit: "kg",
      },
      {
        name: "Pão de Fermentação Natural",
        price: 3200,
        short: "Massa madre de 24 horas, casca escura e sabor levemente acido.",
        description:
          "Feito apenas com farinha, agua e sal, fermentado com nosso levain de 6 anos. Vai bem com manteiga, azeite ou queijo.",
        ingredients: "Farinha de trigo, farinha integral, agua, sal marinho, levain.",
        featured: true,
        artisanal: true,
      },
      {
        name: "Pão de Queijo Mineiro",
        price: 4890,
        short: "Polvilho azedo e queijo canastra curado.",
        description: "Assado a cada duas horas. Vendido por quilo, quentinho.",
        ingredients: "Polvilho azedo, queijo canastra, ovos, leite, oleo, sal.",
        featured: true,
        unit: "kg",
      },
      {
        name: "Croissant Villa Reis",
        price: 990,
        short: "Croissant artesanal de massa folhada com manteiga francêsa.",
        description:
          "Sessenta e quatro camadas de massa folhada, dobradas a mao e assadas na hora. O classico da casa.",
        ingredients: "Farinha de trigo, manteiga, leite, ovos, açúcar, sal, fermento.",
        featured: true,
        artisanal: true,
      },
      {
        name: "Pão Integral com Grãos",
        price: 2450,
        short: "Aveia, linhaca, girassol e chia na massa.",
        description: "Pão de forma integral, sem conservantes, com semente em cada fatia.",
        ingredients: "Farinha integral, aveia, linhaca, girassol, chia, mel, sal, fermento.",
      },
      {
        name: "Baguete Rústica",
        price: 1290,
        short: "Longa fermentação e casca bem tostada.",
        description: "Perfeita para bruschetta ou para acompanhar sopas e caldos.",
        ingredients: "Farinha de trigo, agua, sal, levain.",
        artisanal: true,
      },
    ],
  },
  {
    name: "Bolos",
    emoji: "🍰",
    palette: "bolos",
    description: "Bolos caseiros inteiros e em fatia.",
    forOrders: true,
    products: [
      {
        name: "Bolo de Cenoura com Brigadeiro",
        price: 890,
        short: "Fatia generosa com cobertura de brigadeiro cremoso.",
        description: "O bolo que vende mais na casa. Também sai inteiro sob encomenda.",
        ingredients: "Cenoura, farinha, ovos, açúcar, oleo, chocolate meio amargo, leite condensado.",
        featured: true,
        unit: "fatia",
      },
      {
        name: "Bolo de Fubá Cremoso",
        price: 790,
        short: "Cremoso no centro, dourado por fora, com erva-doce.",
        description: "Receita da vó, feita em forma redonda e servida em fatia.",
        ingredients: "Fubá, leite, ovos, queijo, açúcar, erva-doce.",
        unit: "fatia",
      },
      {
        name: "Bolo de Chocolate Belga",
        price: 1490,
        short: "Três camadas, ganache de chocolate 60%.",
        description: "Para festas e datas especiais. Disponível inteiro sob encomenda.",
        ingredients: "Chocolate belga 60%, creme de leite, farinha, ovos, manteiga, açúcar.",
        isNew: true,
        unit: "fatia",
      },
      {
        name: "Bolo de Festa Personalizado",
        price: 18900,
        short: "A partir de 2 kg, decorado do seu jeito.",
        description:
          "Escolha massa, recheio e tema. Pedido com no mínimo 48 horas de antecedência.",
        ingredients: "Sob consulta conforme o sabor escolhido.",
        orderable: false,
        unit: "kg",
      },
    ],
  },
  {
    name: "Tortas",
    emoji: "🥧",
    palette: "tortas",
    description: "Doces e salgadas, inteiras ou em fatia.",
    forOrders: true,
    products: [
      {
        name: "Torta de Limão Siciliano",
        price: 1290,
        short: "Massa amanteigada, creme azedinho e merengue macaricado.",
        description: "Fatia individual. Também sai inteira com 10 ou 16 fatias.",
        ingredients: "Limão siciliano, leite condensado, ovos, manteiga, biscoito, açúcar.",
        featured: true,
        unit: "fatia",
      },
      {
        name: "Torta Salgada de Frango",
        price: 1190,
        short: "Massa podre com frango desfiado e catupiry.",
        description: "Assada todos os dias as 10h. Ótima para o almoço rápido.",
        ingredients: "Frango, requeijao cremoso, farinha, manteiga, ovos, milho, azeitona.",
        unit: "fatia",
      },
      {
        name: "Torta Holandesa",
        price: 1390,
        short: "Creme, biscoito e cobertura de chocolate meio amargo.",
        description: "Servida gelada, com biscoito crocante na base e no topo.",
        ingredients: "Creme de leite, leite condensado, biscoito, chocolate, manteiga.",
        isNew: true,
        unit: "fatia",
      },
    ],
  },
  {
    name: "Doces",
    emoji: "🍮",
    palette: "doces",
    description: "Confeitaria fina e docinhos de festa.",
    forOrders: true,
    products: [
      {
        name: "Brigadeiro Gourmet",
        price: 450,
        short: "Chocolate 53% e granulado belga.",
        description: "Vendido na unidade ou em caixas para festa.",
        ingredients: "Leite condensado, chocolate 53%, manteiga, granulado belga.",
        featured: true,
      },
      {
        name: "Carolina de Doce de Leite",
        price: 690,
        short: "Massa choux recheada na hora.",
        description: "Recheada apenas no momento da venda para não perder a crocancia.",
        ingredients: "Farinha, manteiga, ovos, doce de leite argentino, açúcar de confeiteiro.",
        artisanal: true,
      },
      {
        name: "Pudim de Leite da Casa",
        price: 990,
        short: "Sem furinhos, calda escura na medida.",
        description: "Feito em banho-maria, desenformado apenas na hora da venda.",
        ingredients: "Leite condensado, leite, ovos, açúcar.",
        unit: "fatia",
      },
    ],
  },
  {
    name: "Salgados",
    emoji: "🥟",
    palette: "salgados",
    description: "Assados e fritos na hora, do balcão para a mao.",
    forOrders: true,
    products: [
      {
        name: "Coxinha de Frango com Catupiry",
        price: 1090,
        short: "Massa leve, recheio cremoso, fritura na hora.",
        description: "A coxinha mais pedida do bairro. Também sai em cento para festas.",
        ingredients: "Frango, requeijao, farinha de trigo, caldo caseiro, farinha de rosca.",
        featured: true,
      },
      {
        name: "Empada de Palmito",
        price: 950,
        short: "Massa podre que desmancha na boca.",
        description: "Recheio de palmito pupunha refogado com azeitona e tomate.",
        ingredients: "Farinha, manteiga, palmito pupunha, azeitona, tomate, ovos.",
      },
      {
        name: "Esfiha Aberta de Carne",
        price: 890,
        short: "Carne temperada com limão e hortelã.",
        description: "Assada em forno de lastro, do jeito tradicional.",
        ingredients: "Carne bovina, cebola, tomate, limão, hortelã, farinha, fermento.",
        isNew: true,
      },
      {
        name: "Kit Festa 100 Salgados",
        price: 28900,
        short: "Cem unidades sortidas, fritos ou assados.",
        description: "Combine até quatro sabores. Pedido com 72 horas de antecedência.",
        ingredients: "Sob consulta conforme os sabores escolhidos.",
        orderable: false,
        unit: "caixa",
      },
    ],
  },
  {
    name: "Café",
    emoji: "☕",
    palette: "cafe",
    description: "Grãos especiais torrados na semana.",
    products: [
      {
        name: "Espresso Villa Reis",
        price: 650,
        short: "Blend da casa, 60% arabica do cerrado mineiro.",
        description: "Extracao de 27 segundos, crema densa e final achocolatado.",
        ingredients: "Café arabica torrado e moido na hora.",
        featured: true,
      },
      {
        name: "Café Coado da Casa",
        price: 550,
        short: "Coado no pano, servido em xicara grande.",
        description: "O café de todo dia, feito em coador de pano como manda a tradicao.",
        ingredients: "Café torrado e moido, agua filtrada.",
      },
      {
        name: "Café Especial Filtrado V60",
        price: 1390,
        short: "Grão microlote, metodo V60, notas citricas.",
        description: "Trocamos o microlote toda semana. Pergunte ao barista qual esta na maquina.",
        ingredients: "Café especial microlote, agua filtrada.",
        isNew: true,
        artisanal: true,
      },
    ],
  },
  {
    name: "Cappuccino",
    emoji: "🥛",
    palette: "cappuccino",
    description: "Leite vaporizado na hora, sem po pronto.",
    products: [
      {
        name: "Cappuccino Italiano",
        price: 1190,
        short: "Espresso duplo, leite vaporizado e microespuma.",
        description: "Sem po pronto: espresso, leite e canela por cima, so se você quiser.",
        ingredients: "Café espresso, leite integral, canela opcional.",
        featured: true,
      },
      {
        name: "Chocolate Quente Cremoso",
        price: 1290,
        short: "Chocolate meio amargo derretido no leite.",
        description: "Bem cremoso, feito com chocolate de verdade e um toque de baunilha.",
        ingredients: "Chocolate meio amargo, leite, creme de leite, baunilha.",
        isNew: true,
      },
      {
        name: "Latte com Doce de Leite",
        price: 1390,
        short: "Espresso, leite vaporizado e calda de doce de leite.",
        description: "Nossa versão mais pedida no inverno.",
        ingredients: "Café espresso, leite, doce de leite argentino.",
      },
    ],
  },
  {
    name: "Bebidas",
    emoji: "🧃",
    palette: "bebidas",
    description: "Sucos naturais, chás e geladas.",
    products: [
      {
        name: "Suco de Laranja Natural 500ml",
        price: 1290,
        short: "Espremido na hora, sem açúcar.",
        description: "Laranja pera selecionada, espremida no momento do pedido.",
        ingredients: "Laranja pera.",
      },
      {
        name: "Chá Gelado de Hibisco 500ml",
        price: 1090,
        short: "Hibisco com limão e hortelã.",
        description: "Feito por infusao a frio, levemente adocado com mel.",
        ingredients: "Hibisco, limão, hortelã, mel.",
        isNew: true,
      },
    ],
  },
  {
    name: "Lanches",
    emoji: "🥪",
    palette: "lanches",
    description: "Para comer no balcão ou levar.",
    products: [
      {
        name: "Misto Quente na Chapa",
        price: 1490,
        short: "Pão de forma da casa, presunto e queijo prato.",
        description: "Prensado na chapa com manteiga até dourar.",
        ingredients: "Pão de forma, presunto, queijo prato, manteiga.",
        featured: true,
      },
      {
        name: "Sanduíche de Frango Defumado",
        price: 2490,
        short: "Pão australiano, frango defumado e maionese verde.",
        description: "Nosso lanche mais completo, acompanha mix de folhas.",
        ingredients: "Pão australiano, frango defumado, maionese verde, alface, tomate.",
        isNew: true,
      },
      {
        name: "Combo Café da Manha",
        price: 2690,
        short: "Café ou cappuccino + pão na chapa + suco.",
        description: "Servido até às 11h. O jeito mais barato de começar o dia na Villa Reis.",
        ingredients: "Conforme as opções escolhidas no balcão.",
        featured: true,
      },
    ],
  },
  {
    name: "Produtos especiais",
    emoji: "✨",
    palette: "especiais",
    description: "Sem gluten, sem lactose e linha fit.",
    products: [
      {
        name: "Pão Sem Gluten de Grão-de-Bico",
        price: 3290,
        short: "Sem gluten, sem lactose, alto teor de proteina.",
        description: "Produzido em bancada separada para evitar contaminação cruzada.",
        ingredients: "Farinha de grão-de-bico, psyllium, azeite, sal, fermento.",
        artisanal: true,
      },
      {
        name: "Bolo Vegano de Banana",
        price: 890,
        short: "Sem ovos, sem leite, adocado com banana e tâmara.",
        description: "Massa umida com aveia, canela e nozes.",
        ingredients: "Banana, tâmara, aveia, oleo de coco, canela, nozes.",
        isNew: true,
        unit: "fatia",
      },
    ],
  },
  {
    name: "Kits",
    emoji: "🎁",
    palette: "kits",
    description: "Cestas e kits prontos para presentear.",
    forOrders: true,
    products: [
      {
        name: "Kit Café da Manha Completo",
        price: 12900,
        short: "Pães, bolo, frios, suco, café e flores.",
        description:
          "Entregamos em Ribeirão Preto e regiao. Ideal para aniversários e datas comemorativas.",
        ingredients: "Composicao conforme disponibilidade do dia.",
        featured: true,
        orderable: false,
        unit: "caixa",
      },
      {
        name: "Cesta Villa Reis Presente",
        price: 19900,
        short: "Seleção de pães artesanais, geleias e café especial.",
        description: "Montada na cestaria de vime, com cartao personalizado.",
        ingredients: "Composicao conforme disponibilidade do dia.",
        orderable: false,
        unit: "caixa",
      },
    ],
  },
  {
    name: "Encomendas",
    emoji: "📋",
    palette: "encomendas",
    description: "Produção sob medida para festas e eventos.",
    forOrders: true,
    products: [
      {
        name: "Mesa de Doces para Eventos",
        price: 89000,
        short: "Montagem completa para até 50 convidados.",
        description:
          "Inclui bolo cenográfico, quatro tipos de docinho, mesa decorada e equipe de montagem.",
        ingredients: "Sob consulta conforme o cardapio aprovado.",
        orderable: false,
        unit: "caixa",
      },
    ],
  },
];

async function main() {
  console.log("→ Preparando os dados da Padaria Villa Reis...\n");

  // 1. Administrador -------------------------------------------------------
  const email = (process.env.ADMIN_EMAIL || "admin@villareis.com.br").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "VillaReis@2026";
  const existingAdmin = await prisma.adminUser.findUnique({ where: { email } });

  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        name: process.env.ADMIN_NAME || "Administrador Villa Reis",
        email,
        passwordHash: await bcrypt.hash(password, 12),
      },
    });
    console.log(`  ✓ Administrador criado: ${email} / ${password}`);
  } else {
    console.log(`  • Administrador já existe: ${email}`);
  }

  // 2. Configurações -------------------------------------------------------
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({ where: { key }, update: {}, create: { key, value } });
  }
  console.log("  ✓ Configurações iniciais gravadas");

  // 3. Catalogo ------------------------------------------------------------
  if ((await prisma.product.count()) > 0) {
    console.log("  • Catalogo já populado, pulando a criação de produtos");
  } else {
    let categoryPosition = 0;
    for (const seedCategory of CATEGORIES) {
      const category = await prisma.category.create({
        data: {
          name: seedCategory.name,
          slug: slugify(seedCategory.name),
          emoji: seedCategory.emoji,
          description: seedCategory.description,
          position: categoryPosition,
          forOrders: seedCategory.forOrders ?? false,
        },
      });
      categoryPosition += 1;

      let productPosition = 0;
      for (const seedProduct of seedCategory.products) {
        const buffer = await generatePlaceholder({
          label: seedProduct.name,
          palette: seedCategory.palette,
          kicker: seedCategory.name,
        });
        const media = await processUpload({
          buffer,
          originalName: `${slugify(seedProduct.name)}.jpg`,
          folder: "produtos",
          alt: seedProduct.name,
        });

        await prisma.product.create({
          data: {
            name: seedProduct.name,
            slug: slugify(seedProduct.name),
            shortDesc: seedProduct.short,
            description: seedProduct.description,
            ingredients: seedProduct.ingredients,
            extraInfo:
              "Produzido diariamente na cozinha da Villa Reis. Consulte a equipe sobre alergênicos.",
            priceCents: seedProduct.price,
            unit: seedProduct.unit ?? "un",
            categoryId: category.id,
            mainImageId: media.id,
            featured: seedProduct.featured ?? false,
            isNew: seedProduct.isNew ?? false,
            artisanal: seedProduct.artisanal ?? false,
            orderable: seedProduct.orderable ?? true,
            position: productPosition,
            viewCount: Math.floor(Math.random() * 180),
            media: { create: [{ mediaId: media.id, position: 0 }] },
          },
        });
        productPosition += 1;
      }
      console.log(`  ✓ ${seedCategory.name}: ${seedCategory.products.length} produto(s)`);
    }
  }

  // 4. Banner da home ------------------------------------------------------
  if ((await prisma.banner.count()) === 0) {
    const heroBuffer = await generatePlaceholder({
      label: "Villa Reis",
      palette: "marca",
      plain: true,
      width: 2200,
      height: 1400,
    });
    const heroMedia = await processUpload({
      buffer: heroBuffer,
      originalName: "banner-home.jpg",
      folder: "banners",
      alt: "Padaria Villa Reis",
    });

    await prisma.banner.create({
      data: {
        title: "O sabor de padaria de verdade,\nfeito todo dia na Villa Reis",
        subtitle: "Desde o primeiro forno do dia",
        buttonLabel: "Conheça nossos produtos",
        buttonLink: "/produtos",
        mediaId: heroMedia.id,
        placement: "hero",
        position: 0,
      },
    });
    console.log("  ✓ Banner principal publicado");
  }

  // 5. Galeria e Instagram -------------------------------------------------
  if ((await prisma.galleryItem.count()) === 0) {
    const scenes = [
      ["Balcão da manhã", "paes"],
      ["Forno a lenha", "cafe"],
      ["Confeitaria", "doces"],
      ["Cafeteria", "cappuccino"],
      ["Salão", "lanches"],
      ["Vitrine de tortas", "tortas"],
    ] as const;

    for (const [index, [label, palette]] of scenes.entries()) {
      const buffer = await generatePlaceholder({
        label,
        palette,
        kicker: "Villa Reis",
        width: 1400,
        height: 1400,
      });
      const media = await processUpload({
        buffer,
        originalName: `${slugify(label)}.jpg`,
        folder: index < 3 ? "galeria" : "instagram",
        alt: label,
      });

      if (index < 3) {
        await prisma.galleryItem.create({
          data: { title: label, caption: label, mediaId: media.id, position: index },
        });
      } else {
        await prisma.instagramPost.create({
          data: { caption: label, mediaId: media.id, position: index },
        });
      }
    }
    console.log("  ✓ Galeria e Instagram com conteúdo de exemplo");
  }

  // 6. Promoção ativa ------------------------------------------------------
  if ((await prisma.promotion.count()) === 0) {
    const target = await prisma.product.findFirst({ where: { slug: "croissant-villa-reis" } });
    const second = await prisma.product.findFirst({ where: { slug: "misto-quente-na-chapa" } });

    for (const product of [target, second].filter(Boolean)) {
      if (!product) continue;
      const newPrice = Math.round(product.priceCents * 0.78);
      await prisma.promotion.create({
        data: {
          title: `Oferta da semana: ${product.name}`,
          productId: product.id,
          oldPriceCents: product.priceCents,
          newPriceCents: newPrice,
          discountPct: discountPercent(product.priceCents, newPrice),
          active: true,
        },
      });
    }
    console.log("  ✓ Promoções de exemplo criadas");
  }

  // 7. Pedidos de exemplo --------------------------------------------------
  if ((await prisma.order.count()) === 0) {
    const products = await prisma.product.findMany({ where: { orderable: true }, take: 4 });
    if (products.length >= 2) {
      const items = products.slice(0, 3).map((product, index) => ({
        productId: product.id,
        productName: product.name,
        unitPriceCents: product.priceCents,
        quantity: index + 1,
        subtotalCents: product.priceCents * (index + 1),
      }));

      await prisma.order.create({
        data: {
          code: "VR0001",
          customerName: "Marina Prado",
          customerPhone: "(16) 99123-4567",
          fulfillment: "retirada",
          notes: "Pão bem assado, por favor.",
          totalCents: items.reduce((sum, item) => sum + item.subtotalCents, 0),
          status: "novo",
          items: { create: items },
        },
      });

      await prisma.customOrder.create({
        data: {
          code: "ENC0001",
          name: "Escola Aurora",
          phone: "(16) 3620-1122",
          desiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          desiredTime: "08:00",
          peopleCount: 45,
          categoryName: "Kits",
          productName: "Kit Café da Manha Completo",
          description:
            "Café da manhã para a reunião de pais: pães, bolos, café, suco e frutas para 45 pessoas.",
          status: "novo",
        },
      });

      await prisma.contactMessage.create({
        data: {
          name: "Joao Ribeiro",
          phone: "(16) 99888-1234",
          message: "Vocês fazem bolo sem lactose para aniversário infantil?",
        },
      });

      console.log("  ✓ Pedido, encomenda e mensagem de exemplo criados");
    }
  }

  const totals = {
    categorias: await prisma.category.count(),
    produtos: await prisma.product.count(),
    mídias: await prisma.mediaAsset.count(),
  };

  console.log(
    `\n✓ Pronto. ${totals.categorias} categorias, ${totals.produtos} produtos e ${totals.mídias} arquivos de mídia.`,
  );
  console.log(`  Painel: /admin  •  ${email} / ${password}\n`);
}

main()
  .catch((error) => {
    console.error("Falha ao popular o banco:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
