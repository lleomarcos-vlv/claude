package com.kairos.erp.workorder.domain;

import com.kairos.erp.shared.error.BusinessException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Ordem de Serviço (OS). Agregado que controla o ciclo de vida do serviço
 * técnico sobre um equipamento. A conclusão dispara a baixa das peças e o
 * registro no histórico vitalício do equipamento (orquestrado no serviço de
 * aplicação).
 */
@Entity
@Table(name = "ordem_servico")
public class OrdemServico {

    public enum Status { ABERTA, EM_ANDAMENTO, CONCLUIDA, CANCELADA }

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "numero", length = 30, nullable = false)
    private String numero;

    @Column(name = "equipamento_id", length = 36, nullable = false)
    private String equipamentoId;

    @Column(name = "status", length = 30, nullable = false)
    private String status;

    @Column(name = "descricao", length = 500)
    private String descricao;

    @Column(name = "aberta_em", nullable = false)
    private LocalDateTime abertaEm;

    @Column(name = "concluida_em")
    private LocalDateTime concluidaEm;

    protected OrdemServico() {
    }

    public static OrdemServico abrir(String tenantId, String numero, String equipamentoId, String descricao) {
        OrdemServico os = new OrdemServico();
        os.id = UUID.randomUUID().toString();
        os.tenantId = tenantId;
        os.numero = numero;
        os.equipamentoId = equipamentoId;
        os.descricao = descricao;
        os.status = Status.ABERTA.name();
        os.abertaEm = LocalDateTime.now();
        return os;
    }

    public void concluir() {
        if (Status.CONCLUIDA.name().equals(status)) {
            throw new BusinessException("Ordem de serviço já concluída: " + numero);
        }
        if (Status.CANCELADA.name().equals(status)) {
            throw new BusinessException("Ordem de serviço cancelada não pode ser concluída: " + numero);
        }
        this.status = Status.CONCLUIDA.name();
        this.concluidaEm = LocalDateTime.now();
    }

    public boolean estaConcluida() {
        return Status.CONCLUIDA.name().equals(status);
    }

    public String getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getNumero() {
        return numero;
    }

    public String getEquipamentoId() {
        return equipamentoId;
    }

    public String getStatus() {
        return status;
    }

    public String getDescricao() {
        return descricao;
    }

    public LocalDateTime getAbertaEm() {
        return abertaEm;
    }

    public LocalDateTime getConcluidaEm() {
        return concluidaEm;
    }
}
