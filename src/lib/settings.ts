import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Configurações de integração editáveis pelo painel administrativo.
 *
 * Precedência de leitura: **banco → variável de ambiente → vazio**. Isso permite
 * configurar Mercado Pago, Stripe, WhatsApp e medição pela interface, sem novo
 * deploy, mantendo o `.env` como opção para quem prefere gerenciar por infra.
 *
 * Valores marcados como `secret` são gravados cifrados (AES-256-GCM) com chave
 * derivada de AUTH_SECRET, e nunca voltam íntegros para o navegador — a API
 * devolve apenas uma prévia mascarada.
 */

export type SettingKind = "secret" | "public";

export type SettingDefinition = {
  key: string;
  label: string;
  hint: string;
  kind: SettingKind;
  /** Variável de ambiente equivalente, usada como fallback. */
  env: string;
  group: SettingGroup;
  placeholder?: string;
};

export type SettingGroup = "Pagamentos" | "WhatsApp e e-mail" | "Medição" | "Mapas e captcha" | "Operação";

export const settingDefinitions: SettingDefinition[] = [
  // --- Pagamentos ---
  {
    key: "MERCADOPAGO_ACCESS_TOKEN",
    label: "Mercado Pago — Access Token",
    hint: "Credencial de produção em Suas integrações → Credenciais. Habilita PIX, cartão e boleto, além da assinatura recorrente.",
    kind: "secret",
    env: "MERCADOPAGO_ACCESS_TOKEN",
    group: "Pagamentos",
    placeholder: "APP_USR-0000000000000000-000000-...",
  },
  {
    key: "MERCADOPAGO_PUBLIC_KEY",
    label: "Mercado Pago — Public Key",
    hint: "Usada no checkout transparente. Pode ficar vazia se você usa o checkout hospedado.",
    kind: "public",
    env: "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY",
    group: "Pagamentos",
    placeholder: "APP_USR-abcd1234-...",
  },
  {
    key: "MERCADOPAGO_WEBHOOK_SECRET",
    label: "Mercado Pago — Segredo do webhook",
    hint: "Assinatura secreta em Notificações → Webhooks. Valida os avisos de pagamento.",
    kind: "secret",
    env: "MERCADOPAGO_WEBHOOK_SECRET",
    group: "Pagamentos",
  },
  {
    key: "STRIPE_SECRET_KEY",
    label: "Stripe — Secret Key",
    hint: "Alternativa internacional para assinatura no cartão.",
    kind: "secret",
    env: "STRIPE_SECRET_KEY",
    group: "Pagamentos",
    placeholder: "sk_live_...",
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    label: "Stripe — Webhook Secret",
    hint: "Segredo do endpoint em Developers → Webhooks.",
    kind: "secret",
    env: "STRIPE_WEBHOOK_SECRET",
    group: "Pagamentos",
    placeholder: "whsec_...",
  },
  {
    key: "PIX_KEY",
    label: "Chave PIX",
    hint: "CNPJ, e-mail ou chave aleatória. Usada para gerar o código copia-e-cola quando não há gateway configurado.",
    kind: "public",
    env: "PIX_KEY",
    group: "Pagamentos",
    placeholder: "48912334000107",
  },
  {
    key: "PIX_MERCHANT_NAME",
    label: "PIX — Nome do recebedor",
    hint: "Como aparece no app do banco do cliente. Máximo 25 caracteres.",
    kind: "public",
    env: "PIX_MERCHANT_NAME",
    group: "Pagamentos",
    placeholder: "VERDE FIXO",
  },
  {
    key: "PIX_MERCHANT_CITY",
    label: "PIX — Cidade do recebedor",
    hint: "Máximo 15 caracteres, sem acento.",
    kind: "public",
    env: "PIX_MERCHANT_CITY",
    group: "Pagamentos",
    placeholder: "CAMPINAS",
  },

  // --- WhatsApp e e-mail ---
  {
    key: "WHATSAPP_TOKEN",
    label: "WhatsApp — Token da Cloud API",
    hint: "Token permanente do app na Meta for Developers. Habilita confirmações, lembretes e pesquisas automáticas.",
    kind: "secret",
    env: "WHATSAPP_TOKEN",
    group: "WhatsApp e e-mail",
    placeholder: "EAAG...",
  },
  {
    key: "WHATSAPP_PHONE_ID",
    label: "WhatsApp — Phone Number ID",
    hint: "Identificador do número em WhatsApp → Configuração da API.",
    kind: "public",
    env: "WHATSAPP_PHONE_ID",
    group: "WhatsApp e e-mail",
    placeholder: "123456789012345",
  },
  {
    key: "RESEND_API_KEY",
    label: "Resend — API Key",
    hint: "Envio de e-mails transacionais (confirmação, lembrete, fatura).",
    kind: "secret",
    env: "RESEND_API_KEY",
    group: "WhatsApp e e-mail",
    placeholder: "re_...",
  },
  {
    key: "EMAIL_FROM",
    label: "Remetente dos e-mails",
    hint: "Precisa ser um domínio verificado no provedor.",
    kind: "public",
    env: "EMAIL_FROM",
    group: "WhatsApp e e-mail",
    placeholder: "Verde Fixo <contato@verdefixo.com.br>",
  },
  {
    key: "TEAM_WEBHOOK_URL",
    label: "Webhook da equipe",
    hint: "Recebe aviso de novo agendamento e novo orçamento. Aceita Slack, Discord, n8n ou Zapier.",
    kind: "secret",
    env: "TEAM_WEBHOOK_URL",
    group: "WhatsApp e e-mail",
    placeholder: "https://hooks.slack.com/services/...",
  },

  // --- Medição ---
  {
    key: "GTM_ID",
    label: "Google Tag Manager",
    hint: "Carregado somente após o cliente aceitar cookies de medição.",
    kind: "public",
    env: "NEXT_PUBLIC_GTM_ID",
    group: "Medição",
    placeholder: "GTM-XXXXXXX",
  },
  {
    key: "GA_ID",
    label: "Google Analytics 4",
    hint: "ID de medição do fluxo de dados da web.",
    kind: "public",
    env: "NEXT_PUBLIC_GA_ID",
    group: "Medição",
    placeholder: "G-XXXXXXXXXX",
  },
  {
    key: "META_PIXEL_ID",
    label: "Meta Pixel",
    hint: "Usado para remarketing no Instagram e Facebook. Depende do consentimento de marketing.",
    kind: "public",
    env: "NEXT_PUBLIC_META_PIXEL_ID",
    group: "Medição",
    placeholder: "1234567890123456",
  },

  // --- Mapas e captcha ---
  {
    key: "GOOGLE_MAPS_API_KEY",
    label: "Google Maps — API Key",
    hint: "Habilita o mapa interativo na página de contato. Sem chave, mostramos o mapa estático da região.",
    kind: "secret",
    env: "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY",
    group: "Mapas e captcha",
    placeholder: "AIza...",
  },
  {
    key: "HCAPTCHA_SECRET",
    label: "hCaptcha — Secret",
    hint: "Opcional. Sem isso usamos o captcha aritmético próprio, que não depende de terceiros.",
    kind: "secret",
    env: "HCAPTCHA_SECRET",
    group: "Mapas e captcha",
  },
  {
    key: "CRON_SECRET",
    label: "Segredo das automações (cron)",
    hint: "Protege /api/cron/lembretes e /api/cron/pesquisas. Envie como cabeçalho Authorization: Bearer <segredo>.",
    kind: "secret",
    env: "CRON_SECRET",
    group: "Operação",
  },

  // --- Operação ---
  {
    key: "autoApproveBookings",
    label: "Aprovar agendamentos automaticamente",
    hint: 'Use "true" para confirmar sem revisão manual, ou "false" para aprovar cada pedido na agenda.',
    kind: "public",
    env: "AUTO_APPROVE_BOOKINGS",
    group: "Operação",
    placeholder: "false",
  },
  {
    key: "slotCapacity",
    label: "Atendimentos por horário",
    hint: "Quantas equipes podem atender no mesmo horário. Controla a disponibilidade do calendário.",
    kind: "public",
    env: "SLOT_CAPACITY",
    group: "Operação",
    placeholder: "3",
  },
];

export const settingGroups: SettingGroup[] = [
  "Pagamentos",
  "WhatsApp e e-mail",
  "Medição",
  "Mapas e captcha",
  "Operação",
];

const definitionByKey = new Map(settingDefinitions.map((d) => [d.key, d]));

// ---------------------------------------------------------------------------
// Cifra
// ---------------------------------------------------------------------------

const PREFIX = "enc:v1:";

function encryptionKey() {
  const secret = process.env.AUTH_SECRET ?? "verde-fixo-dev-secret-nao-usar-em-producao";
  // Sal fixo: a chave precisa ser reproduzível entre reinícios do processo.
  return scryptSync(secret, "verde-fixo-settings", 32);
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64");
}

function decrypt(stored: string) {
  if (!stored.startsWith(PREFIX)) return stored; // valor gravado antes da cifra
  try {
    const raw = Buffer.from(stored.slice(PREFIX.length), "base64");
    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    // AUTH_SECRET mudou: o valor antigo não é recuperável.
    return "";
  }
}

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

type CacheEntry = { values: Map<string, string>; expiresAt: number };
let cache: CacheEntry | null = null;
const CACHE_MS = 30_000;

async function loadFromDb() {
  if (cache && cache.expiresAt > Date.now()) return cache.values;

  const values = new Map<string, string>();
  try {
    const rows = await prisma.setting.findMany();
    for (const row of rows) {
      const definition = definitionByKey.get(row.key);
      values.set(row.key, definition?.kind === "secret" ? decrypt(row.value) : row.value);
    }
  } catch {
    // Sem banco: seguimos só com as variáveis de ambiente.
  }

  cache = { values, expiresAt: Date.now() + CACHE_MS };
  return values;
}

/** Invalida o cache — chamado após salvar no painel. */
export function invalidateSettingsCache() {
  cache = null;
}

/** Valor efetivo de uma configuração: banco → ambiente → "". */
export async function getConfig(key: string): Promise<string> {
  const values = await loadFromDb();
  const fromDb = values.get(key);
  if (fromDb) return fromDb;

  const definition = definitionByKey.get(key);
  return (definition ? process.env[definition.env] : process.env[key]) ?? "";
}

/** Busca várias chaves de uma vez (uma única leitura do banco). */
export async function getConfigMany<K extends string>(keys: readonly K[]): Promise<Record<K, string>> {
  const values = await loadFromDb();
  const out = {} as Record<K, string>;
  for (const key of keys) {
    const fromDb = values.get(key);
    const definition = definitionByKey.get(key);
    out[key] = fromDb || (definition ? process.env[definition.env] : process.env[key]) || "";
  }
  return out;
}

export async function getFlag(key: string, fallback = false) {
  const value = (await getConfig(key)).trim().toLowerCase();
  if (!value) return fallback;
  return value === "true" || value === "1" || value === "sim";
}

export async function getNumber(key: string, fallback: number) {
  const value = Number(await getConfig(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

/** Grava um lote de configurações, cifrando o que for secreto. */
export async function saveSettings(entries: Record<string, string>) {
  const writes = Object.entries(entries)
    .filter(([key]) => definitionByKey.has(key))
    .map(([key, rawValue]) => {
      const definition = definitionByKey.get(key)!;
      const value = rawValue.trim();
      return prisma.setting.upsert({
        where: { key },
        create: { key, value: value && definition.kind === "secret" ? encrypt(value) : value },
        update: { value: value && definition.kind === "secret" ? encrypt(value) : value },
      });
    });

  await prisma.$transaction(writes);
  invalidateSettingsCache();
  return writes.length;
}

// ---------------------------------------------------------------------------
// Exposição segura para a interface
// ---------------------------------------------------------------------------

export type SettingView = SettingDefinition & {
  /** `true` quando há valor gravado no banco ou no ambiente. */
  configured: boolean;
  /** Origem do valor em uso. */
  source: "banco" | "ambiente" | "vazio";
  /** Prévia segura: valores públicos vêm íntegros, secretos vêm mascarados. */
  preview: string;
};

/** Monta a visão do painel sem nunca devolver um segredo por inteiro. */
export async function listSettingsForAdmin(): Promise<SettingView[]> {
  const values = await loadFromDb();

  return settingDefinitions.map((definition) => {
    const fromDb = values.get(definition.key) ?? "";
    const fromEnv = process.env[definition.env] ?? "";
    const effective = fromDb || fromEnv;

    return {
      ...definition,
      configured: Boolean(effective),
      source: fromDb ? "banco" : fromEnv ? "ambiente" : "vazio",
      preview: definition.kind === "public" ? effective : mask(effective),
    };
  });
}

function mask(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 3)}${"•".repeat(12)}${value.slice(-4)}`;
}

/** Resumo por integração, para o cartão de status do dashboard. */
export async function integrationStatus() {
  const values = await getConfigMany([
    "MERCADOPAGO_ACCESS_TOKEN",
    "STRIPE_SECRET_KEY",
    "PIX_KEY",
    "WHATSAPP_TOKEN",
    "RESEND_API_KEY",
    "TEAM_WEBHOOK_URL",
    "GA_ID",
    "META_PIXEL_ID",
  ] as const);

  return [
    { name: "Mercado Pago", icon: "wallet", active: Boolean(values.MERCADOPAGO_ACCESS_TOKEN), detail: "PIX, cartão e assinatura recorrente" },
    { name: "Stripe", icon: "credit-card", active: Boolean(values.STRIPE_SECRET_KEY), detail: "Assinatura no cartão" },
    { name: "PIX direto", icon: "pix", active: Boolean(values.PIX_KEY), detail: "Código copia-e-cola" },
    { name: "WhatsApp", icon: "whatsapp", active: Boolean(values.WHATSAPP_TOKEN), detail: "Confirmações e lembretes" },
    { name: "E-mail (Resend)", icon: "mail", active: Boolean(values.RESEND_API_KEY), detail: "Mensagens transacionais" },
    { name: "Aviso à equipe", icon: "bell", active: Boolean(values.TEAM_WEBHOOK_URL), detail: "Novo agendamento e orçamento" },
    { name: "Google Analytics", icon: "chart", active: Boolean(values.GA_ID), detail: "Medição de tráfego" },
    { name: "Meta Pixel", icon: "target", active: Boolean(values.META_PIXEL_ID), detail: "Remarketing" },
  ];
}
