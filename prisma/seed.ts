/**
 * Popula o banco com o catálogo oficial e uma base operacional realista,
 * para o painel administrativo e a área do cliente já abrirem com dados.
 *
 * Rode com: npm run db:seed
 * Contas criadas: admin@verdefixo.com.br / cliente@exemplo.com (senha: verdefixo123)
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import { services } from "../src/content/services.ts";
import { plans } from "../src/content/plans.ts";
import { cities } from "../src/content/cities.ts";
import { gallery } from "../src/content/gallery.ts";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = scryptSync(password.normalize("NFKC"), salt, 64);
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? "verdefixo123";

/**
 * Acesso administrativo. Troque por variáveis de ambiente antes de publicar:
 *   ADMIN_EMAIL="voce@suaempresa.com.br" ADMIN_PASSWORD="..." npm run db:seed
 * Depois de publicar, altere a senha em Admin → Configurações → Segurança.
 */
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@verdefixo.com.br";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "VerdeFixo@2026";

const day = 86_400_000;
const today = new Date();
today.setHours(12, 0, 0, 0);
const addDays = (n: number) => new Date(today.getTime() + n * day);

async function main() {
  console.log("→ Limpando dados anteriores…");
  await prisma.$transaction([
    prisma.notificationLog.deleteMany(),
    prisma.satisfactionSurvey.deleteMany(),
    prisma.bookingPhoto.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.quote.deleteMany(),
    prisma.message.deleteMany(),
    prisma.newsletterSubscriber.deleteMany(),
    prisma.availabilityBlock.deleteMany(),
    prisma.galleryItem.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.serviceArea.deleteMany(),
    prisma.employee.deleteMany(),
    prisma.user.deleteMany(),
    prisma.plan.deleteMany(),
    prisma.service.deleteMany(),
    prisma.setting.deleteMany(),
  ]);

  // -------------------------------------------------------------------------
  // Catálogo
  // -------------------------------------------------------------------------
  console.log("→ Serviços e planos…");
  await prisma.service.createMany({
    data: services.map((s, i) => ({
      slug: s.slug,
      name: s.name,
      shortDesc: s.shortDesc,
      description: s.description,
      image: s.image,
      icon: s.icon,
      // basePrice guarda o valor mínimo de visita do catálogo (R$ 200).
      basePrice: 20000,
      pricePerM2: s.pricing.kind === "m2" ? s.pricing.minPerM2 : 0,
      durationMin: s.durationMin,
      order: i,
      featured: s.featured,
      seoTitle: s.seoTitle,
      seoDescription: s.seoDescription,
    })),
  });

  await prisma.plan.createMany({
    data: plans.map((p, i) => ({
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      visitsPerMonth: p.visitsPerMonth,
      features: JSON.stringify(p.features),
      highlight: p.highlight,
      badge: p.badge ?? null,
      order: i,
      maxAreaM2: p.maxAreaM2,
    })),
  });

  await prisma.serviceArea.createMany({
    data: cities.map((c, i) => ({
      city: c.city,
      state: c.state,
      slug: c.slug,
      order: i,
      travelFee: c.hub ? 0 : c.responseTime === "72h" ? 4000 : 0,
    })),
  });

  await prisma.galleryItem.createMany({
    data: gallery.map((g, i) => ({
      title: g.title,
      slug: g.slug,
      category: g.category,
      city: g.city,
      beforeUrl: g.before,
      afterUrl: g.after,
      description: g.description,
      areaM2: g.areaM2,
      order: i,
    })),
  });

  // -------------------------------------------------------------------------
  // Equipe e acessos
  // -------------------------------------------------------------------------
  console.log("→ Equipe e usuários…");
  const passwordHash = hashPassword(DEMO_PASSWORD);

  const admin = await prisma.user.create({
    data: {
      name: "Letícia Barros",
      email: ADMIN_EMAIL,
      phone: "11926857062",
      whatsapp: "11926857062",
      passwordHash: hashPassword(ADMIN_PASSWORD),
      role: "ADMIN",
      city: "Campinas",
      state: "SP",
      lgpdAcceptedAt: new Date(),
      lastLoginAt: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      name: "Rafael Menezes",
      email: "equipe@verdefixo.com.br",
      phone: "11926857062",
      passwordHash,
      role: "STAFF",
      city: "Campinas",
      state: "SP",
      lgpdAcceptedAt: new Date(),
    },
  });

  const employees = await Promise.all(
    [
      { name: "Josué Andrade", role: "SUPERVISOR", skills: "corte-de-grama,poda,jardinagem" },
      { name: "Bianca Ferraz", role: "PAISAGISTA", skills: "paisagismo,plantio,revitalizacao-de-jardins" },
      { name: "Cleber dos Santos", role: "JARDINEIRO", skills: "corte-de-grama,jardinagem,adubacao" },
      { name: "Marcelo Pinto", role: "JARDINEIRO", skills: "corte-de-grama,limpeza-de-terreno,poda" },
      { name: "Ana Lúcia Ribeiro", role: "JARDINEIRO", skills: "jardinagem,plantio,controle-de-pragas" },
      { name: "Fábio Correia", role: "ATENDIMENTO", skills: "" },
    ].map((e, i) =>
      prisma.employee.create({
        data: {
          ...e,
          email: `${e.name.split(" ")[0].toLowerCase()}@verdefixo.com.br`,
          phone: `1199900${String(1000 + i).slice(-4)}`,
          hiredAt: addDays(-500 + i * 60),
        },
      }),
    ),
  );

  // -------------------------------------------------------------------------
  // Clientes
  // -------------------------------------------------------------------------
  const clientSeeds = [
    { name: "Mariana Prado", email: "cliente@exemplo.com", city: "Campinas", propertyType: "residencia", areaM2: 240, plan: "verde" },
    { name: "Roberto Nakamura", email: "sindico@villaverde.com.br", city: "Valinhos", propertyType: "condominio", areaM2: 4000, plan: "premium" },
    { name: "Camila Bertoldi", email: "contato@recantodasaguas.com.br", city: "Holambra", propertyType: "pousada", areaM2: 1800, plan: "premium" },
    { name: "Patrícia Lemos", email: "patricia.lemos@exemplo.com", city: "Paulínia", propertyType: "residencia", areaM2: 150, plan: "essencial" },
    { name: "Fernando Aguiar", email: "diretoria@escolasemear.com.br", city: "Campinas", propertyType: "escola", areaM2: 2200, plan: "premium" },
    { name: "Marcos Vinícius Tavares", email: "marcos@lojastavares.com.br", city: "Indaiatuba", propertyType: "comercio", areaM2: 360, plan: "verde" },
    { name: "Helena Duarte", email: "helena.duarte@exemplo.com", city: "Sumaré", propertyType: "residencia", areaM2: 90, plan: "essencial" },
    { name: "Eduardo Salles", email: "eduardo.salles@exemplo.com", city: "Jaguariúna", propertyType: "sitio", areaM2: 6000, plan: null },
    { name: "Juliana Castro", email: "juliana.castro@exemplo.com", city: "Vinhedo", propertyType: "residencia", areaM2: 280, plan: null },
    { name: "Tiago Moreira", email: "tiago.moreira@exemplo.com", city: "Hortolândia", propertyType: "residencia", areaM2: 120, plan: "essencial" },
  ];

  console.log("→ Clientes, assinaturas e faturas…");
  const dbPlans = await prisma.plan.findMany();
  const dbServices = await prisma.service.findMany();
  const clients: { user: Awaited<ReturnType<typeof prisma.user.create>>; seed: (typeof clientSeeds)[number] }[] = [];

  for (const [i, seed] of clientSeeds.entries()) {
    const user = await prisma.user.create({
      data: {
        name: seed.name,
        email: seed.email,
        phone: `1199${String(8000000 + i * 13571).slice(0, 7)}`,
        whatsapp: `1199${String(8000000 + i * 13571).slice(0, 7)}`,
        passwordHash,
        role: "CLIENT",
        city: seed.city,
        state: "SP",
        street: "Rua das Acácias",
        number: String(100 + i * 37),
        district: "Centro",
        zip: `130${String(10 + i).padStart(2, "0")}000`,
        propertyType: seed.propertyType,
        areaM2: seed.areaM2,
        marketingOptIn: i % 3 !== 0,
        lgpdAcceptedAt: addDays(-400 + i * 30),
        lastLoginAt: addDays(-i),
        createdAt: addDays(-400 + i * 30),
      },
    });
    clients.push({ user, seed });

    if (!seed.plan) continue;

    const plan = dbPlans.find((p) => p.slug === seed.plan)!;
    // Mensalidade proporcional ao porte do terreno, como no catálogo.
    const contentPlan = plans.find((p) => p.slug === seed.plan)!;
    const tier =
      contentPlan.areaTiers.find((t) => t.maxM2 !== null && seed.areaM2 <= t.maxM2) ?? contentPlan.areaTiers[2];
    const price = tier.price > 0 ? tier.price : Math.round(contentPlan.areaTiers[2].price * 1.6);

    const subscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: i === 9 ? "INADIMPLENTE" : "ATIVA",
        billingCycle: i % 4 === 0 ? "ANUAL" : "MENSAL",
        price,
        startedAt: addDays(-330 + i * 25),
        currentPeriodEnd: addDays(30 - (i % 28)),
        nextVisitAt: addDays(2 + (i % 12)),
        provider: "demo",
      },
    });

    // Histórico de faturas dos últimos 6 meses.
    for (let m = 5; m >= 0; m--) {
      const due = new Date(today.getFullYear(), today.getMonth() - m, 10, 12);
      const overdue = i === 9 && m === 0;
      await prisma.invoice.create({
        data: {
          number: `FAT-${due.getFullYear()}-${String(i * 10 + (6 - m)).padStart(4, "0")}`,
          userId: user.id,
          subscriptionId: subscription.id,
          amount: price,
          status: overdue ? "ATRASADA" : m === 0 ? "PENDENTE" : "PAGA",
          dueDate: due,
          paidAt: overdue || m === 0 ? null : new Date(due.getTime() - 3 * day),
          method: i % 2 === 0 ? "pix" : "cartao",
          description: `${plan.name} — ${due.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
        },
      });
    }
  }

  // -------------------------------------------------------------------------
  // Agendamentos: concluídos, em andamento e futuros
  // -------------------------------------------------------------------------
  console.log("→ Agendamentos…");
  const slots = ["07:00", "08:00", "09:00", "10:00", "13:00", "14:00", "15:00", "16:00"];
  let protocolSeq = 1;
  let photoSeq = 0;

  const makeBooking = async (opts: {
    client: (typeof clients)[number];
    serviceSlug: string;
    offsetDays: number;
    status: string;
    withPhotos?: boolean;
    withSurvey?: boolean;
  }) => {
    const service = dbServices.find((s) => s.slug === opts.serviceSlug)!;
    const scheduledAt = addDays(opts.offsetDays);
    const { user, seed } = opts.client;
    const area = seed.areaM2;
    const estimated = service.pricePerM2 > 0 ? Math.max(20000, area * service.pricePerM2) : 0;

    const booking = await prisma.booking.create({
      data: {
        protocol: `VF-${scheduledAt.getFullYear()}-${String(protocolSeq++).padStart(4, "0")}`,
        userId: user.id,
        serviceId: service.id,
        employeeId: employees[protocolSeq % 5].id,
        contactName: user.name,
        contactEmail: user.email,
        contactPhone: user.phone ?? "",
        contactWhatsapp: user.whatsapp,
        serviceSlug: service.slug,
        serviceName: service.name,
        scheduledAt,
        timeSlot: slots[protocolSeq % slots.length],
        frequency: seed.plan ? "quinzenal" : "unica",
        status: opts.status,
        paymentStatus: seed.plan ? "ISENTO_PLANO" : opts.status === "CONCLUIDO" ? "PAGO" : "AGUARDANDO",
        paymentMethod: seed.plan ? "assinatura" : "pix",
        zip: user.zip ?? "13010000",
        street: user.street ?? "Rua das Acácias",
        number: user.number ?? "100",
        district: user.district,
        city: user.city ?? "Campinas",
        state: "SP",
        propertyType: seed.propertyType,
        areaM2: area,
        estimatedPrice: estimated,
        finalPrice: opts.status === "CONCLUIDO" ? estimated : 0,
        completedAt: opts.status === "CONCLUIDO" ? scheduledAt : null,
        source: seed.plan ? "assinatura" : "site",
        createdAt: addDays(opts.offsetDays - 4),
      },
    });

    if (opts.withPhotos) {
      const pair = gallery[photoSeq++ % gallery.length];
      await prisma.bookingPhoto.createMany({
        data: [
          { bookingId: booking.id, url: pair.before, kind: "ANTES", caption: "Antes do serviço" },
          { bookingId: booking.id, url: pair.after, kind: "DEPOIS", caption: "Depois do serviço" },
        ],
      });
    }

    if (opts.withSurvey) {
      await prisma.satisfactionSurvey.create({
        data: {
          bookingId: booking.id,
          userId: user.id,
          rating: 5,
          npsScore: 10,
          comment: "Equipe pontual e caprichosa. O gramado ficou impecável.",
          publish: protocolSeq % 3 === 0,
          sentAt: addDays(opts.offsetDays + 1),
          answeredAt: addDays(opts.offsetDays + 2),
        },
      });
    }

    return booking;
  };

  // Histórico (concluídos, com fotos antes/depois e pesquisa respondida)
  for (const [i, client] of clients.entries()) {
    const serviceSlugs = ["corte-de-grama", "jardinagem", "poda", "adubacao"];
    for (let k = 0; k < 3; k++) {
      await makeBooking({
        client,
        serviceSlug: serviceSlugs[(i + k) % serviceSlugs.length],
        offsetDays: -60 + k * 18 - i,
        status: "CONCLUIDO",
        withPhotos: k === 0,
        withSurvey: k === 0,
      });
    }
  }

  // Hoje: um em andamento
  await makeBooking({ client: clients[0], serviceSlug: "corte-de-grama", offsetDays: 0, status: "EM_ANDAMENTO" });

  // Futuros: confirmados e pendentes de aprovação
  for (const [i, client] of clients.entries()) {
    await makeBooking({
      client,
      serviceSlug: ["corte-de-grama", "jardinagem", "paisagismo", "limpeza-de-terreno"][i % 4],
      offsetDays: 2 + i * 2,
      status: i % 4 === 0 ? "PENDENTE" : "CONFIRMADO",
    });
  }

  // -------------------------------------------------------------------------
  // Orçamentos, mensagens e cupons
  // -------------------------------------------------------------------------
  console.log("→ Orçamentos, mensagens e cupons…");
  const quoteSeeds = [
    { name: "Sandra Okamoto", city: "Vinhedo", serviceSlug: "paisagismo", areaM2: 320, status: "NOVO" },
    { name: "Condomínio Alto da Serra", city: "Itatiba", serviceSlug: "corte-de-grama", areaM2: 5200, status: "EM_ANALISE" },
    { name: "Paulo Menegatti", city: "Jaguariúna", serviceSlug: "limpeza-de-terreno", areaM2: 4000, status: "ENVIADO" },
    { name: "Hotel Fazenda Sol Nascente", city: "Pedreira", serviceSlug: "irrigacao", areaM2: 2600, status: "GANHO" },
    { name: "Renata Villela", city: "Campinas", serviceSlug: "revitalizacao-de-jardins", areaM2: 210, status: "NOVO" },
    { name: "Escola Novo Tempo", city: "Hortolândia", serviceSlug: "poda", areaM2: 90, status: "PERDIDO" },
  ];

  for (const [i, q] of quoteSeeds.entries()) {
    const service = services.find((s) => s.slug === q.serviceSlug)!;
    const estimated = service.pricing.kind === "m2" ? Math.max(20000, q.areaM2 * service.pricing.minPerM2) : 0;
    await prisma.quote.create({
      data: {
        protocol: `ORC-${today.getFullYear()}-${String(i + 1).padStart(4, "0")}`,
        name: q.name,
        phone: `1199${String(7000000 + i * 24681).slice(0, 7)}`,
        whatsapp: `1199${String(7000000 + i * 24681).slice(0, 7)}`,
        email: `${q.name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@exemplo.com`,
        city: q.city,
        address: `Av. Central, ${200 + i * 15}`,
        propertyType: ["residencia", "condominio", "sitio", "hotel", "residencia", "escola"][i],
        areaM2: q.areaM2,
        serviceSlug: q.serviceSlug,
        serviceName: service.name,
        frequency: i % 2 === 0 ? "unica" : "quinzenal",
        notes: i === 0 ? "Quero repensar o canteiro da frente, hoje só tem grama." : null,
        status: q.status,
        estimatedPrice: estimated,
        quotedPrice: q.status === "ENVIADO" || q.status === "GANHO" ? Math.round(estimated * 1.15) : 0,
        respondedAt: q.status === "NOVO" ? null : addDays(-i - 1),
        createdAt: addDays(-i - 1),
      },
    });
  }

  await prisma.message.createMany({
    data: [
      {
        channel: "SITE",
        name: "Cristina Alves",
        email: "cristina.alves@exemplo.com",
        phone: "11997654321",
        subject: "Atendem em Artur Nogueira?",
        body: "Boa tarde! Tenho um sítio em Artur Nogueira com cerca de 3.000 m². Vocês atendem lá?",
        status: "NOVO",
        createdAt: addDays(-1),
      },
      {
        channel: "CHAT",
        name: "Visitante do site",
        body: "Quanto custa cortar 500 m²?",
        status: "RESPONDIDO",
        meta: JSON.stringify({ intencao: "preco", area: 500 }),
        createdAt: addDays(-2),
      },
      {
        channel: "SITE",
        name: "Gabriel Nunes",
        email: "gabriel.nunes@exemplo.com",
        subject: "Nota fiscal para condomínio",
        body: "Somos um condomínio e precisamos de nota fiscal e contrato mensal. Como funciona?",
        status: "LIDO",
        createdAt: addDays(-3),
      },
    ],
  });

  await prisma.coupon.createMany({
    data: [
      {
        code: "PRIMEIRAVISITA",
        description: "15% de desconto na primeira visita avulsa",
        discountType: "PERCENT",
        discountValue: 15,
        minValue: 20000,
        maxUses: 500,
        uses: 87,
        firstOrderOnly: true,
        validUntil: addDays(120),
      },
      {
        code: "CLUBE50",
        description: "R$ 50 off no primeiro mês de qualquer plano",
        discountType: "FIXED",
        discountValue: 5000,
        maxUses: 200,
        uses: 41,
        validUntil: addDays(90),
      },
      {
        code: "INDIQUE10",
        description: "10% para quem chega por indicação",
        discountType: "PERCENT",
        discountValue: 10,
        maxUses: 0,
        uses: 213,
      },
      {
        code: "INVERNO2025",
        description: "Campanha de inverno encerrada",
        discountType: "PERCENT",
        discountValue: 20,
        active: false,
        uses: 156,
        validUntil: addDays(-40),
      },
    ],
  });

  await prisma.newsletterSubscriber.createMany({
    data: Array.from({ length: 18 }, (_, i) => ({
      email: `assinante${i + 1}@exemplo.com`,
      source: i % 3 === 0 ? "footer" : i % 3 === 1 ? "blog" : "orcamento",
      confirmed: i % 4 !== 0,
      createdAt: addDays(-i * 5),
    })),
  });

  // Bloqueios de agenda (feriado e manutenção de equipamento)
  await prisma.availabilityBlock.createMany({
    data: [
      { date: addDays(7), timeSlot: null, reason: "Feriado municipal" },
      { date: addDays(4), timeSlot: "07:00", reason: "Manutenção de equipamento" },
      { date: addDays(4), timeSlot: "08:00", reason: "Manutenção de equipamento" },
    ],
  });

  await prisma.setting.createMany({
    data: [
      { key: "minVisitPrice", value: "20000" },
      { key: "slotCapacity", value: "3" },
      { key: "autoApproveBookings", value: "false" },
      { key: "reminderHours", value: "24" },
      { key: "surveyDelayHours", value: "3" },
    ],
  });

  // -------------------------------------------------------------------------
  const [users, bookings, subs, invoices] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.subscription.count(),
    prisma.invoice.count(),
  ]);

  console.log(`
✓ Seed concluído
  ${users} usuários · ${bookings} agendamentos · ${subs} assinaturas · ${invoices} faturas

  ADMINISTRADOR (configura Mercado Pago e demais integrações)
  · E-mail → ${ADMIN_EMAIL}
  · Senha  → ${ADMIN_PASSWORD}
    Painel: /admin/integracoes — cada gravação pede esta senha novamente.

  Demais acessos (senha: ${DEMO_PASSWORD})
  · Equipe  → equipe@verdefixo.com.br
  · Cliente → cliente@exemplo.com
`);
  void admin;
}

main()
  .catch((error) => {
    console.error("✗ Falha no seed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
