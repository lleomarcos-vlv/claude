package com.kairos.erp.inventory.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Movimentação de estoque (entrada/saída/ajuste). Registro histórico de cada
 * alteração de saldo, com a origem (ex.: {@code OS:<id>} na baixa automática).
 */
@Entity
@Table(name = "movimentacao_estoque")
public class MovimentacaoEstoque {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "item_id", length = 36, nullable = false)
    private String itemId;

    @Column(name = "tipo", length = 20, nullable = false)
    private String tipo;

    @Column(name = "quantidade", precision = 18, scale = 4, nullable = false)
    private BigDecimal quantidade;

    @Column(name = "origem", length = 80)
    private String origem;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected MovimentacaoEstoque() {
    }

    public static MovimentacaoEstoque de(String tenantId, String itemId, String tipo,
                                         BigDecimal quantidade, String origem) {
        MovimentacaoEstoque m = new MovimentacaoEstoque();
        m.id = UUID.randomUUID().toString();
        m.tenantId = tenantId;
        m.itemId = itemId;
        m.tipo = tipo;
        m.quantidade = quantidade;
        m.origem = origem;
        m.criadoEm = LocalDateTime.now();
        return m;
    }

    public String getId() {
        return id;
    }

    public String getItemId() {
        return itemId;
    }

    public String getTipo() {
        return tipo;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }

    public String getOrigem() {
        return origem;
    }
}
