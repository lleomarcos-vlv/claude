package com.kairos.erp.audit.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registro imutável de auditoria (etapa 053 · KCD). Cada linha é um fato
 * ocorrido: quem (usuário), o quê (ação), sobre qual recurso, quando — sempre
 * dentro de um tenant. Trilha append-only, base para o SOC e a conformidade.
 */
@Entity
@Table(name = "evento_auditoria")
public class EventoAuditoria {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "usuario_id", length = 36)
    private String usuarioId;

    @Column(name = "usuario_email", length = 200)
    private String usuarioEmail;

    @Column(name = "usuario_nome", length = 200)
    private String usuarioNome;

    @Column(name = "acao", length = 60, nullable = false)
    private String acao;

    @Column(name = "recurso_tipo", length = 60)
    private String recursoTipo;

    @Column(name = "recurso_id", length = 80)
    private String recursoId;

    @Column(name = "detalhe", length = 500)
    private String detalhe;

    @Column(name = "ip", length = 60)
    private String ip;

    @Column(name = "tela", length = 120)
    private String tela;

    @Column(name = "ocorrido_em", nullable = false)
    private LocalDateTime ocorridoEm;

    protected EventoAuditoria() {
    }

    public static EventoAuditoria de(String tenantId, String usuarioId, String usuarioEmail,
                                     String acao, String recursoTipo, String recursoId, String detalhe) {
        return de(tenantId, usuarioId, usuarioEmail, null, acao, recursoTipo, recursoId, detalhe, null, null);
    }

    public static EventoAuditoria de(String tenantId, String usuarioId, String usuarioEmail, String usuarioNome,
                                     String acao, String recursoTipo, String recursoId, String detalhe,
                                     String ip, String tela) {
        EventoAuditoria e = new EventoAuditoria();
        e.id = UUID.randomUUID().toString();
        e.tenantId = tenantId;
        e.usuarioId = usuarioId;
        e.usuarioEmail = usuarioEmail;
        e.usuarioNome = usuarioNome;
        e.acao = acao;
        e.recursoTipo = recursoTipo;
        e.recursoId = recursoId;
        e.detalhe = detalhe;
        e.ip = ip;
        e.tela = tela;
        e.ocorridoEm = LocalDateTime.now();
        return e;
    }

    public String getId() {
        return id;
    }

    public String getUsuarioEmail() {
        return usuarioEmail;
    }

    public String getUsuarioNome() {
        return usuarioNome;
    }

    public String getAcao() {
        return acao;
    }

    public String getRecursoTipo() {
        return recursoTipo;
    }

    public String getRecursoId() {
        return recursoId;
    }

    public String getDetalhe() {
        return detalhe;
    }

    public String getIp() {
        return ip;
    }

    public String getTela() {
        return tela;
    }

    public LocalDateTime getOcorridoEm() {
        return ocorridoEm;
    }
}
