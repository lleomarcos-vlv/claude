package com.kairos.erp.identity.domain;

/**
 * Perfis de negócio da plataforma (RBAC — doc 06, RF-002).
 *
 * <p>Cada usuário tem exatamente um perfil neste walking skeleton. O perfil vira
 * um papel ({@code ROLE_<PERFIL>}) no token de segurança e é a base das regras de
 * autorização ({@code @PreAuthorize}). Regras contextuais (ABAC) — propriedade do
 * recurso, alçada — entram na evolução conforme doc 10/14.</p>
 */
public enum Perfil {
    /** Desenvolvedor: acesso total + console de solicitações de alteração (gera PDF). */
    DEV,
    /** Administrativo/gerência: governança, aprovações, usuários e configuração. */
    ADMIN,
    /** Técnico da oficina: execução das ordens de serviço e diagnóstico. */
    TECNICO,
    /** Cliente: abertura/acompanhamento dos seus chamados e aprovações. */
    CLIENTE
}
