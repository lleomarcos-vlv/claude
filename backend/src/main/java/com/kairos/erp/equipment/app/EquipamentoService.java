package com.kairos.erp.equipment.app;

import com.kairos.erp.equipment.domain.Equipamento;
import com.kairos.erp.equipment.domain.EquipamentoEvento;
import com.kairos.erp.equipment.domain.EquipamentoEventoRepository;
import com.kairos.erp.equipment.domain.EquipamentoRepository;
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

    public EquipamentoService(EquipamentoRepository equipamentos, EquipamentoEventoRepository eventos) {
        this.equipamentos = equipamentos;
        this.eventos = eventos;
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
        return e;
    }

    @Transactional(readOnly = true)
    public Equipamento buscar(String id) {
        return equipamentos.findByIdAndTenantId(id, TenantContext.require())
                .orElseThrow(() -> new NotFoundException("Equipamento não encontrado: " + id));
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
