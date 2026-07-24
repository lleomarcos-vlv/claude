package com.kairos.erp.scheduling.domain;

import com.kairos.erp.shared.error.BusinessException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Agendamento autônomo (jornada do cliente Conlor): o cliente escolhe o
 * horário na agenda em tempo real e informa os dados do equipamento
 * (S/N, modelo, nome). Para a gerência é um <strong>lead</strong>: ela
 * confirma a data e distribui a OS para o técnico mais adequado.
 */
@Entity
@Table(name = "agendamento")
public class Agendamento {

    public enum Status { SOLICITADO, CONFIRMADO, RECUSADO }

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    /** Usuário CLIENTE que agendou (quando autenticado). */
    @Column(name = "cliente_id", length = 36)
    private String clienteId;

    @Column(name = "nome_cliente", length = 200, nullable = false)
    private String nomeCliente;

    @Column(name = "telefone", length = 40)
    private String telefone;

    @Column(name = "serial_number", length = 100, nullable = false)
    private String serialNumber;

    @Column(name = "modelo", length = 120, nullable = false)
    private String modelo;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(name = "observacao", length = 500)
    private String observacao;

    @Column(name = "status", length = 20, nullable = false)
    private String status;

    /** OS criada quando a gerência confirma o agendamento. */
    @Column(name = "ordem_servico_id", length = 36)
    private String ordemServicoId;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected Agendamento() {
    }

    public static Agendamento solicitar(String tenantId, String clienteId, String nomeCliente,
                                        String telefone, String serialNumber, String modelo,
                                        LocalDateTime dataHora, String observacao) {
        Agendamento a = new Agendamento();
        a.id = UUID.randomUUID().toString();
        a.tenantId = tenantId;
        a.clienteId = clienteId;
        a.nomeCliente = nomeCliente;
        a.telefone = telefone;
        a.serialNumber = serialNumber;
        a.modelo = modelo;
        a.dataHora = dataHora;
        a.observacao = observacao;
        a.status = Status.SOLICITADO.name();
        a.criadoEm = LocalDateTime.now();
        return a;
    }

    public void confirmar(String ordemServicoId, LocalDateTime dataConfirmada) {
        exigirSolicitado("confirmar");
        if (dataConfirmada != null) {
            this.dataHora = dataConfirmada;
        }
        this.ordemServicoId = ordemServicoId;
        this.status = Status.CONFIRMADO.name();
    }

    public void recusar() {
        exigirSolicitado("recusar");
        this.status = Status.RECUSADO.name();
    }

    private void exigirSolicitado(String acao) {
        if (!Status.SOLICITADO.name().equals(status)) {
            throw new BusinessException("Só é possível " + acao + " um agendamento SOLICITADO");
        }
    }

    public String getId() {
        return id;
    }

    public String getClienteId() {
        return clienteId;
    }

    public String getNomeCliente() {
        return nomeCliente;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public String getModelo() {
        return modelo;
    }

    public LocalDateTime getDataHora() {
        return dataHora;
    }

    public String getObservacao() {
        return observacao;
    }

    public String getStatus() {
        return status;
    }

    public String getOrdemServicoId() {
        return ordemServicoId;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
