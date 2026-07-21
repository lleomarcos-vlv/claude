package com.kairos.erp.workorder.app;

import com.kairos.erp.equipment.app.EquipamentoService;
import com.kairos.erp.inventory.app.EstoqueService;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.error.NotFoundException;
import com.kairos.erp.shared.tenant.TenantContext;
import com.kairos.erp.workorder.domain.OrdemServico;
import com.kairos.erp.workorder.domain.OrdemServicoItem;
import com.kairos.erp.workorder.domain.OrdemServicoItemRepository;
import com.kairos.erp.workorder.domain.OrdemServicoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Serviço de aplicação da Ordem de Serviço. Coordena os contextos de
 * Equipamento (histórico) e Estoque/KSI (baixa automática) na conclusão.
 *
 * <p>No skeleton a coordenação é por chamada direta de serviços de aplicação
 * dentro da mesma transação. A evolução (doc 09) troca isso por eventos de
 * domínio (ex.: {@code OSConcluida} → baixa via outbox).</p>
 */
@Service
public class OrdemServicoService {

    private final OrdemServicoRepository ordens;
    private final OrdemServicoItemRepository itens;
    private final EquipamentoService equipamentoService;
    private final EstoqueService estoqueService;

    public OrdemServicoService(OrdemServicoRepository ordens,
                               OrdemServicoItemRepository itens,
                               EquipamentoService equipamentoService,
                               EstoqueService estoqueService) {
        this.ordens = ordens;
        this.itens = itens;
        this.equipamentoService = equipamentoService;
        this.estoqueService = estoqueService;
    }

    @Transactional
    public OrdemServico abrir(String equipamentoId, String descricao) {
        String tenant = TenantContext.require();
        equipamentoService.buscar(equipamentoId); // valida existência + tenant
        String numero = String.format("OS-%06d", ordens.countByTenantId(tenant) + 1);
        return ordens.save(OrdemServico.abrir(tenant, numero, equipamentoId, descricao));
    }

    @Transactional
    public OrdemServicoItem adicionarItem(String ordemServicoId, String itemId, BigDecimal quantidade) {
        OrdemServico os = buscar(ordemServicoId);
        if (os.estaConcluida()) {
            throw new BusinessException("Não é possível adicionar itens a uma OS concluída");
        }
        estoqueService.buscar(itemId); // valida item + tenant
        return itens.save(OrdemServicoItem.de(os.getId(), itemId, quantidade));
    }

    @Transactional(readOnly = true)
    public OrdemServico buscar(String id) {
        return ordens.findByIdAndTenantId(id, TenantContext.require())
                .orElseThrow(() -> new NotFoundException("Ordem de serviço não encontrada: " + id));
    }

    @Transactional(readOnly = true)
    public List<OrdemServicoItem> itensDa(String ordemServicoId) {
        buscar(ordemServicoId);
        return itens.findByOrdemServicoId(ordemServicoId);
    }

    /**
     * Conclui a OS: baixa automática das peças no estoque (KSI) e registro do
     * serviço no histórico vitalício do equipamento. Tudo na mesma transação —
     * se qualquer baixa falhar (saldo insuficiente), nada é persistido.
     */
    @Transactional
    public OrdemServico concluir(String ordemServicoId) {
        OrdemServico os = buscar(ordemServicoId);
        List<OrdemServicoItem> pecas = itens.findByOrdemServicoId(os.getId());

        for (OrdemServicoItem peca : pecas) {
            estoqueService.baixar(peca.getItemId(), peca.getQuantidade(), "OS:" + os.getNumero());
        }

        os.concluir();
        ordens.save(os);

        equipamentoService.registrarEvento(
                os.getEquipamentoId(), "SERVICO",
                "Ordem de serviço " + os.getNumero() + " concluída",
                "{\"numero\":\"" + os.getNumero() + "\",\"pecas\":" + pecas.size() + "}");

        return os;
    }
}
