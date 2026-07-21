package com.kairos.erp.workorder.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

/** Peça consumida em uma Ordem de Serviço (liga a OS a um item do KSI). */
@Entity
@Table(name = "ordem_servico_item")
public class OrdemServicoItem {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "ordem_servico_id", length = 36, nullable = false)
    private String ordemServicoId;

    @Column(name = "item_id", length = 36, nullable = false)
    private String itemId;

    @Column(name = "quantidade", precision = 18, scale = 4, nullable = false)
    private BigDecimal quantidade;

    protected OrdemServicoItem() {
    }

    public static OrdemServicoItem de(String ordemServicoId, String itemId, BigDecimal quantidade) {
        OrdemServicoItem osi = new OrdemServicoItem();
        osi.id = UUID.randomUUID().toString();
        osi.ordemServicoId = ordemServicoId;
        osi.itemId = itemId;
        osi.quantidade = quantidade;
        return osi;
    }

    public String getId() {
        return id;
    }

    public String getOrdemServicoId() {
        return ordemServicoId;
    }

    public String getItemId() {
        return itemId;
    }

    public BigDecimal getQuantidade() {
        return quantidade;
    }
}
