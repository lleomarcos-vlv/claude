package com.kairos.erp.inventory.domain;

import com.kairos.erp.shared.error.BusinessException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Item de estoque (KSI). Mantém saldo e ponto de reposição. As alterações de
 * saldo passam pelos métodos de domínio {@link #entrada} / {@link #baixa},
 * que preservam a invariante de saldo não-negativo.
 */
@Entity
@Table(name = "item_estoque")
public class ItemEstoque {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "sku", length = 60, nullable = false)
    private String sku;

    @Column(name = "descricao", length = 200, nullable = false)
    private String descricao;

    @Column(name = "saldo", precision = 18, scale = 4, nullable = false)
    private BigDecimal saldo;

    @Column(name = "ponto_reposicao", precision = 18, scale = 4, nullable = false)
    private BigDecimal pontoReposicao;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected ItemEstoque() {
    }

    public static ItemEstoque novo(String tenantId, String sku, String descricao,
                                   BigDecimal saldoInicial, BigDecimal pontoReposicao) {
        ItemEstoque i = new ItemEstoque();
        i.id = UUID.randomUUID().toString();
        i.tenantId = tenantId;
        i.sku = sku;
        i.descricao = descricao;
        i.saldo = saldoInicial == null ? BigDecimal.ZERO : saldoInicial;
        i.pontoReposicao = pontoReposicao == null ? BigDecimal.ZERO : pontoReposicao;
        i.criadoEm = LocalDateTime.now();
        return i;
    }

    public void entrada(BigDecimal quantidade) {
        exigirPositivo(quantidade);
        this.saldo = this.saldo.add(quantidade);
    }

    public void baixa(BigDecimal quantidade) {
        exigirPositivo(quantidade);
        if (this.saldo.compareTo(quantidade) < 0) {
            throw new BusinessException("Saldo insuficiente para o item " + sku
                    + " (saldo " + saldo + ", solicitado " + quantidade + ")");
        }
        this.saldo = this.saldo.subtract(quantidade);
    }

    /** Indica se o item atingiu ou cruzou o ponto de reposição. */
    public boolean precisaRepor() {
        return saldo.compareTo(pontoReposicao) <= 0;
    }

    private static void exigirPositivo(BigDecimal quantidade) {
        if (quantidade == null || quantidade.signum() <= 0) {
            throw new BusinessException("Quantidade deve ser positiva");
        }
    }

    public String getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getSku() {
        return sku;
    }

    public String getDescricao() {
        return descricao;
    }

    public BigDecimal getSaldo() {
        return saldo;
    }

    public BigDecimal getPontoReposicao() {
        return pontoReposicao;
    }
}
