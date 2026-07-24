package com.kairos.erp.equipment.app;

import com.kairos.erp.equipment.domain.Equipamento;
import com.kairos.erp.equipment.domain.EquipamentoEvento;
import com.kairos.erp.equipment.domain.EquipamentoEventoRepository;
import com.kairos.erp.equipment.domain.EquipamentoRepository;
import com.kairos.erp.audit.app.AuditoriaService;
import com.kairos.erp.notification.app.NotificacaoService;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.error.NotFoundException;
import com.kairos.erp.shared.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EquipamentoService {

    private final EquipamentoRepository equipamentos;
    private final EquipamentoEventoRepository eventos;
    private final AuditoriaService auditoria;
    private final NotificacaoService notificacoes;

    public EquipamentoService(EquipamentoRepository equipamentos, EquipamentoEventoRepository eventos,
                              AuditoriaService auditoria, NotificacaoService notificacoes) {
        this.equipamentos = equipamentos;
        this.eventos = eventos;
        this.auditoria = auditoria;
        this.notificacoes = notificacoes;
    }

    @Transactional
    public Equipamento registrar(String serialNumber, String modelo, String fabricante) {
        if (equipamentos.existsBySerialNumber(serialNumber)) {
            throw new BusinessException("Serial Number já registrado: " + serialNumber);
        }
        String tenant = TenantContext.require();
        Equipamento e = equipamentos.save(Equipamento.registrar(tenant, serialNumber, modelo, fabricante));
        registrarEvento(e.getId(), "REGISTRO", "Equipamento registrado na plataforma",
                "{\"serialNumber\":\"" + serialNumber + "\"}");
        auditoria.registrar("EQUIPAMENTO_REGISTRADO", "equipamento", e.getId(), "SN " + serialNumber);
        return e;
    }

    @Transactional(readOnly = true)
    public Equipamento buscar(String id) {
        return equipamentos.findByIdAndTenantId(id, TenantContext.require())
                .orElseThrow(() -> new NotFoundException("Equipamento não encontrado: " + id));
    }

    /**
     * Busca a aeronave pelo Serial Number no tenant; se não existir, registra
     * (usado na confirmação de agendamentos — o cliente informa S/N e modelo).
     */
    @Transactional
    public Equipamento obterOuRegistrar(String serialNumber, String modelo) {
        return equipamentos.findBySerialNumberAndTenantId(serialNumber, TenantContext.require())
                .orElseGet(() -> registrar(serialNumber, modelo, null));
    }

    /**
     * Transfere a posse/custódia do equipamento (fabricante → revenda → cliente),
     * registrando a mudança no histórico vitalício (RF-022).
     */
    @Transactional
    public Equipamento transferir(String equipamentoId, String paraTipo, String paraNome, String observacao) {
        Equipamento e = buscar(equipamentoId);
        String de = e.getPosseNome() == null ? "—" : e.getPosseNome();
        e.transferir(paraTipo, paraNome);
        equipamentos.save(e);
        String detalhe = observacao == null || observacao.isBlank() ? "" : " — " + observacao;
        registrarEvento(equipamentoId, "TRANSFERENCIA",
                "Posse transferida de " + de + " para " + paraNome + " (" + paraTipo + ")" + detalhe,
                "{\"para\":\"" + paraNome + "\",\"tipo\":\"" + paraTipo + "\"}");
        auditoria.registrar("EQUIPAMENTO_TRANSFERIDO", "equipamento", equipamentoId,
                paraNome + " (" + paraTipo + ")");
        notificacoes.registrar("TRANSFERENCIA",
                "Equipamento " + e.getSerialNumber() + " transferido para " + paraNome);
        return e;
    }

    @Transactional(readOnly = true)
    public List<Equipamento> listar() {
        return equipamentos.findByTenantIdOrderByCriadoEmDesc(TenantContext.require());
    }

    @Transactional(readOnly = true)
    public List<EquipamentoEvento> historico(String equipamentoId) {
        buscar(equipamentoId); // garante existência + isolamento de tenant
        return eventos.findByEquipamentoIdOrderBySequenciaAsc(equipamentoId);
    }

    /** Acrescenta um evento ao histórico vitalício (append-only). */
    @Transactional
    public void registrarEvento(String equipamentoId, String tipo, String descricao, String dados) {
        String tenant = TenantContext.require();
        long proximaSequencia = eventos.countByEquipamentoId(equipamentoId) + 1;
        eventos.save(EquipamentoEvento.de(tenant, equipamentoId, proximaSequencia, tipo, descricao, dados));
    }
}
