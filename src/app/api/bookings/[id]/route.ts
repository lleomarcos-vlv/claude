import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { fail, handleError, ok, readJson } from "@/lib/api";
import { onBookingStatusChanged } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["PENDENTE", "CONFIRMADO", "EM_ANDAMENTO", "CONCLUIDO", "CANCELADO"]).optional(),
  employeeId: z.string().max(40).nullable().optional(),
  internalNotes: z.string().max(2000).optional(),
  finalPrice: z.coerce.number().int().min(0).max(100_000_000).optional(),
  cancelReason: z.string().max(500).optional(),
});

const bookingFields = {
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
} as const;

/**
 * Atualiza um agendamento.
 *
 * Equipe altera qualquer campo; o cliente só pode cancelar o próprio agendamento,
 * e apenas enquanto ele não começou.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) return fail("Faça login para continuar.", 401);

    const isTeam = user.role === "ADMIN" || user.role === "STAFF";
    const booking = await prisma.booking.findUnique({ where: { id }, select: { ...bookingFields, employeeId: true } });
    if (!booking) return fail("Agendamento não encontrado.", 404);

    if (!isTeam && booking.userId !== user.id) return fail("Este agendamento não é seu.", 403);

    const input = patchSchema.parse(await readJson(request));

    if (!isTeam) {
      // Único movimento permitido ao cliente.
      if (input.status !== "CANCELADO") {
        return fail("Você pode apenas cancelar este agendamento. Para remarcar, fale com nossa equipe.", 403);
      }
      if (booking.status === "CONCLUIDO" || booking.status === "EM_ANDAMENTO") {
        return fail("Este serviço já começou. Fale com nossa equipe pelo WhatsApp.", 409);
      }
    }

    const now = new Date();
    const updated = await prisma.booking.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.employeeId !== undefined ? { employeeId: input.employeeId } : {}),
        ...(isTeam && input.internalNotes !== undefined ? { internalNotes: input.internalNotes } : {}),
        ...(isTeam && input.finalPrice !== undefined ? { finalPrice: input.finalPrice } : {}),
        ...(input.cancelReason ? { cancelReason: input.cancelReason } : {}),
        ...(input.status === "CONCLUIDO" ? { completedAt: now } : {}),
        ...(input.status === "CANCELADO" ? { cancelledAt: now } : {}),
      },
      select: bookingFields,
    });

    // Avisa o cliente sempre que o status muda.
    if (input.status && input.status !== booking.status) {
      await onBookingStatusChanged(updated, input.status);
    }

    return ok({ booking: updated, message: statusMessage(input.status) });
  } catch (error) {
    return handleError(error, "bookings/[id]:patch");
  }
}

function statusMessage(status?: string) {
  switch (status) {
    case "CONFIRMADO":
      return "Agendamento confirmado. O cliente foi avisado.";
    case "EM_ANDAMENTO":
      return "Serviço marcado como em andamento.";
    case "CONCLUIDO":
      return "Serviço concluído. A pesquisa de satisfação entra na fila automática.";
    case "CANCELADO":
      return "Agendamento cancelado.";
    default:
      return "Agendamento atualizado.";
  }
}
