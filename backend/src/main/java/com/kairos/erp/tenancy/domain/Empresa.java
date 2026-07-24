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

    @Column(name = "email", length = 160)
    private String email;

    @Column(name = "telefone", length = 40)
    private String telefone;

    @Column(name = "endereco", length = 300)
    private String endereco;

    @Column(name = "site", length = 200)
    private String site;

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

    public String getEmail() {
        return email;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getEndereco() {
        return endereco;
    }

    public String getSite() {
        return site;
    }

    /** Define/atualiza os dados de contato institucionais do tenant. */
    public void definirContato(String email, String telefone, String endereco, String site) {
        this.email = email;
        this.telefone = telefone;
        this.endereco = endereco;
        this.site = site;
    }
}
