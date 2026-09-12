import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleError, jsonOk, parseBody } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "informe seu nome"),
  phone: z.string().trim().max(40).optional().nullable(),
  email: z.string().trim().email("e-mail inválido").optional().or(z.literal("")).nullable(),
  message: z.string().trim().min(5, "escreva sua mensagem"),
});

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, schema);
    await prisma.contactMessage.create({
      data: {
        name: body.name,
        phone: body.phone || null,
        email: body.email || null,
        message: body.message,
      },
    });
    return jsonOk({ received: true });
  } catch (error) {
    return handleError(error);
  }
}
