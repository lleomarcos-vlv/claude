import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, guard, handleError, ok, readJson } from "@/lib/api";
import { bookingSchema } from "@/lib/validation";
import { isSlotAvailable } from "@/lib/availability";
import { nextProtocol } from "@/lib/protocol";
import { parseIsoDate } from "@/lib/format";
import { quickEstimateCents } from "@/lib/pricing";
import { serviceBySlug } from "@/content/services";
import { onBookingCreated } from "@/lib/notifications";
import { getFlag } from "@/lib/settings";

export const dynamic = "force-dynamic";

/** Cria um agendamento (funciona com ou sem cadastro). */
export async function POST(request: Request) {
  try {
    const body = await readJson(request);

    const blocked = await guard(request, "bookings", body, { limit: 6, windowMs: 15 * 60_000, captcha: true });
    if (blocked) return blocked;

    const input = bookingSchema.parse(body);

    const service = serviceBySlug(input.serviceSlug);
    if (!service) return fail("Serviço não encontrado.", 404, { serviceSlug: "Escolha um serviço válido." });

    // Revalidação no servidor: a vaga pode ter sido preenchida enquanto o cliente preenchia o formulário.
    const slot = await isSlotAvailable(input.date, input.timeSlot);
    if (!slot.ok) return fail(slot.reason, 409, { timeSlot: slot.reason });

    const user = await getCurrentUser();
    const coupon = input.couponCode ? await findCoupon(input.couponCode) : null;

    const estimated = quickEstimateCents(input.serviceSlug, input.areaM2);
    const discount = coupon ? computeDiscount(estimated, coupon) : 0;

    const autoApprove = await getFlag("autoApproveBookings", false);
    const protocol = await nextProtocol("booking");

    const booking = await prisma.booking.create({
      data: {
        protocol,
        userId: user?.id ?? null,
        serviceId: (await prisma.service.findUnique({ where: { slug: service.slug }, select: { id: true } }))?.id ?? null,
        contactName: input.name,
        contactEmail: input.email,
        contactPhone: input.phone,
        contactWhatsapp: input.whatsapp || input.phone,
        serviceSlug: service.slug,
        serviceName: service.name,
        scheduledAt: parseIsoDate(input.date),
        timeSlot: input.timeSlot,
        frequency: input.frequency,
        status: autoApprove ? "CONFIRMADO" : "PENDENTE",
        zip: input.zip,
        street: input.street,
        number: input.number,
        complement: input.complement || null,
        district: input.district || null,
        city: input.city,
        state: input.state.toUpperCase(),
        propertyType: input.propertyType,
        areaM2: input.areaM2 ?? null,
        notes: input.notes || null,
        estimatedPrice: Math.max(0, estimated - discount),
        couponCode: coupon?.code ?? null,
        discount,
        photos: input.photos?.length
          ? { create: input.photos.map((url) => ({ url, kind: "REFERENCIA", caption: "Enviada pelo cliente" })) }
          : undefined,
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
        notes: true,
        status: true,
      },
    });

    if (coupon) {
      await prisma.coupon.update({ where: { id: coupon.id }, data: { uses: { increment: 1 } } });
    }

    // Automações: confirmação para o cliente + aviso para a equipe.
    await onBookingCreated(booking);

    return ok(
      {
        booking: {
          protocol: booking.protocol,
          serviceName: booking.serviceName,
          scheduledAt: booking.scheduledAt,
          timeSlot: booking.timeSlot,
          estimatedPrice: booking.estimatedPrice,
          status: booking.status,
        },
        message: `Agendamento registrado! Seu protocolo é ${booking.protocol}.`,
      },
      201,
    );
  } catch (error) {
    return handleError(error, "bookings:post");
  }
}

/** Agendamentos do cliente logado. */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("Faça login para ver seus agendamentos.", 401);

    const bookings = await prisma.booking.findMany({
      where: { userId: user.id },
      orderBy: { scheduledAt: "desc" },
      take: 60,
      include: { photos: { select: { url: true, kind: true, caption: true } } },
    });

    return ok({ bookings });
  } catch (error) {
    return handleError(error, "bookings:get");
  }
}

// ---------------------------------------------------------------------------

async function findCoupon(code: string) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!coupon || !coupon.active) return null;
  if (coupon.validUntil && coupon.validUntil < new Date()) return null;
  if (coupon.maxUses > 0 && coupon.uses >= coupon.maxUses) return null;
  return coupon;
}

function computeDiscount(amount: number, coupon: { discountType: string; discountValue: number; minValue: number }) {
  if (amount < coupon.minValue) return 0;
  const raw = coupon.discountType === "PERCENT" ? Math.round((amount * coupon.discountValue) / 100) : coupon.discountValue;
  return Math.min(raw, amount);
}
