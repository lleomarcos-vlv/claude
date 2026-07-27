import PageHeader from '../components/PageHeader';
import { IconShield } from '../components/icons';
import { API_BASE_URL } from '../lib/api';
import { useAuth } from '../lib/auth';
import { userRoleLabel } from '../lib/labels';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 py-3 last:border-0 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span>
        <span className="block text-sm font-medium text-gray-900 dark:text-white">{label}</span>
        <span className="block text-xs text-gray-400">{description}</span>
      </span>
      <span className="relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center">
        <input type="checkbox" defaultChecked={defaultChecked} className="peer sr-only" />
        <span className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-brand-600 dark:bg-gray-700" />
        <span className="absolute left-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export default function Configuracoes() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Configurações"
        subtitle="Conta, ambiente e preferências do painel."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card card-pad">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Conta</h2>
          <p className="mb-2 text-xs text-gray-400">Dados do usuário autenticado</p>
          <div>
            <Field label="Nome" value={user?.name ?? '—'} />
            <Field label="E-mail" value={user?.email ?? '—'} />
            <Field label="Perfil" value={user ? userRoleLabel[user.role] : '—'} />
          </div>
        </div>

        <div className="card card-pad">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Ambiente</h2>
          <p className="mb-2 text-xs text-gray-400">Configuração da API</p>
          <div>
            <Field label="Base da API" value={API_BASE_URL} />
            <Field label="Modo" value={import.meta.env.DEV ? 'Desenvolvimento' : 'Produção'} />
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-4 py-3 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
            <IconShield width={16} height={16} className="mt-0.5 shrink-0" />
            <span>
              Com a API indisponível, o painel usa automaticamente dados simulados (mock) para que
              a interface continue navegável em desenvolvimento.
            </span>
          </div>
        </div>

        <div className="card card-pad lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notificações</h2>
          <p className="mb-2 text-xs text-gray-400">Preferências de alertas operacionais (demonstração)</p>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <ToggleRow
              label="Novos serviços em disputa"
              description="Receber alerta quando um serviço entrar em disputa."
              defaultChecked
            />
            <ToggleRow
              label="Cadastro de jardineiros"
              description="Notificar quando um novo profissional aguardar verificação."
              defaultChecked
            />
            <ToggleRow
              label="Relatório financeiro semanal"
              description="Resumo de receita e margem por e-mail toda segunda-feira."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
