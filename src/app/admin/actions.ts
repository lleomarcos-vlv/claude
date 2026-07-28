"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { onBookingStatusChanged } from "@/lib/notifications";
import { invalidateSettingsCache } from "@/lib/settings";
import { parseIsoDate } from "@/lib/format";

/**
 * Ações do painel administrativo.
 *
 * Server Actions em vez de rotas de API: menos código, sem fetch no cliente e a
 * autorização acontece no servidor a cada chamada (`requireAdmin`).
 * Todas retornam `{ ok, message }` para o formulário exibir o resultado.
 */

export type ActionResult = { ok: boolean; message: string };

async function guardAdmin(): Promise<ActionResult | null> {
  try {
    await requireAdmin();
    return null;
  } catch {
    return { ok: false, message: "Sessão expirada. Entre novamente." };
  }
}

function money(value: FormDataEntryValue | null) {
  // Aceita "450", "450,00" e "R$ 450,00" → centavos.
  const raw = String(value ?? "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
}

// ---------------------------------------------------------------------------
// Agendamentos
// ---------------------------------------------------------------------------

export async function updateBookingStatus(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const valid = ["PENDENTE", "CONFIRMADO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"];
  if (!id || !valid.includes(status)) return { ok: false, message: "Dados inválidos." };

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      status,
      ...(status === "CONCLUIDO" ? { completedAt: new Date() } : {}),
      ...(status === "CANCELADO" ? { cancelledAt: new Date() } : {}),
    },
    select: {
      id: true,
      protocol: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      contactWhatsapp: true,
      serviceName: true,
      scheduledAt: true,
      timeSlot: true,
      street: true,
      number: true,
      city: true,
      estimatedPrice: true,
      userId: true,
    },
  });

  await onBookingStatusChanged(booking, status);

  revalidatePath("/admin");
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/agendamentos");

  const labels: Record<string, string> = {
    CONFIRMADO: "confirmado",
    EM_ANDAMENTO: "iniciado",
    CONCLUIDO: "concluído",
    CANCELADO: "cancelado",
    PENDENTE: "marcado como pendente",
  };
  return { ok: true, message: `${booking.protocol} ${labels[status]}. O cliente foi avisado.` };
}

export async function assignEmployee(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  const employeeId = String(formData.get("employeeId") ?? "");
  if (!id) return { ok: false, message: "Agendamento inválido." };

  await prisma.booking.update({ where: { id }, data: { employeeId: employeeId || null } });
  revalidatePath("/admin/agenda");
  revalidatePath("/admin/agendamentos");
  return { ok: true, message: employeeId ? "Equipe atribuída." : "Atribuição removida." };
}

// ---------------------------------------------------------------------------
// Orçamentos e mensagens
// ---------------------------------------------------------------------------

export async function updateQuoteStatus(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const quotedPrice = money(formData.get("quotedPrice"));
  if (!id || !["NOVO", "EM_ANALISE", "ENVIADO", "GANHO", "PERDIDO"].includes(status)) {
    return { ok: false, message: "Dados inválidos." };
  }

  await prisma.quote.update({
    where: { id },
    data: {
      status,
      ...(quotedPrice > 0 ? { quotedPrice } : {}),
      ...(status !== "NOVO" ? { respondedAt: new Date() } : {}),
    },
  });

  revalidatePath("/admin/orcamentos");
  revalidatePath("/admin");
  return { ok: true, message: "Orçamento atualizado." };
}

export async function updateMessageStatus(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["NOVO", "LIDO", "RESPONDIDO", "ARQUIVADO"].includes(status)) {
    return { ok: false, message: "Dados inválidos." };
  }

  await prisma.message.update({ where: { id }, data: { status } });
  revalidatePath("/admin/mensagens");
  revalidatePath("/admin");
  return { ok: true, message: "Mensagem atualizada." };
}

// ---------------------------------------------------------------------------
// Catálogo — preços
// ---------------------------------------------------------------------------

export async function updateServicePricing(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Serviço inválido." };

  const pricePerM2 = money(formData.get("pricePerM2"));
  const basePrice = money(formData.get("basePrice"));
  const durationMin = Number(formData.get("durationMin"));
  const active = formData.get("active") === "on";
  const featured = formData.get("featured") === "on";

  await prisma.service.update({
    where: { id },
    data: {
      ...(pricePerM2 >= 0 ? { pricePerM2 } : {}),
      ...(basePrice > 0 ? { basePrice } : {}),
      ...(Number.isFinite(durationMin) && durationMin > 0 ? { durationMin: Math.round(durationMin) } : {}),
      active,
      featured,
    },
  });

  revalidatePath("/admin/servicos");
  revalidatePath("/servicos");
  revalidatePath("/");
  return { ok: true, message: "Serviço atualizado. As páginas públicas já refletem o novo preço." };
}

export async function updatePlanPricing(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, message: "Plano inválido." };

  const priceMonthly = money(formData.get("priceMonthly"));
  const priceYearly = money(formData.get("priceYearly"));
  const visitsPerMonth = Number(formData.get("visitsPerMonth"));
  const maxAreaM2 = Number(formData.get("maxAreaM2"));
  const active = formData.get("active") === "on";
  const highlight = formData.get("highlight") === "on";
  const badge = String(formData.get("badge") ?? "").trim();

  if (priceMonthly <= 0) return { ok: false, message: "Informe a mensalidade." };

  await prisma.plan.update({
    where: { id },
    data: {
      priceMonthly,
      priceYearly: priceYearly > 0 ? priceYearly : priceMonthly * 10,
      ...(Number.isFinite(visitsPerMonth) ? { visitsPerMonth: Math.round(visitsPerMonth) } : {}),
      ...(Number.isFinite(maxAreaM2) && maxAreaM2 > 0 ? { maxAreaM2: Math.round(maxAreaM2) } : {}),
      active,
      highlight,
      badge: badge || null,
    },
  });

  revalidatePath("/admin/planos");
  revalidatePath("/planos");
  revalidatePath("/");
  return { ok: true, message: "Plano atualizado. As faixas por porte de terreno foram reajustadas na mesma proporção." };
}

// ---------------------------------------------------------------------------
// Cadastros
// ---------------------------------------------------------------------------

const employeeSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome."),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  role: z.enum(["JARDINEIRO", "PAISAGISTA", "SUPERVISOR", "ATENDIMENTO"]),
  skills: z.string().trim().max(300).optional().or(z.literal("")),
});

export async function saveEmployee(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const parsed = employeeSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    role: formData.get("role"),
    skills: formData.get("skills"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const id = String(formData.get("id") ?? "");
  const data = {
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    role: parsed.data.role,
    skills: parsed.data.skills || "",
    active: formData.get("active") === "on",
  };

  if (id) await prisma.employee.update({ where: { id }, data });
  else await prisma.employee.create({ data });

  revalidatePath("/admin/funcionarios");
  return { ok: true, message: id ? "Funcionário atualizado." : "Funcionário cadastrado." };
}

export async function toggleEmployee(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  const employee = await prisma.employee.findUnique({ where: { id }, select: { active: true } });
  if (!employee) return { ok: false, message: "Funcionário não encontrado." };

  await prisma.employee.update({ where: { id }, data: { active: !employee.active } });
  revalidatePath("/admin/funcionarios");
  return { ok: true, message: employee.active ? "Funcionário desativado." : "Funcionário reativado." };
}

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "O código precisa de ao menos 3 caracteres.")
    .max(40)
    .transform((v) => v.toUpperCase().replace(/\s+/g, "")),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  discountType: z.enum(["PERCENT", "FIXED"]),
});

export async function saveCoupon(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const parsed = couponSchema.safeParse({
    code: formData.get("code"),
    description: formData.get("description"),
    discountType: formData.get("discountType"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message };

  const rawValue = Number(String(formData.get("discountValue") ?? "").replace(",", "."));
  if (!Number.isFinite(rawValue) || rawValue <= 0) return { ok: false, message: "Informe o valor do desconto." };

  // Percentual guarda o número puro; valor fixo guarda centavos.
  const discountValue = parsed.data.discountType === "PERCENT" ? Math.round(rawValue) : Math.round(rawValue * 100);
  if (parsed.data.discountType === "PERCENT" && discountValue > 90) {
    return { ok: false, message: "Desconto percentual máximo de 90%." };
  }

  const validUntilRaw = String(formData.get("validUntil") ?? "");
  const id = String(formData.get("id") ?? "");

  const data = {
    code: parsed.data.code,
    description: parsed.data.description || "",
    discountType: parsed.data.discountType,
    discountValue,
    minValue: money(formData.get("minValue")),
    maxUses: Math.max(0, Number(formData.get("maxUses") ?? 0) || 0),
    firstOrderOnly: formData.get("firstOrderOnly") === "on",
    active: formData.get("active") === "on",
    validUntil: /^\d{4}-\d{2}-\d{2}$/.test(validUntilRaw) ? parseIsoDate(validUntilRaw) : null,
  };

  try {
    if (id) await prisma.coupon.update({ where: { id }, data });
    else await prisma.coupon.create({ data });
  } catch {
    return { ok: false, message: "Já existe um cupom com esse código." };
  }

  revalidatePath("/admin/cupons");
  return { ok: true, message: id ? "Cupom atualizado." : `Cupom ${data.code} criado.` };
}

export async function deleteCoupon(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  await prisma.coupon.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/cupons");
  return { ok: true, message: "Cupom removido." };
}

export async function saveServiceArea(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const city = String(formData.get("city") ?? "").trim();
  if (city.length < 2) return { ok: false, message: "Informe a cidade." };

  const state = String(formData.get("state") ?? "SP").trim().toUpperCase().slice(0, 2);
  const slug = city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const id = String(formData.get("id") ?? "");
  const data = {
    city,
    state,
    slug,
    zipPrefix: String(formData.get("zipPrefix") ?? "").trim(),
    travelFee: money(formData.get("travelFee")),
    active: formData.get("active") === "on",
  };

  try {
    if (id) await prisma.serviceArea.update({ where: { id }, data });
    else await prisma.serviceArea.create({ data });
  } catch {
    return { ok: false, message: "Já existe uma área com essa cidade." };
  }

  revalidatePath("/admin/areas");
  revalidatePath("/atendemos");
  return { ok: true, message: id ? "Área atualizada." : `${city} adicionada à cobertura.` };
}

export async function toggleServiceArea(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  const area = await prisma.serviceArea.findUnique({ where: { id }, select: { active: true } });
  if (!area) return { ok: false, message: "Área não encontrada." };

  await prisma.serviceArea.update({ where: { id }, data: { active: !area.active } });
  revalidatePath("/admin/areas");
  revalidatePath("/atendemos");
  return { ok: true, message: area.active ? "Área desativada." : "Área reativada." };
}

// ---------------------------------------------------------------------------
// Agenda — bloqueios
// ---------------------------------------------------------------------------

export async function blockDate(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const dateRaw = String(formData.get("date") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) return { ok: false, message: "Escolha uma data válida." };

  const timeSlot = String(formData.get("timeSlot") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "").trim() || "Agenda fechada";
  const date = parseIsoDate(dateRaw);

  // O timeSlot nulo faz parte de uma unique composta; o upsert por chave composta
  // não aceita null, então reconciliamos manualmente.
  const existing = await prisma.availabilityBlock.findFirst({ where: { date, timeSlot } });
  if (existing) {
    await prisma.availabilityBlock.update({ where: { id: existing.id }, data: { reason } });
  } else {
    await prisma.availabilityBlock.create({ data: { date, timeSlot, reason } });
  }

  revalidatePath("/admin/agenda");
  return { ok: true, message: timeSlot ? `Horário ${timeSlot} bloqueado.` : "Dia inteiro bloqueado." };
}

export async function unblockDate(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  await prisma.availabilityBlock.delete({ where: { id } }).catch(() => null);
  revalidatePath("/admin/agenda");
  return { ok: true, message: "Bloqueio removido." };
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

export async function toggleClient(formData: FormData): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  const client = await prisma.user.findUnique({ where: { id }, select: { active: true, role: true } });
  if (!client) return { ok: false, message: "Cliente não encontrado." };
  if (client.role !== "CLIENT") return { ok: false, message: "Só é possível desativar clientes por aqui." };

  await prisma.user.update({ where: { id }, data: { active: !client.active } });
  revalidatePath("/admin/clientes");
  return { ok: true, message: client.active ? "Cliente desativado." : "Cliente reativado." };
}

/** Recarrega as configurações em memória — útil após editar direto no banco. */
export async function refreshSettings(): Promise<ActionResult> {
  const denied = await guardAdmin();
  if (denied) return denied;

  invalidateSettingsCache();
  revalidatePath("/admin/integracoes");
  return { ok: true, message: "Configurações recarregadas." };
}
