package com.kairos.erp.identity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Usuário da plataforma, vinculado a uma empresa (tenant) e a um {@link Perfil}.
 *
 * <p>A credencial é guardada apenas como <strong>hash</strong> ({@code senhaHash});
 * a senha em claro nunca é persistida nem logada (doc 10, R-S04). O vínculo
 * {@code tenantId} é a âncora do isolamento multiempresa: o tenant do usuário é o
 * que viaja no token e alimenta o {@code TenantContext} (doc 10, R-T01).</p>
 */
@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "tenant_id", length = 36, nullable = false)
    private String tenantId;

    @Column(name = "nome", length = 200, nullable = false)
    private String nome;

    @Column(name = "email", length = 200, nullable = false)
    private String email;

    @Column(name = "senha_hash", length = 100, nullable = false)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "perfil", length = 30, nullable = false)
    private Perfil perfil;

    @Column(name = "ativo", nullable = false)
    private boolean ativo;

    @Column(name = "criado_em", nullable = false)
    private LocalDateTime criadoEm;

    protected Usuario() {
    }

    /**
     * Cria um usuário já com a senha cifrada. O e-mail é normalizado para
     * minúsculas (login case-insensitive).
     */
    public static Usuario novo(String tenantId, String nome, String email, String senhaHash, Perfil perfil) {
        Usuario u = new Usuario();
        u.id = UUID.randomUUID().toString();
        u.tenantId = tenantId;
        u.nome = nome;
        u.email = email.trim().toLowerCase();
        u.senhaHash = senhaHash;
        u.perfil = perfil;
        u.ativo = true;
        u.criadoEm = LocalDateTime.now();
        return u;
    }

    public void bloquear() {
        this.ativo = false;
    }

    public void reativar() {
        this.ativo = true;
    }

    public void alterarPerfil(Perfil novo) {
        this.perfil = novo;
    }

    public void redefinirSenha(String novoHash) {
        this.senhaHash = novoHash;
    }

    public void renomear(String novoNome) {
        if (novoNome != null && !novoNome.isBlank()) {
            this.nome = novoNome.trim();
        }
    }

    public String getId() {
        return id;
    }

    public String getTenantId() {
        return tenantId;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public Perfil getPerfil() {
        return perfil;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
