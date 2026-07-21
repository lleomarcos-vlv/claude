package com.kairos.erp.inventory.app;

import com.kairos.erp.inventory.domain.ItemEstoque;
import com.kairos.erp.inventory.domain.ItemEstoqueRepository;
import com.kairos.erp.inventory.domain.MovimentacaoEstoque;
import com.kairos.erp.inventory.domain.MovimentacaoEstoqueRepository;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.error.NotFoundException;
import com.kairos.erp.shared.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class EstoqueService {

    private final ItemEstoqueRepository itens;
    private final MovimentacaoEstoqueRepository movimentacoes;

    public EstoqueService(ItemEstoqueRepository itens, MovimentacaoEstoqueRepository movimentacoes) {
        this.itens = itens;
        this.movimentacoes = movimentacoes;
    }

    @Transactional
    public ItemEstoque criarItem(String sku, String descricao, BigDecimal saldoInicial, BigDecimal pontoReposicao) {
        String tenant = TenantContext.require();
        if (itens.existsByTenantIdAndSku(tenant, sku)) {
            throw new BusinessException("SKU já cadastrado: " + sku);
        }
        ItemEstoque item = itens.save(ItemEstoque.novo(tenant, sku, descricao, saldoInicial, pontoReposicao));
        if (saldoInicial != null && saldoInicial.signum() > 0) {
            movimentacoes.save(MovimentacaoEstoque.de(tenant, item.getId(), "ENTRADA", saldoInicial, "SALDO_INICIAL"));
        }
        return item;
    }

    @Transactional(readOnly = true)
    public ItemEstoque buscar(String id) {
        return itens.findByIdAndTenantId(id, TenantContext.require())
                .orElseThrow(() -> new NotFoundException("Item de estoque não encontrado: " + id));
    }

    /** Baixa automática de estoque com origem rastreável (ex.: conclusão de OS). */
    @Transactional
    public void baixar(String itemId, BigDecimal quantidade, String origem) {
        String tenant = TenantContext.require();
        ItemEstoque item = buscar(itemId);
        item.baixa(quantidade);
        itens.save(item);
        movimentacoes.save(MovimentacaoEstoque.de(tenant, item.getId(), "SAIDA", quantidade, origem));
    }

    /** Entrada de estoque (ex.: recebimento de compra) com origem rastreável. */
    @Transactional
    public ItemEstoque entrada(String itemId, BigDecimal quantidade, String origem) {
        String tenant = TenantContext.require();
        ItemEstoque item = buscar(itemId);
        item.entrada(quantidade);
        itens.save(item);
        movimentacoes.save(MovimentacaoEstoque.de(tenant, item.getId(), "ENTRADA", quantidade, origem));
        return item;
    }

    @Transactional(readOnly = true)
    public List<ItemEstoque> listar() {
        return itens.findByTenantIdOrderBySkuAsc(TenantContext.require());
    }

    /** Itens que atingiram o ponto de reposição (sugestão de compra — KSI). */
    @Transactional(readOnly = true)
    public List<ItemEstoque> itensParaRepor() {
        return itens.findParaRepor(TenantContext.require());
    }
}
