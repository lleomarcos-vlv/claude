import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { pageMetadata } from "@/lib/seo";
import { money } from "@/lib/format";
import { MIN_VISIT_PRICE } from "@/content/services";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Termos de Uso",
  description: "Condições de contratação de serviços e planos da Verde Fixo: prazos, pagamentos, garantias e cancelamento.",
  path: "/termos",
});

export default function TermosPage() {
  return (
    <>
      <PageHeader
        eyebrow="Termos"
        title="Termos de Uso e Condições de Serviço"
        description="Última atualização: 28 de julho de 2026"
        breadcrumb={[{ label: "Termos" }]}
      />

      <section className="section">
        <div className="container-narrow prose-vf">
          <p>
            Estes termos regem a contratação de serviços e planos da {site.legalName} (CNPJ {site.cnpj}), por meio do site{" "}
            {site.url.replace(/^https?:\/\//, "")} ou dos nossos canais de atendimento.
          </p>

          <h2>1. Serviços</h2>
          <p>
            Prestamos serviços de jardinagem, paisagismo e manutenção de áreas verdes, executados por equipe própria com
            equipamento e ferramentas inclusos. O escopo de cada serviço é o descrito na respectiva página do site e
            confirmado no orçamento.
          </p>

          <h2>2. Preços e orçamentos</h2>
          <ul>
            <li>Serviços avulsos são cobrados por metro quadrado, dentro das faixas publicadas na página de serviços.</li>
            <li>
              Aplicamos valor mínimo de visita de <strong>{money(MIN_VISIT_PRICE)}</strong> para serviços avulsos, o que
              cobre deslocamento, maquinário e equipe.
            </li>
            <li>
              O valor final é confirmado após avaliarmos a área, o acesso ao local e o volume de resíduo. Nenhum custo
              adicional é cobrado sem sua aprovação prévia.
            </li>
            <li>Orçamentos são gratuitos e válidos por 15 dias.</li>
          </ul>

          <h2>3. Agendamento e reagendamento</h2>
          <ul>
            <li>O agendamento online exige antecedência mínima de 24 horas.</li>
            <li>Atendemos de segunda a sexta das 7h às 19h e aos sábados até as 15h. Não atendemos domingos.</li>
            <li>
              Em caso de chuva que inviabilize o serviço, reagendamos sem custo para a primeira data disponível — em
              geral em até 48 horas.
            </li>
            <li>
              Cancelamentos com menos de 12 horas de antecedência, ou impossibilidade de acesso ao local no horário
              combinado, podem gerar cobrança de 50% do valor da visita.
            </li>
          </ul>

          <h2>4. Planos do Clube Verde Fixo</h2>
          <ul>
            <li>A mensalidade varia conforme o porte do terreno, informado no momento da contratação.</li>
            <li>
              <strong>Não há fidelidade nem multa de cancelamento.</strong> Você cancela pelo painel do cliente e os
              serviços já pagos seguem válidos até o fim do período contratado.
            </li>
            <li>É possível pausar a assinatura por até 60 dias por ano, mantendo o preço contratado.</li>
            <li>
              Na troca de plano, o upgrade vale imediatamente com cobrança proporcional da diferença; o downgrade entra no
              ciclo seguinte.
            </li>
            <li>
              A frequência de visitas é ajustada pela estação do ano: mais visitas na primavera e no verão, menos no
              outono e inverno, respeitando o total contratado no período.
            </li>
          </ul>

          <h2>5. Pagamento</h2>
          <p>
            Aceitamos PIX, cartão de crédito (com cobrança recorrente automática nos planos), boleto para pessoa jurídica
            e link de pagamento. Emitimos nota fiscal de serviço para pessoa física e jurídica. O atraso superior a 15
            dias suspende a execução dos serviços até a regularização.
          </p>

          <h2>6. Responsabilidades do cliente</h2>
          <ul>
            <li>Garantir o acesso ao local no horário agendado.</li>
            <li>Informar sobre animais soltos, cercas elétricas, irrigação enterrada e plantas de valor especial.</li>
            <li>Manter livre a área a ser trabalhada, retirando objetos frágeis e brinquedos.</li>
          </ul>

          <h2>7. Garantia de satisfação</h2>
          <p>
            Se o serviço não atender ao combinado, avise em até <strong>72 horas</strong> e refazemos sem custo. Se ainda
            assim não resolvermos, devolvemos o valor da visita. A garantia não cobre danos causados por terceiros,
            eventos climáticos posteriores à execução ou falta dos cuidados básicos orientados pela nossa equipe.
          </p>

          <h2>8. Danos e seguro</h2>
          <p>
            Nossa equipe é registrada em CLT e contamos com seguro de responsabilidade civil. Danos comprovadamente
            causados durante a execução são reparados ou indenizados. Comunique em até 48 horas após o serviço.
          </p>

          <h2>9. Plantas e garantia de pega</h2>
          <p>
            Mudas e gramas fornecidas por nós têm garantia de pega de 90 dias, desde que sejam seguidas as orientações de
            irrigação entregues após o plantio. A garantia não cobre perdas por falta de rega, pisoteio excessivo,
            aplicação de produtos por terceiros ou eventos climáticos extremos.
          </p>

          <h2>10. Propriedade das imagens</h2>
          <p>
            As fotos de antes e depois pertencem à Verde Fixo e podem ser usadas em nosso portfólio, sempre sem revelar
            endereço ou identificação do cliente. Se preferir que não usemos, basta avisar — respeitamos sem
            questionamento.
          </p>

          <h2>11. Foro</h2>
          <p>
            Estes termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de {site.address.city}/
            {site.address.state} para dirimir eventuais controvérsias, sem prejuízo do direito do consumidor de escolher o
            foro do seu domicílio.
          </p>

          <p>
            Veja também nossa <Link href="/privacidade">Política de Privacidade</Link> e a{" "}
            <Link href="/cookies">política de cookies</Link>.
          </p>
        </div>
      </section>
    </>
  );
}
