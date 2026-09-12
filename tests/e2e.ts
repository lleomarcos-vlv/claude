/**
 * Teste ponta a ponta da Padaria Villa Reis.
 *
 * Sobe contra um servidor já em execucao (npm run build && npm start) e
 * percorre o caminho real do administrador e do cliente:
 * login → upload de foto → cadastro de produto → produto visivel no site →
 * pedido → encomenda → segurança das rotas.
 *
 * Uso: npx tsx tests/e2e.ts [http://localhost:3000]
 */
import crypto from "node:crypto";
import { generatePlaceholder } from "../prisma/seed-images";

const BASE = process.argv[2] ?? process.env.TEST_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@villareis.com.br";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "VillaReis@2026";

let passed = 0;
let failed = 0;
let cookie = "";

function check(name: string, condition: boolean, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${name}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("cookie", cookie);
  if (init.body && typeof init.body === "string" && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  return fetch(`${BASE}${path}`, { ...init, headers, redirect: "manual" });
}

async function main() {
  console.log(`\nTestando ${BASE}\n`);

  // ------------------------------------------------ área pública
  console.log("Área do cliente");
  const home = await api("/");
  const homeHtml = await home.text();
  check("home responde 200", home.status === 200, `status ${home.status}`);
  check("home traz a marca", homeHtml.includes("Villa Reis"));
  check("home lista categorias", homeHtml.includes("Nossas categorias"));
  check("dados estruturados Bakery presentes", homeHtml.includes('"@type":"Bakery"'));

  const catalog = await api("/produtos");
  check("catalogo responde 200", catalog.status === 200);

  const sitemap = await api("/sitemap.xml");
  const sitemapXml = await sitemap.text();
  check("sitemap lista produtos", sitemapXml.includes("/produtos/croissant-villa-reis"));

  const manifest = await api("/manifest.webmanifest");
  check("manifest do PWA disponível", manifest.status === 200);

  const robots = await api("/robots.txt");
  check("robots bloqueia o painel", (await robots.text()).includes("/admin"));

  // ------------------------------------------------ segurança
  console.log("\nSeguranca");
  const adminAnonymous = await api("/admin");
  check(
    "painel redireciona visitante para o login",
    adminAnonymous.status === 307 || adminAnonymous.status === 302,
    `status ${adminAnonymous.status}`,
  );

  const apiAnonymous = await api("/api/admin/products", { method: "POST", body: "{}" });
  check("api do painel recusa sem sessão", apiAnonymous.status === 401);

  const uploadAnonymous = await api("/api/upload", { method: "POST" });
  check("upload recusa sem sessão", uploadAnonymous.status === 401);

  const badLogin = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: "senha-errada" }),
  });
  check("login com senha errada falha", badLogin.status === 401);

  // ------------------------------------------------ login
  console.log("\nPainel administrativo");
  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const setCookie = login.headers.get("set-cookie") ?? "";
  cookie = setCookie.split(";")[0];
  check("login do administrador funciona", login.status === 200 && cookie.startsWith("vr_session="));
  check("cookie de sessão é httpOnly", setCookie.toLowerCase().includes("httponly"));

  const adminPage = await api("/admin");
  check("painel abre com sessão valida", adminPage.status === 200);

  // ------------------------------------------------ upload
  console.log("\nUpload de foto (qualidade preservada)");
  const photo = await generatePlaceholder({
    label: "Teste Automatizado",
    palette: "paes",
    kicker: "Teste",
  });
  const originalHash = crypto.createHash("sha256").update(photo).digest("hex");

  const form = new FormData();
  form.append("files", new Blob([new Uint8Array(photo)], { type: "image/jpeg" }), "teste-foto.jpg");
  form.append("folder", "produtos");

  const upload = await api("/api/upload", { method: "POST", body: form });
  const uploadPayload = await upload.json();
  check("upload aceita a foto", upload.status === 200, JSON.stringify(uploadPayload).slice(0, 160));

  const media = uploadPayload?.data?.uploaded?.[0];
  check("upload devolve a mídia criada", Boolean(media?.id));
  check("miniatura gerada", Boolean(media?.thumbUrl));

  if (media) {
    const desktop = await api(media.url);
    check("versão otimizada acessivel", desktop.status === 200);
    check(
      "versão otimizada em webp",
      (desktop.headers.get("content-type") ?? "").includes("webp"),
      desktop.headers.get("content-type") ?? "",
    );

    const originalUrl = media.url.replace(/\/desktop\.(webp|avif)$/, "/original.jpg");
    const original = await api(originalUrl);
    const originalBytes = Buffer.from(await original.arrayBuffer());
    check("arquivo original disponível", original.status === 200);
    check(
      "arquivo original preservado byte a byte",
      crypto.createHash("sha256").update(originalBytes).digest("hex") === originalHash,
      "o original foi alterado",
    );
    check(
      "versão otimizada é menor que o original",
      Number(desktop.headers.get("content-length")) < originalBytes.byteLength,
    );
  }

  const malicious = new FormData();
  malicious.append(
    "files",
    new Blob([new Uint8Array(Buffer.from("<?php system($_GET['x']); ?>"))], { type: "image/jpeg" }),
    "virus.jpg",
  );
  const maliciousUpload = await api("/api/upload", { method: "POST", body: malicious });
  check("arquivo malicioso disfarcado de jpg é recusado", maliciousUpload.status === 415);

  // ------------------------------------------------ produto
  console.log("\nCadastro de produto");
  const categories = await api("/api/admin/categories");
  const categoryList = (await categories.json())?.data ?? [];
  check("categorias listadas no painel", categoryList.length > 0);

  const suffix = Date.now().toString(36);
  const productName = `Focaccia de Alecrim ${suffix}`;
  const create = await api("/api/admin/products", {
    method: "POST",
    body: JSON.stringify({
      name: productName,
      shortDesc: "Focaccia alta com azeite e alecrim fresco.",
      description: "Fermentação de 18 horas, assada em azeite extravirgem.",
      ingredients: "Farinha, agua, azeite, sal, alecrim, fermento.",
      priceCents: 2490,
      unit: "un",
      categoryId: categoryList[0].id,
      mainImageId: media?.id ?? null,
      mediaIds: media ? [media.id] : [],
      available: true,
      featured: true,
      isNew: true,
    }),
  });
  const created = (await create.json())?.data;
  check("produto criado pelo painel", create.status === 201, `status ${create.status}`);

  if (created) {
    const publicProduct = await api(`/produtos/${created.slug}`);
    const publicHtml = await publicProduct.text();
    check("produto aparece na área do cliente", publicProduct.status === 200);
    check("página do produto mostra o nome", publicHtml.includes(productName));
    check("página do produto mostra o preço", publicHtml.includes("24,90"));
    check("foto enviada aparece na página", media ? publicHtml.includes(media.id) : false);

    const patch = await api(`/api/admin/products/${created.id}`, {
      method: "PATCH",
      body: JSON.stringify({ priceCents: 1990 }),
    });
    check("alteração de preço salva", patch.status === 200);

    const afterPatch = await api(`/produtos/${created.slug}`);
    check("novo preço aparece no site", (await afterPatch.text()).includes("19,90"));

    // ---------------------------------------------- pedido
    console.log("\nPedido do cliente");
    const order = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        customerName: "Cliente de Teste",
        customerPhone: "(16) 99999-0000",
        fulfillment: "retirada",
        notes: "Teste automatizado",
        items: [{ productId: created.id, quantity: 3 }],
      }),
    });
    const orderPayload = (await order.json())?.data;
    check("pedido registrado", order.status === 200, JSON.stringify(orderPayload).slice(0, 160));
    check(
      "total calculado no servidor",
      orderPayload?.totalCents === 1990 * 3,
      `recebido ${orderPayload?.totalCents}`,
    );
    check("link do whatsapp gerado", String(orderPayload?.whatsappUrl).startsWith("https://wa.me/"));
    check(
      "mensagem do whatsapp traz o resumo",
      String(orderPayload?.message).includes("Total:") &&
        String(orderPayload?.message).includes("Cliente de Teste"),
    );

    const emptyOrder = await api("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        customerName: "X",
        customerPhone: "1",
        fulfillment: "retirada",
        items: [],
      }),
    });
    check("pedido inválido é recusado", emptyOrder.status === 422);

    // ---------------------------------------------- limpeza
    const remove = await api(`/api/admin/products/${created.id}`, { method: "DELETE" });
    check("produto de teste removido", remove.status === 200);
  }

  // ------------------------------------------------ encomenda
  console.log("\nEncomenda");
  const customOrder = await api("/api/custom-orders", {
    method: "POST",
    body: JSON.stringify({
      name: "Cliente Encomenda",
      phone: "(16) 98888-0000",
      description: "Bolo de chocolate para 30 pessoas, tema jardim.",
      categoryName: "Bolos",
      peopleCount: 30,
    }),
  });
  const customPayload = (await customOrder.json())?.data;
  check("encomenda registrada", customOrder.status === 200);
  check("protocolo gerado", String(customPayload?.code ?? "").startsWith("ENC"));

  const contact = await api("/api/contact", {
    method: "POST",
    body: JSON.stringify({ name: "Visitante", message: "Mensagem de teste automatizado." }),
  });
  check("mensagem de contato registrada", contact.status === 200);

  // ------------------------------------------------ logout
  console.log("\nEncerramento de sessão");
  const logout = await api("/api/auth/logout", { method: "POST" });
  const logoutCookie = logout.headers.get("set-cookie") ?? "";
  check("logout limpa o cookie", logout.status === 200 && logoutCookie.includes("vr_session=;"));

  cookie = "";
  const afterLogout = await api("/api/admin/products", { method: "POST", body: "{}" });
  check("painel fica inacessivel após o logout", afterLogout.status === 401);

  console.log(`\n${passed} teste(s) aprovado(s), ${failed} reprovado(s).\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error("Falha no teste:", error);
  process.exit(1);
});
