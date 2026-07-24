package com.kairos.erp.equipment.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Equipamento (drone) — a âncora de rastreabilidade da plataforma.
 * O {@code serialNumber} é a identidade universal e vitalícia do equipamento.
 */
@Entity
@Table(name = "equipamento")
public class Equipamento {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "serial_number", length = 100, nullable = false)
    private String serialNumber;

    @Column(name = "modelo", length = 120, nullable = false)
    private String modelo;

    @Column(name = "fabricante", length = 120)
    private String fabricante;

    @Column(name = "status", length = 30, nullable = false)
    private String status;

    /** Tipo do detentor atual da posse/custódia (FABRICANTE, REVENDA, CLIENTE). */
    @Column(name = "posse_tipo", length = 30)
    private String posseTipo;

    /** Nome do detentor atual da posse/custódia. */
    @Column(name = "posse_nome", length = 200)
    private String posseNome;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected Equipamento() {
    }

    public static Equipamento registrar(String tenantId, String serialNumber, String modelo, String fabricante) {
        Equipamento e = new Equipamento();
        e.id = UUID.randomUUID().toString();
        e.tenantId = tenantId;
        e.serialNumber = serialNumber;
        e.modelo = modelo;
        e.fabricante = fabricante;
        e.status = "ATIVO";
        // Posse inicial é do fabricante que o cadastrou (quando informado).
        if (fabricante != null && !fabricante.isBlank()) {
            e.posseTipo = "FABRICANTE";
            e.posseNome = fabricante;
        }
        e.criadoEm = LocalDateTime.now();
        return e;
    }

    /** Transfere a posse/custódia do equipamento para um novo detentor. */
    public void transferir(String tipo, String nome) {
        this.posseTipo = tipo;
        this.posseNome = nome;
    }

    public String getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getSerialNumber() {
        return serialNumber;
    }

    public String getModelo() {
        return modelo;
    }

    public String getFabricante() {
        return fabricante;
    }

    public String getStatus() {
        return status;
    }

    public String getPosseTipo() {
        return posseTipo;
    }

    public String getPosseNome() {
        return posseNome;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
