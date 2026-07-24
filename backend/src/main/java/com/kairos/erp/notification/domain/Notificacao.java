package com.kairos.erp.notification.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/** Notificação in-app de um tenant, gerada por um evento do domínio (etapa 051). */
@Entity
@Table(name = "notificacao")
public class Notificacao {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "tipo", length = 40, nullable = false)
    private String tipo;

    @Column(name = "mensagem", length = 300, nullable = false)
    private String mensagem;

    @Column(name = "lida", nullable = false)
    private boolean lida;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected Notificacao() {
    }

    public static Notificacao nova(String tenantId, String tipo, String mensagem) {
        Notificacao n = new Notificacao();
        n.id = UUID.randomUUID().toString();
        n.tenantId = tenantId;
        n.tipo = tipo;
        n.mensagem = mensagem;
        n.lida = false;
        n.criadoEm = LocalDateTime.now();
        return n;
    }

    public void marcarLida() {
        this.lida = true;
    }

    public String getId() {
        return id;
    }

    public String getTipo() {
        return tipo;
    }

    public String getMensagem() {
        return mensagem;
    }

    public boolean isLida() {
        return lida;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
