package com.kairos.erp.document.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Documento anexado a um equipamento (etapa 052): nota fiscal, foto, manual etc.
 * O conteúdo é guardado em base64 (portável entre H2 e PostgreSQL).
 */
@Entity
@Table(name = "documento")
public class Documento {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "equipamento_id", length = 36, nullable = false)
    private String equipamentoId;

    @Column(name = "nome", length = 255, nullable = false)
    private String nome;

    @Column(name = "tipo_conteudo", length = 120, nullable = false)
    private String tipoConteudo;

    @Column(name = "tamanho", nullable = false)
    private long tamanho;

    @Column(name = "conteudo_b64", columnDefinition = "text", nullable = false)
    private String conteudoB64;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected Documento() {
    }

    public static Documento novo(String tenantId, String equipamentoId, String nome,
                                 String tipoConteudo, long tamanho, String conteudoB64) {
        Documento d = new Documento();
        d.id = UUID.randomUUID().toString();
        d.tenantId = tenantId;
        d.equipamentoId = equipamentoId;
        d.nome = nome;
        d.tipoConteudo = tipoConteudo;
        d.tamanho = tamanho;
        d.conteudoB64 = conteudoB64;
        d.criadoEm = LocalDateTime.now();
        return d;
    }

    public String getId() {
        return id;
    }

    public String getEquipamentoId() {
        return equipamentoId;
    }

    public String getNome() {
        return nome;
    }

    public String getTipoConteudo() {
        return tipoConteudo;
    }

    public long getTamanho() {
        return tamanho;
    }

    public String getConteudoB64() {
        return conteudoB64;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
