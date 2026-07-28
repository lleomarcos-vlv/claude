import { redirect } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { PasswordForm } from "@/components/admin/PasswordForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { dateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = { title: "Segurança" };

export default async function ConfiguracoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?proximo=/admin/configuracoes");
  if (user.role !== "ADMIN") redirect("/admin");

  const team = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "STAFF"] } },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, lastLoginAt: true, active: true },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <h1 className="text-title font-semibold text-verde-800">Segurança</h1>
        <p className="mt-2 text-[0.9375rem] leading-relaxed text-cinza-700">
          Sua senha protege o acesso ao painel e é pedida novamente sempre que você salva credenciais de integração.
        </p>
      </header>

      <section className="card mt-8 p-6">
        <h2 className="text-lg font-semibold text-verde-800">Alterar senha</h2>
        <p className="mt-1.5 text-sm text-cinza-700">
          Use no mínimo 10 caracteres, combinando maiúsculas, minúsculas e números.
        </p>
        <div className="mt-6">
          <PasswordForm />
        </div>
      </section>

      <section className="card mt-6 overflow-hidden">
        <header className="border-b border-cinza-200 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-verde-800">Quem tem acesso ao painel</h2>
          <p className="mt-1 text-sm text-cinza-600">
            Administradores configuram integrações e preços. A equipe vê a operação, mas não as credenciais.
          </p>
        </header>

        <ul className="divide-y divide-cinza-200">
          {team.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center gap-4 p-4 sm:px-6">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-verde-600 text-sm font-semibold text-white">
                {member.name
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-verde-800">
                  {member.name}
                  {member.id === user.id ? <span className="ml-2 text-xs text-cinza-600">(você)</span> : null}
                </p>
                <p className="truncate text-sm text-cinza-600">{member.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {member.lastLoginAt ? (
                  <span className="hidden text-xs text-cinza-600 sm:block">Último acesso: {dateTime(member.lastLoginAt)}</span>
                ) : null}
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    member.role === "ADMIN"
                      ? "border-verde-300 bg-verde-50 text-verde-700"
                      : "border-cinza-200 bg-cinza-50 text-cinza-700"
                  }`}
                >
                  {member.role === "ADMIN" ? "Administrador" : "Equipe"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 flex items-start gap-3 rounded-2xl border border-ambar-200 bg-ambar-50 p-5">
        <Icon name="info" size={19} className="mt-0.5 shrink-0 text-ambar-600" />
        <div className="text-sm leading-relaxed text-ambar-700">
          <p>
            <strong className="font-semibold">Antes de publicar:</strong> troque a senha padrão criada pelo seed e defina
            um <code className="font-mono">AUTH_SECRET</code> aleatório no ambiente de produção. Trocar o{" "}
            <code className="font-mono">AUTH_SECRET</code> depois invalida as credenciais já cifradas — você precisará
            salvá-las novamente em{" "}
            <Link href="/admin/integracoes" className="font-medium underline">
              Integrações
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
