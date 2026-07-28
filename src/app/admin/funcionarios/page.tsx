import { prisma } from "@/lib/db";
import { ActionForm, ActionButton } from "@/components/admin/ActionForm";
import { AdminCard, AdminEmpty, AdminHeader, StatusBadge } from "@/components/admin/AdminPage";
import { saveEmployee, toggleEmployee } from "@/app/admin/actions";
import { date } from "@/lib/format";
import { services } from "@/content/services";

export const dynamic = "force-dynamic";
export const metadata = { title: "Funcionários" };

const ROLES = [
  { value: "JARDINEIRO", label: "Jardineiro" },
  { value: "PAISAGISTA", label: "Paisagista" },
  { value: "SUPERVISOR", label: "Supervisor" },
  { value: "ATENDIMENTO", label: "Atendimento" },
];

export default async function FuncionariosPage() {
  const [employees, load] = await Promise.all([
    prisma.employee.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.booking.groupBy({
      by: ["employeeId"],
      where: { status: { in: ["PENDENTE", "CONFIRMADO", "EM_ANDAMENTO"] } },
      _count: { _all: true },
    }),
  ]);

  const loadByEmployee = new Map(load.map((l) => [l.employeeId, l._count._all]));

  return (
    <div className="mx-auto max-w-5xl">
      <AdminHeader title="Funcionários" description="Equipe própria da Verde Fixo e as especialidades de cada um." />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
        <AdminCard title="Equipe" description={`${employees.filter((e) => e.active).length} ativos`}>
          {employees.length ? (
            <ul className="divide-y divide-cinza-200">
              {employees.map((employee) => (
                <li key={employee.id} className="p-5 sm:p-6">
                  <ActionForm action={saveEmployee}>
                    <input type="hidden" name="id" value={employee.id} />

                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-verde-600 text-sm font-semibold text-white">
                          {employee.name
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join("")}
                        </span>
                        <div>
                          <p className="font-semibold text-verde-800">{employee.name}</p>
                          <p className="text-sm text-cinza-600">
                            Desde {date(employee.hiredAt)} · {loadByEmployee.get(employee.id) ?? 0} serviços na fila
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {!employee.active ? <StatusBadge tone="danger">Inativo</StatusBadge> : null}
                        <label className="flex items-center gap-2 text-sm text-cinza-800">
                          <input type="checkbox" name="active" defaultChecked={employee.active} className="h-4 w-4 accent-verde-600" />
                          Ativo
                        </label>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <input name="name" defaultValue={employee.name} aria-label="Nome" required className="field h-10" />
                      <input name="email" type="email" defaultValue={employee.email ?? ""} aria-label="E-mail" placeholder="E-mail" className="field h-10" />
                      <input name="phone" defaultValue={employee.phone ?? ""} aria-label="Telefone" placeholder="Telefone" className="field h-10" />
                      <select name="role" defaultValue={employee.role} aria-label="Função" className="field-select h-10 py-0">
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-3">
                      <label htmlFor={`skills-${employee.id}`} className="label text-xs">
                        Especialidades (slugs separados por vírgula)
                      </label>
                      <input
                        id={`skills-${employee.id}`}
                        name="skills"
                        defaultValue={employee.skills}
                        placeholder="corte-de-grama,poda"
                        className="field h-10 font-mono text-sm"
                      />
                    </div>

                    <div className="mt-4 flex gap-2">
                      <ActionButton className="btn btn-primary btn-sm">Salvar</ActionButton>
                    </div>
                  </ActionForm>

                  <ActionForm action={toggleEmployee} hideMessage className="mt-2">
                    <input type="hidden" name="id" value={employee.id} />
                    <ActionButton
                      className="btn btn-ghost btn-sm text-cinza-600"
                      confirm={employee.active ? `Desativar ${employee.name}?` : undefined}
                    >
                      {employee.active ? "Desativar" : "Reativar"}
                    </ActionButton>
                  </ActionForm>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmpty icon="team" title="Nenhum funcionário cadastrado" />
          )}
        </AdminCard>

        <AdminCard title="Cadastrar funcionário" padded>
          <ActionForm action={saveEmployee} className="grid gap-3">
            <div>
              <label htmlFor="novo-nome" className="label">
                Nome
              </label>
              <input id="novo-nome" name="name" required className="field h-10" />
            </div>
            <div>
              <label htmlFor="novo-email" className="label">
                E-mail
              </label>
              <input id="novo-email" name="email" type="email" className="field h-10" />
            </div>
            <div>
              <label htmlFor="novo-telefone" className="label">
                Telefone
              </label>
              <input id="novo-telefone" name="phone" className="field h-10" />
            </div>
            <div>
              <label htmlFor="nova-funcao" className="label">
                Função
              </label>
              <select id="nova-funcao" name="role" className="field-select h-10 py-0">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="novas-skills" className="label">
                Especialidades
              </label>
              <input id="novas-skills" name="skills" placeholder="corte-de-grama,poda" className="field h-10 font-mono text-sm" />
              <p className="hint text-xs">
                Slugs disponíveis: {services.map((s) => s.slug).join(", ")}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm text-cinza-800">
              <input type="checkbox" name="active" defaultChecked className="h-4 w-4 accent-verde-600" />
              Ativo
            </label>
            <ActionButton className="btn btn-primary btn-md w-full">Cadastrar</ActionButton>
          </ActionForm>
        </AdminCard>
      </div>
    </div>
  );
}
