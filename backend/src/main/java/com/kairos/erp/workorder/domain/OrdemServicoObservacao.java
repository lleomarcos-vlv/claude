package com.kairos.erp.workorder.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Observação/comentário interno de uma OS (aba "Sugestões"). Técnicos e o
 * administrativo registram anotações; algumas podem ser marcadas como visíveis
 * ao cliente (viram mensagens amigáveis na linha do tempo dele).
 */
@Entity
@Table(name = "ordem_servico_observacao")
public class OrdemServicoObservacao {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "ordem_servico_id", length = 36, nullable = false)
    private String ordemServicoId;

    @Column(name = "autor_id", length = 36)
    private String autorId;

    @Column(name = "autor_nome", length = 200)
    private String autorNome;

    @Column(name = "texto", length = 2000, nullable = false)
    private String texto;

    @Column(name = "visivel_cliente", nullable = false)
    private boolean visivelCliente;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected OrdemServicoObservacao() {
    }

    public static OrdemServicoObservacao nova(String tenantId, String ordemServicoId, String autorId,
                                              String autorNome, String texto, boolean visivelCliente) {
        OrdemServicoObservacao o = new OrdemServicoObservacao();
        o.id = UUID.randomUUID().toString();
        o.tenantId = tenantId;
        o.ordemServicoId = ordemServicoId;
        o.autorId = autorId;
        o.autorNome = autorNome;
        o.texto = texto;
        o.visivelCliente = visivelCliente;
        o.criadoEm = LocalDateTime.now();
        return o;
    }

    public String getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getOrdemServicoId() {
        return ordemServicoId;
    }

    public String getAutorId() {
        return autorId;
    }

    public String getAutorNome() {
        return autorNome;
    }

    public String getTexto() {
        return texto;
    }

    public boolean isVisivelCliente() {
        return visivelCliente;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
