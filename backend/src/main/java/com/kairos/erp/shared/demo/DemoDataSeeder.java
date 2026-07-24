package com.kairos.erp.shared.demo;

import com.kairos.erp.equipment.app.EquipamentoService;
import com.kairos.erp.identity.app.RegistroService;
import com.kairos.erp.identity.app.RegistroService.Registro;
import com.kairos.erp.identity.app.UsuarioService;
import com.kairos.erp.identity.domain.Perfil;
import com.kairos.erp.identity.domain.Usuario;
import com.kairos.erp.inventory.app.EstoqueService;
import com.kairos.erp.scheduling.app.AgendamentoService;
import com.kairos.erp.shared.tenant.TenantContext;
import com.kairos.erp.tenancy.domain.EmpresaRepository;
import com.kairos.erp.workorder.app.OrdemServicoService;
import com.kairos.erp.workorder.domain.OrdemServico;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Semeia uma oficina Conlor Drones de demonstração (DJI Agras) com o fluxo
 * completo: peças precificadas (custo + venda), aeronaves, agendamento, e OSs em
 * vários estágios (fila, aguardando aprovação, concluídas). Pronto para testar
 * sem cadastrar nada à mão.
 *
 * <p>Ativado só com {@code kairos.demo.seed=true}. Idempotente.</p>
 *
 * <p>Acessos de demonstração (senha <code>kairos-demo-123</code>):
 * Desenvolvedor <code>dev@conlor.com</code> · ADM <code>admin@conlor.com</code> ·
 * Técnico <code>tecnico@conlor.com</code> · Cliente <code>cliente@conlor.com</code>.</p>
 */
@Component
@ConditionalOnProperty(name = "kairos.demo.seed", havingValue = "true")
public class DemoDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);
    static final String SENHA = "kairos-demo-123";

    private final EmpresaRepository empresas;
    private final RegistroService registro;
    private final UsuarioService usuarios;
    private final EquipamentoService equipamentos;
    private final EstoqueService estoque;
    private final OrdemServicoService ordens;
    private final AgendamentoService agendamentos;

    public DemoDataSeeder(EmpresaRepository empresas, RegistroService registro, UsuarioService usuarios,
                          EquipamentoService equipamentos, EstoqueService estoque, OrdemServicoService ordens,
                          AgendamentoService agendamentos) {
        this.empresas = empresas;
        this.registro = registro;
        this.usuarios = usuarios;
        this.equipamentos = equipamentos;
        this.estoque = estoque;
        this.ordens = ordens;
        this.agendamentos = agendamentos;
    }

    @Override
    public void run(String... args) {
        if (empresas.count() > 0) {
            log.info("[demo] Dados já existentes — seed ignorado.");
            return;
        }
        log.info("[demo] Semeando oficina Conlor Drones (demonstração)…");

        Registro r = registro.registrar(
                "Conlor Drones (Demo)", "00.000.000/0001-00",
                "Gerência Conlor", "admin@conlor.com", SENHA);
        String tenant = r.empresa().getId();

        try {
            TenantContext.set(tenant);

            usuarios.criar(tenant, "Desenvolvedor", "dev@conlor.com", SENHA, Perfil.DEV);
            Usuario tecnico = usuarios.criar(tenant, "Técnico Conlor", "tecnico@conlor.com", SENHA, Perfil.TECNICO);
            Usuario cliente = usuarios.criar(tenant, "João Agricultor", "cliente@conlor.com", SENHA, Perfil.CLIENTE);

            // Peças (estoque virtual precificado: custo de compra + preço de venda + fornecedor)
            String helice = estoque.criarItem("HELICE-54", "Hélice 54 pol (par)",
                    bd(30), bd(10), bd(320), bd(180), "DJI Store Brasil").getId();
            String anel = estoque.criarItem("ANEL-BOMBA", "Anel de vedação da bomba de pulverização",
                    bd(8), bd(10), bd(90), bd(35), "AgroPeças Ltda").getId();  // abaixo do ponto → reposição
            String bico = estoque.criarItem("BICO-XR", "Bico de pulverização XR110",
                    bd(40), bd(12), bd(45), bd(18), "AgroPeças Ltda").getId();
            estoque.criarItem("RADAR-OMNI", "Radar omnidirecional",
                    bd(6), bd(3), bd(1800), bd(1150), "DJI Store Brasil");
            estoque.criarItem("BATERIA-T40", "Bateria inteligente DB1560 (T40)",
                    bd(5), bd(4), bd(6200), bd(4300), "DJI Store Brasil");
            String eixo = estoque.criarItem("EIXO-BRACO", "Eixo do braço do motor",
                    bd(15), bd(6), bd(210), bd(95), "Drone Parts SP").getId();

            // Aeronaves DJI Agras
            String t20 = equipamentos.registrar("SN-AGRAS-T20-001", "DJI Agras T20", "DJI").getId();
            String t40 = equipamentos.registrar("SN-AGRAS-T40-002", "DJI Agras T40", "DJI").getId();
            String t20b = equipamentos.registrar("SN-AGRAS-T20-003", "DJI Agras T20", "DJI").getId();

            // Histórico crônico do T20: 3 manutenções concluídas com o anel da bomba
            manutencaoConcluida(t20, anel, 1);
            manutencaoConcluida(t20, anel, 1);
            manutencaoConcluida(t20b, anel, 1);
            // e uma de hélices
            manutencaoConcluida(t20, helice, 1);

            // OS concluída (T40) consumindo bicos
            manutencaoConcluida(t40, bico, 4);

            // OS AGUARDANDO APROVAÇÃO (T20b) — pronta para o admin aprovar na UI
            OrdemServico orc = ordens.abrirChamado(t20b, "Cliente relatou queda durante voo",
                    cliente.getId(), "WhatsApp");
            ordens.atribuirTecnico(orc.getId(), tecnico.getId());
            ordens.iniciarOrcamento(orc.getId());
            ordens.adicionarItem(orc.getId(), helice, bd(1));
            ordens.adicionarItem(orc.getId(), eixo, bd(2));
            ordens.registrarDiagnostico(orc.getId(),
                    "Padrão de queda: hélices e eixo do braço danificados", bd(150));
            ordens.diagnosticar(orc.getId(), java.util.List.of("deriva", "perda_conexao"));
            ordens.enviarParaAprovacao(orc.getId());

            // OS na FILA DE ESPERA (T20) atribuída ao técnico
            OrdemServico fila = ordens.abrirChamado(t20, "Revisão preventiva agendada",
                    cliente.getId(), "Site");
            ordens.atribuirTecnico(fila.getId(), tecnico.getId());

            // Agendamento SOLICITADO (lead) — aguardando confirmação da gerência
            agendamentos.solicitar("Maria Fazenda", "(11) 98888-0000", "SN-AGRAS-T40-050",
                    "DJI Agras T40", LocalDateTime.now().plusDays(2).withHour(9).withMinute(0),
                    "Bomba de pulverização entupindo");

            log.info("[demo] Pronto. ADM admin@conlor.com | Técnico tecnico@conlor.com | "
                    + "Cliente cliente@conlor.com — senha {} (tenant {})", SENHA, tenant);
        } finally {
            TenantContext.clear();
        }
    }

    /** Abre uma OS, percorre todo o fluxo (com aprovação) e conclui. */
    private String manutencaoConcluida(String equipamentoId, String pecaId, int qtd) {
        OrdemServico os = ordens.abrir(equipamentoId, "Manutenção");
        ordens.iniciarOrcamento(os.getId());
        ordens.adicionarItem(os.getId(), pecaId, bd(qtd));
        ordens.registrarDiagnostico(os.getId(), "Manutenção preventiva/corretiva", BigDecimal.ZERO);
        ordens.enviarParaAprovacao(os.getId());   // ORCAMENTO → AGUARDANDO_APROVACAO
        ordens.aprovar(os.getId());                // → APROVADO
        ordens.iniciarManutencao(os.getId());      // → ESTAGIO_1
        ordens.concluir(os.getId());               // → CONCLUIDA (baixa + histórico)
        return os.getId();
    }

    private static BigDecimal bd(int v) {
        return BigDecimal.valueOf(v);
    }
}
