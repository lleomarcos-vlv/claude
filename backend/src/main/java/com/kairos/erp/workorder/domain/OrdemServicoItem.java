package com.kairos.erp.workorder.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Peça do orçamento de uma OS (integrada ao estoque). Guarda o estágio em que
 * entrou — 1 (orçamento inicial) ou 2 (adicional pós-diagnóstico, destacada
 * para a 2ª aprovação) — e o preço unitário congelado no momento da inclusão.
 */
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

    @Column(name = "estagio", nullable = false)
    private int estagio;

    @Column(name = "preco_unitario", precision = 18, scale = 2, nullable = false)
    private BigDecimal precoUnitario;

    /** Já deu baixa no estoque? A baixa ocorre na aprovação do orçamento. */
    @Column(name = "baixado", nullable = false)
    private boolean baixado;

    protected OrdemServicoItem() {
    }

    public static OrdemServicoItem de(String ordemServicoId, String itemId, BigDecimal quantidade,
                                      int estagio, BigDecimal precoUnitario) {
        OrdemServicoItem osi = new OrdemServicoItem();
        osi.id = UUID.randomUUID().toString();
        osi.ordemServicoId = ordemServicoId;
        osi.itemId = itemId;
        osi.quantidade = quantidade;
        osi.estagio = estagio;
        osi.precoUnitario = precoUnitario == null ? BigDecimal.ZERO : precoUnitario;
        return osi;
    }

    /** Subtotal desta linha do orçamento (quantidade × preço congelado). */
    public BigDecimal subtotal() {
        return precoUnitario.multiply(quantidade);
    }

    public boolean ehAdicional() {
        return estagio == 2;
    }

    public boolean isBaixado() {
        return baixado;
    }

    public void marcarBaixado() {
        this.baixado = true;
    }

    public void alterarQuantidade(java.math.BigDecimal novaQuantidade) {
        if (novaQuantidade == null || novaQuantidade.signum() <= 0) {
            throw new com.kairos.erp.shared.error.BusinessException("Quantidade deve ser positiva");
        }
        if (baixado) {
            throw new com.kairos.erp.shared.error.BusinessException(
                    "A peça já deu baixa no estoque e não pode ser alterada");
        }
        this.quantidade = novaQuantidade;
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

    public int getEstagio() {
        return estagio;
    }

    public BigDecimal getPrecoUnitario() {
        return precoUnitario;
    }
}
