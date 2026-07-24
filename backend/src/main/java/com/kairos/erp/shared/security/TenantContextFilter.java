package com.kairos.erp.shared.security;

import com.kairos.erp.shared.tenant.TenantContext;
import com.kairos.erp.tenancy.domain.EmpresaRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Resolve o tenant (empresa) da requisição a partir do <strong>claim
 * {@code tenant_id} do JWT</strong> já autenticado — nunca de um header ou
 * parâmetro do cliente (doc 10, R-T01).
 *
 * <p>Roda depois da autenticação (após o {@code BearerTokenAuthenticationFilter}).
 * Para requisições autenticadas, coloca o tenant no {@link TenantContext} pelo
 * tempo da requisição; se a empresa estiver inativa/ausente, responde 403. Rotas
 * públicas (sem autenticação) simplesmente seguem sem tenant.</p>
 *
 * <p>Não é um {@code @Component}: é instanciado e posicionado explicitamente na
 * cadeia de filtros de segurança para não ser registrado duas vezes.</p>
 */
public class TenantContextFilter extends OncePerRequestFilter {

    private final EmpresaRepository empresaRepository;

    public TenantContextFilter(EmpresaRepository empresaRepository) {
        this.empresaRepository = empresaRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (!(auth instanceof JwtAuthenticationToken jwtAuth)) {
            chain.doFilter(request, response);
            return;
        }

        String tenantId = jwtAuth.getToken().getClaimAsString("tenant_id");
        if (tenantId == null || tenantId.isBlank() || !empresaRepository.existsByIdAndAtivoTrue(tenantId)) {
            reject(response, "Tenant inválido ou inativo");
            return;
        }

        try {
            TenantContext.set(tenantId);
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private void reject(HttpServletResponse response, String detail) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"status\":403,\"detail\":\"" + detail + "\"}");
    }
}
