import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Política de Privacidade",
  description: "Como a Verde Fixo coleta, usa, protege e compartilha seus dados pessoais, em conformidade com a LGPD.",
  path: "/privacidade",
});

const updatedAt = "28 de julho de 2026";

export default function PrivacidadePage() {
  return (
    <>
      <PageHeader
        eyebrow="LGPD"
        title="Política de Privacidade"
        description={`Última atualização: ${updatedAt}`}
        breadcrumb={[{ label: "Privacidade" }]}
      />

      <section className="section">
        <div className="container-narrow prose-vf">
          <p>
            A {site.legalName} (“Verde Fixo”, “nós”) respeita sua privacidade. Esta política explica quais dados
            coletamos, para que usamos, com quem compartilhamos e quais são os seus direitos, conforme a Lei Geral de
            Proteção de Dados (Lei 13.709/2018).
          </p>

          <h2>1. Quem é o controlador dos dados</h2>
          <p>
            {site.legalName}, CNPJ {site.cnpj}, com sede em {site.address.street}, {site.address.district},{" "}
            {site.address.city}/{site.address.state}, CEP {site.address.zip}.
          </p>
          <p>
            Contato do encarregado de dados (DPO): <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>

          <h2>2. Quais dados coletamos</h2>
          <p>Coletamos apenas o necessário para prestar o serviço:</p>
          <ul>
            <li>
              <strong>Cadastro e contato:</strong> nome, e-mail, telefone, WhatsApp e senha (armazenada apenas como hash
              criptográfico — nunca em texto legível).
            </li>
            <li>
              <strong>Execução do serviço:</strong> endereço, CEP, tipo de imóvel, metragem, observações e fotos que você
              envia do jardim.
            </li>
            <li>
              <strong>Transacionais:</strong> agendamentos, orçamentos, assinaturas, faturas e histórico de atendimentos.
            </li>
            <li>
              <strong>Navegação:</strong> páginas visitadas, origem do acesso e dados técnicos do dispositivo — somente
              se você autorizar cookies de medição.
            </li>
          </ul>
          <p>
            Não coletamos dados sensíveis (origem racial, convicção religiosa, opinião política, saúde, biometria) nem
            dados de crianças e adolescentes.
          </p>

          <h2>3. Para que usamos</h2>
          <ul>
            <li>Executar o serviço contratado e gerenciar sua conta — base legal: execução de contrato.</li>
            <li>Enviar confirmações, lembretes e pesquisas de satisfação — base legal: execução de contrato.</li>
            <li>Emitir nota fiscal e cumprir obrigações fiscais — base legal: obrigação legal.</li>
            <li>Melhorar o site e medir resultados — base legal: consentimento (cookies de medição).</li>
            <li>Enviar novidades e ofertas — base legal: consentimento, revogável a qualquer momento.</li>
          </ul>

          <h2>4. Com quem compartilhamos</h2>
          <p>Apenas com quem é indispensável para o serviço funcionar:</p>
          <ul>
            <li>
              <strong>Meios de pagamento</strong> (Mercado Pago, Stripe) — para processar cobranças. Não armazenamos
              dados de cartão em nossos servidores.
            </li>
            <li>
              <strong>Comunicação</strong> (WhatsApp Business API, provedor de e-mail) — para enviar confirmações e
              lembretes.
            </li>
            <li>
              <strong>Medição</strong> (Google Analytics, Meta) — apenas com seu consentimento.
            </li>
            <li>
              <strong>Autoridades públicas</strong> — quando houver obrigação legal ou ordem judicial.
            </li>
          </ul>
          <p>Não vendemos nem alugamos seus dados pessoais. Nunca.</p>

          <h2>5. Por quanto tempo guardamos</h2>
          <ul>
            <li>Dados de conta: enquanto sua conta estiver ativa.</li>
            <li>Registros fiscais e financeiros: 5 anos, por exigência legal.</li>
            <li>Fotos de serviços: 2 anos, salvo se você pedir a exclusão antes.</li>
            <li>Dados de navegação: até 14 meses.</li>
          </ul>

          <h2>6. Seus direitos</h2>
          <p>A LGPD garante que você pode, a qualquer momento:</p>
          <ul>
            <li>confirmar se tratamos seus dados e acessá-los;</li>
            <li>corrigir dados incompletos ou desatualizados;</li>
            <li>solicitar anonimização, bloqueio ou eliminação de dados desnecessários;</li>
            <li>solicitar a portabilidade a outro fornecedor;</li>
            <li>revogar o consentimento e se opor a tratamentos baseados nele;</li>
            <li>saber com quem compartilhamos seus dados.</li>
          </ul>
          <p>
            Para exercer qualquer um desses direitos, escreva para{" "}
            <a href={`mailto:${site.email}`}>{site.email}</a>. Respondemos em até 15 dias.
          </p>

          <h2>7. Segurança</h2>
          <p>
            Usamos HTTPS em todo o site, senhas protegidas por derivação criptográfica com sal por usuário, credenciais de
            integração cifradas em AES-256-GCM, controle de acesso por perfil, limite de tentativas nos formulários e
            proteção contra automação (captcha e honeypot). Nenhum sistema é infalível — se ocorrer um incidente que possa
            gerar risco a você, comunicamos você e a ANPD conforme a lei.
          </p>

          <h2>8. Cookies</h2>
          <p>
            Cookies necessários mantêm sua sessão e a segurança do site e não podem ser desativados. Cookies de medição e
            marketing só são carregados depois do seu aceite no banner. Você pode revisar sua escolha quando quiser na{" "}
            <Link href="/cookies">página de cookies</Link>.
          </p>

          <h2>9. Alterações nesta política</h2>
          <p>
            Podemos atualizar esta política para refletir mudanças no serviço ou na legislação. Quando a mudança for
            relevante, avisamos por e-mail ou por aviso em destaque no site.
          </p>

          <h2>10. Fale com a gente</h2>
          <p>
            Dúvidas sobre privacidade? Escreva para <a href={`mailto:${site.email}`}>{site.email}</a> ou chame no WhatsApp{" "}
            {site.whatsappLabel}. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
          </p>
        </div>
      </section>
    </>
  );
}
