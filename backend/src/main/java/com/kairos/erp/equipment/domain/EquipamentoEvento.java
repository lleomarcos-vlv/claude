package com.kairos.erp.equipment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Evento do histórico vitalício de um equipamento (append-only).
 * Compõe a trilha imutável exigida pela rastreabilidade por Serial Number.
 */
@Entity
@Table(name = "equipamento_evento")
public class EquipamentoEvento {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "equipamento_id", length = 36, nullable = false)
    private String equipamentoId;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "sequencia", nullable = false)
    private long sequencia;

    @Column(name = "tipo", length = 50, nullable = false)
    private String tipo;

    @Column(name = "descricao", length = 500)
    private String descricao;

    @Column(name = "dados", length = 2000)
    private String dados;

    @Column(name = "ocorrido_em", nullable = false)
    private LocalDateTime ocorridoEm;

    protected EquipamentoEvento() {
    }

    public static EquipamentoEvento de(String tenantId, String equipamentoId, long sequencia,
                                       String tipo, String descricao, String dados) {
        EquipamentoEvento ev = new EquipamentoEvento();
        ev.id = UUID.randomUUID().toString();
        ev.tenantId = tenantId;
        ev.equipamentoId = equipamentoId;
        ev.sequencia = sequencia;
        ev.tipo = tipo;
        ev.descricao = descricao;
        ev.dados = dados;
        ev.ocorridoEm = LocalDateTime.now();
        return ev;
    }

    public String getId() {
        return id;
    }

    public String getEquipamentoId() {
        return equipamentoId;
    }

    public long getSequencia() {
        return sequencia;
    }

    public String getTipo() {
        return tipo;
    }

    public String getDescricao() {
        return descricao;
    }

    public String getDados() {
        return dados;
    }

    public LocalDateTime getOcorridoEm() {
        return ocorridoEm;
    }
}
