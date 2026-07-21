package com.kairos.erp.shared.tenant;

import com.kairos.erp.tenancy.domain.EmpresaRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Resolve e valida o tenant (empresa) de cada requisição a partir do header
 * configurado (por padrão {@code X-Tenant-Id}).
 *
 * <p>Rotas públicas (não exigem tenant): criação de empresa, health e actuator.
 * Para as demais, um tenant válido e ativo é obrigatório — caso contrário a
 * requisição é rejeitada com 400/403.</p>
 */
@Component
public class TenantFilter extends OncePerRequestFilter {

    private final EmpresaRepository empresaRepository;
    private final String tenantHeader;

    public TenantFilter(EmpresaRepository empresaRepository,
                        @Value("${kairos.api.tenant-header:X-Tenant-Id}") String tenantHeader) {
        this.empresaRepository = empresaRepository;
        this.tenantHeader = tenantHeader;
    }

    private boolean isPublic(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.startsWith("/actuator")) {
            return true;
        }
        if (path.equals("/api/v1/health")) {
            return true;
        }
        // Provisionamento de empresa é ação de plataforma (sem tenant).
        return HttpMethod.POST.matches(request.getMethod()) && path.equals("/api/v1/empresas");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        if (isPublic(request)) {
            chain.doFilter(request, response);
            return;
        }

        String tenantId = request.getHeader(tenantHeader);
        if (tenantId == null || tenantId.isBlank()) {
            reject(response, HttpServletResponse.SC_BAD_REQUEST,
                    "Header " + tenantHeader + " é obrigatório");
            return;
        }
        if (!empresaRepository.existsByIdAndAtivoTrue(tenantId)) {
            reject(response, HttpServletResponse.SC_FORBIDDEN,
                    "Tenant inválido ou inativo");
            return;
        }

        try {
            TenantContext.set(tenantId);
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private void reject(HttpServletResponse response, int status, String detail) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write("{\"status\":" + status + ",\"detail\":\"" + detail + "\"}");
    }
}
