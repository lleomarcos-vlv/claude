import { MessagesList } from "@/components/admin/messages-list";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="kicker">Atendimento</p>
        <h1 className="mt-1 font-display text-3xl">Mensagens</h1>
        <p className="mt-1 text-sm text-muted">Contatos enviados pelo formulario do site.</p>
      </header>

      <MessagesList
        messages={messages.map((message) => ({
          id: message.id,
          name: message.name,
          phone: message.phone,
          email: message.email,
          message: message.message,
          read: message.read,
          createdAt: message.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
