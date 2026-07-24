package com.kairos.erp.finance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lançamento financeiro (conta a receber/pagar) — doc 18. Pode ter origem
 * rastreável (ex.: faturamento de uma OS concluída).
 */
@Entity
@Table(name = "lancamento_financeiro")
public class LancamentoFinanceiro {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "tipo", length = 10, nullable = false)
    private String tipo;

    @Column(name = "descricao", length = 300, nullable = false)
    private String descricao;

    @Column(name = "valor", precision = 18, scale = 2, nullable = false)
    private BigDecimal valor;

    @Column(name = "vencimento", nullable = false)
    private LocalDate vencimento;

    @Column(name = "status", length = 12, nullable = false)
    private String status;

    @Column(name = "origem", length = 80)
    private String origem;

    @Column(name = "cliente_id", length = 36)
    private String clienteId;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    @Column(name = "pago_em")
    private LocalDateTime pagoEm;

    protected LancamentoFinanceiro() {
    }

    public static LancamentoFinanceiro novo(String tenantId, String tipo, String descricao,
                                            BigDecimal valor, LocalDate vencimento, String origem, String clienteId) {
        LancamentoFinanceiro l = new LancamentoFinanceiro();
        l.id = UUID.randomUUID().toString();
        l.tenantId = tenantId;
        l.tipo = tipo;
        l.descricao = descricao;
        l.valor = valor;
        l.vencimento = vencimento;
        l.status = "ABERTO";
        l.origem = origem;
        l.clienteId = clienteId;
        l.criadoEm = LocalDateTime.now();
        return l;
    }

    public void pagar() {
        this.status = "PAGO";
        this.pagoEm = LocalDateTime.now();
    }

    public boolean estaAberto() {
        return "ABERTO".equals(status);
    }

    public boolean estaVencido() {
        return estaAberto() && vencimento.isBefore(LocalDate.now());
    }

    public String getId() {
        return id;
    }

    public String getTipo() {
        return tipo;
    }

    public String getDescricao() {
        return descricao;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public LocalDate getVencimento() {
        return vencimento;
    }

    public String getStatus() {
        return status;
    }

    public String getOrigem() {
        return origem;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
