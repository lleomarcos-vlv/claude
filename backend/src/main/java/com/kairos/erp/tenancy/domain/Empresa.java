package com.kairos.erp.tenancy.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Empresa = Tenant. Raiz do isolamento multiempresa da plataforma.
 */
@Entity
@Table(name = "empresa")
public class Empresa {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "nome", length = 200, nullable = false)
    private String nome;

    @Column(name = "documento", length = 40, nullable = false)
    private String documento;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected Empresa() {
    }

    public static Empresa nova(String nome, String documento) {
        Empresa e = new Empresa();
        e.id = UUID.randomUUID().toString();
        e.nome = nome;
        e.documento = documento;
        e.ativo = true;
        e.criadoEm = LocalDateTime.now();
        return e;
    }

    public String getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getDocumento() {
        return documento;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
