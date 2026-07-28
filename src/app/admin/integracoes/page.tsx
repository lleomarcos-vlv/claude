import { redirect } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { IntegrationsForm } from "@/components/admin/IntegrationsForm";
import { getCurrentUser } from "@/lib/auth";
import { listSettingsForAdmin, settingGroups } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Integrações" };

/**
 * Configuração das APIs (Mercado Pago, Stripe, WhatsApp, medição…).
 *
 * Restrita ao papel ADMIN, e cada gravação exige a senha do administrador —
 * uma sessão esquecida aberta não permite trocar credenciais de pagamento.
 */
export default async function IntegracoesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/entrar?proximo=/admin/integracoes");
  if (user.role !== "ADMIN") redirect("/admin");

  const settings = await listSettingsForAdmin();
  const configured = settings.filter((s) => s.configured).length;

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <h1 className="text-title font-semibold text-verde-800">Integrações</h1>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-cinza-700">
          Configure aqui as chaves de API usadas pelo site. O que você salvar tem precedência sobre as variáveis de
          ambiente, então dá para trocar credenciais sem novo deploy.
        </p>
      </header>

      {/* Avisos de segurança */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-3 rounded-2xl border border-verde-200 bg-verde-50 p-4">
          <Icon name="lock" size={19} className="mt-0.5 shrink-0 text-verde-600" />
          <p className="text-sm leading-relaxed text-verde-800">
            <strong className="font-semibold">Guardadas com criptografia.</strong> Os campos secretos são cifrados em
            AES-256-GCM antes de ir para o banco e nunca voltam inteiros para a tela — você vê só uma prévia mascarada.
          </p>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-ambar-200 bg-ambar-50 p-4">
          <Icon name="shield" size={19} className="mt-0.5 shrink-0 text-ambar-600" />
          <p className="text-sm leading-relaxed text-ambar-700">
            <strong className="font-semibold">Confirmação por senha.</strong> Toda gravação pede sua senha de
            administrador novamente. Campos deixados em branco mantêm o valor atual.
          </p>
        </div>
      </div>

      <p className="mt-5 text-sm text-cinza-600">
        {configured} de {settings.length} configurações preenchidas.
      </p>

      <div className="mt-8">
        <IntegrationsForm settings={settings} groups={settingGroups} />
      </div>

      {/* Ajuda */}
      <section className="card mt-10 p-6">
        <h2 className="text-lg font-semibold text-verde-800">Onde encontrar cada chave</h2>
        <dl className="mt-5 space-y-4 text-[0.9375rem]">
          {[
            {
              term: "Mercado Pago",
              desc: "Painel do Mercado Pago → Seu negócio → Configurações → Gestão e administração → Credenciais. Use as credenciais de produção. O webhook aponta para /api/webhooks/mercadopago.",
            },
            {
              term: "Stripe",
              desc: "Dashboard → Developers → API keys (Secret key) e Developers → Webhooks (Signing secret). O webhook aponta para /api/webhooks/stripe.",
            },
            {
              term: "WhatsApp Cloud API",
              desc: "Meta for Developers → seu app → WhatsApp → Configuração da API. Gere um token permanente e copie o Phone Number ID.",
            },
            {
              term: "PIX",
              desc: "Sem gateway configurado, geramos o código copia-e-cola (BR Code) direto com a sua chave PIX — sem taxa de intermediação.",
            },
            {
              term: "Automações (cron)",
              desc: "Defina um segredo e agende uma chamada horária para /api/cron com o cabeçalho Authorization: Bearer <segredo>. Ele dispara lembretes 24h antes e a pesquisa de satisfação.",
            },
          ].map((item) => (
            <div key={item.term}>
              <dt className="font-medium text-verde-800">{item.term}</dt>
              <dd className="mt-0.5 leading-relaxed text-cinza-700">{item.desc}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
