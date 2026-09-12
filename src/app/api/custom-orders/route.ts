import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleError, jsonOk, parseBody } from "@/lib/api";
import { getSettings } from "@/lib/settings";
import { buildCustomOrderMessage, whatsappLink } from "@/lib/whatsapp";

const schema = z.object({
  name: z.string().trim().min(2, "informe seu nome"),
  phone: z.string().trim().min(8, "informe um telefone valido"),
  desiredDate: z.string().trim().optional().nullable(),
  desiredTime: z.string().trim().optional().nullable(),
  peopleCount: z.coerce.number().int().min(0).max(5000).optional().nullable(),
  categoryName: z.string().trim().max(80).optional().nullable(),
  productName: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().min(5, "descreva a encomenda"),
  notes: z.string().trim().max(600).optional().nullable(),
  referenceMediaId: z.string().trim().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, schema);
    const settings = await getSettings();

    const count = await prisma.customOrder.count();
    const code = `ENC${String(count + 1).padStart(4, "0")}`;

    const order = await prisma.customOrder.create({
      data: {
        code,
        name: body.name,
        phone: body.phone,
        desiredDate: body.desiredDate ? new Date(`${body.desiredDate}T12:00:00`) : null,
        desiredTime: body.desiredTime ?? null,
        peopleCount: body.peopleCount ?? null,
        categoryName: body.categoryName ?? null,
        productName: body.productName ?? null,
        description: body.description,
        notes: body.notes ?? null,
        referenceMediaId: body.referenceMediaId || null,
      },
    });

    const message = buildCustomOrderMessage({
      brandName: settings.brandName,
      code: order.code,
      name: order.name,
      phone: order.phone,
      desiredDate: body.desiredDate ?? null,
      desiredTime: order.desiredTime,
      peopleCount: order.peopleCount,
      categoryName: order.categoryName,
      productName: order.productName,
      description: order.description,
      notes: order.notes,
    });

    return jsonOk({ code: order.code, whatsappUrl: whatsappLink(settings.whatsapp, message) });
  } catch (error) {
    return handleError(error);
  }
}
