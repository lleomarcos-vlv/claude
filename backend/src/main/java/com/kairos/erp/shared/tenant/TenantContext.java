package com.kairos.erp.shared.tenant;

/**
 * Contexto de tenant (empresa) da requisição corrente.
 *
 * <p>Walking skeleton: isolamento multiempresa em nível de aplicação — cada
 * requisição carrega o {@code tenantId} resolvido pelo {@link TenantFilter} e
 * todos os repositórios filtram por ele. Na evolução (doc 08/14) isto será
 * reforçado por Row-Level Security no PostgreSQL.</p>
 */
public final class TenantContext {

    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private TenantContext() {
    }

    public static void set(String tenantId) {
        CURRENT.set(tenantId);
    }

    public static String get() {
        return CURRENT.get();
    }

    /** Retorna o tenant atual ou lança se ausente (falha segura). */
    public static String require() {
        String tenant = CURRENT.get();
        if (tenant == null || tenant.isBlank()) {
            throw new IllegalStateException("Nenhum tenant no contexto da requisição");
        }
        return tenant;
    }

    public static void clear() {
        CURRENT.remove();
    }
}
