package com.kairos.erp.scheduling.app;

import com.kairos.erp.audit.app.AuditoriaService;
import com.kairos.erp.equipment.app.EquipamentoService;
import com.kairos.erp.equipment.domain.Equipamento;
import com.kairos.erp.notification.app.NotificacaoService;
import com.kairos.erp.scheduling.domain.Agendamento;
import com.kairos.erp.scheduling.domain.AgendamentoRepository;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.error.NotFoundException;
import com.kairos.erp.shared.security.UsuarioAtual;
import com.kairos.erp.shared.tenant.TenantContext;
import com.kairos.erp.workorder.app.OrdemServicoService;
import com.kairos.erp.workorder.domain.OrdemServico;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Agendamento autônomo (cliente) + gestão de leads (gerência):
 * o cliente escolhe o horário vendo a agenda em tempo real; a gerência
 * confirma a data, registra a aeronave (se nova), cria a OS na Fila de Espera
 * e distribui para o técnico mais adequado.
 */
@Service
public class AgendamentoService {

    private final AgendamentoRepository repository;
    private final EquipamentoService equipamentos;
    private final OrdemServicoService ordens;
    private final AuditoriaService auditoria;
    private final NotificacaoService notificacoes;

    public AgendamentoService(AgendamentoRepository repository, EquipamentoService equipamentos,
                              OrdemServicoService ordens, AuditoriaService auditoria,
                              NotificacaoService notificacoes) {
        this.repository = repository;
        this.equipamentos = equipamentos;
        this.ordens = ordens;
        this.auditoria = auditoria;
        this.notificacoes = notificacoes;
    }

    @Transactional
    public Agendamento solicitar(String nomeCliente, String telefone, String serialNumber,
                                 String modelo, LocalDateTime dataHora, String observacao) {
        if (dataHora == null || dataHora.isBefore(LocalDateTime.now())) {
            throw new BusinessException("Escolha uma data e hora no futuro");
        }
        String nome = (nomeCliente == null || nomeCliente.isBlank())
                ? UsuarioAtual.nome() : nomeCliente;
        if (nome == null || nome.isBlank()) {
            throw new BusinessException("Informe o nome do cliente");
        }
        Agendamento a = repository.save(Agendamento.solicitar(
                TenantContext.require(), UsuarioAtual.id(), nome, telefone,
                serialNumber, modelo, dataHora, observacao));
        auditoria.registrar("AGENDAMENTO_SOLICITADO", "agendamento", a.getId(),
                nome + " · " + modelo + " · " + dataHora);
        notificacoes.registrar("AGENDAMENTO_SOLICITADO",
                "Novo agendamento de " + nome + " (" + modelo + ") para " + dataHora);
        return a;
    }

    /** CLIENTE vê os seus; gerência/técnicos veem todos (leads). */
    @Transactional(readOnly = true)
    public List<Agendamento> listar() {
        String tenant = TenantContext.require();
        if (UsuarioAtual.temPerfil("CLIENTE")) {
            return repository.findByTenantIdAndClienteIdOrderByDataHoraAsc(tenant, UsuarioAtual.id());
        }
        return repository.findByTenantIdOrderByDataHoraAsc(tenant);
    }

    /** Agenda em tempo real de um dia (para o cliente escolher horário livre). */
    @Transactional(readOnly = true)
    public List<Agendamento> agendaDoDia(LocalDate dia) {
        return repository.findByTenantIdAndDataHoraBetweenOrderByDataHoraAsc(
                TenantContext.require(), dia.atStartOfDay(), dia.plusDays(1).atStartOfDay());
    }

    /**
     * Gerência confirma o lead: registra a aeronave (se nova), abre a OS na
     * Fila de Espera vinculada ao cliente e distribui ao técnico escolhido.
     */
    @Transactional
    public Agendamento confirmar(String id, String tecnicoId, LocalDateTime dataConfirmada) {
        Agendamento a = buscar(id);

        Equipamento eq = equipamentos.obterOuRegistrar(a.getSerialNumber(), a.getModelo());
        OrdemServico os = ordens.abrirChamado(eq.getId(),
                "Manutenção agendada — " + a.getNomeCliente() + " · " + a.getDataHora(),
                a.getClienteId(), "Agendamento");
        if (tecnicoId != null && !tecnicoId.isBlank()) {
            ordens.atribuirTecnico(os.getId(), tecnicoId);
        }

        a.confirmar(os.getId(), dataConfirmada);
        repository.save(a);
        auditoria.registrar("AGENDAMENTO_CONFIRMADO", "agendamento", a.getId(),
                "OS " + os.getNumero());
        notificacoes.registrar("AGENDAMENTO_CONFIRMADO",
                "Agendamento de " + a.getNomeCliente() + " confirmado — OS " + os.getNumero()
                        + " na fila de espera");
        return a;
    }

    @Transactional
    public Agendamento recusar(String id) {
        Agendamento a = buscar(id);
        a.recusar();
        repository.save(a);
        auditoria.registrar("AGENDAMENTO_RECUSADO", "agendamento", a.getId(), a.getNomeCliente());
        return a;
    }

    @Transactional(readOnly = true)
    public Agendamento buscar(String id) {
        return repository.findByIdAndTenantId(id, TenantContext.require())
                .orElseThrow(() -> new NotFoundException("Agendamento não encontrado: " + id));
    }
}
