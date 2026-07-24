package com.kairos.erp.kci.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Base de conhecimento da IA (importável): problema → causa → como resolver →
 * sugestão. Alimenta as recomendações do co-piloto da oficina.
 */
@Entity
@Table(name = "conhecimento_ia")
public class ConhecimentoIa {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "problema", length = 500, nullable = false)
    private String problema;

    @Column(name = "causa", length = 1000)
    private String causa;

    @Column(name = "solucao", length = 1000)
    private String solucao;

    @Column(name = "sugestao", length = 1000)
    private String sugestao;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected ConhecimentoIa() {
    }

    public static ConhecimentoIa novo(String tenantId, String problema, String causa,
                                      String solucao, String sugestao) {
        ConhecimentoIa c = new ConhecimentoIa();
        c.id = UUID.randomUUID().toString();
        c.tenantId = tenantId;
        c.problema = problema;
        c.causa = causa;
        c.solucao = solucao;
        c.sugestao = sugestao;
        c.criadoEm = LocalDateTime.now();
        return c;
    }

    public String getId() {
        return id;
    }

    public String getProblema() {
        return problema;
    }

    public String getCausa() {
        return causa;
    }

    public String getSolucao() {
        return solucao;
    }

    public String getSugestao() {
        return sugestao;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
