package com.kairos.erp.audit.app;

import com.kairos.erp.audit.domain.EventoAuditoria;
import com.kairos.erp.audit.domain.EventoAuditoriaRepository;
import com.kairos.erp.shared.tenant.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Registro e consulta da trilha de auditoria (etapa 053 · KCD).
 *
 * <p>Ao registrar, resolve automaticamente o tenant ({@link TenantContext}) e o
 * usuário autenticado (do token de segurança). Ações sem contexto de requisição
 * (ex.: seed) são registradas com usuário nulo. É um componente transversal, por
 * isso pode ler o contexto de segurança diretamente.</p>
 */
@Service
public class AuditoriaService {

    private final EventoAuditoriaRepository repository;

    public AuditoriaService(EventoAuditoriaRepository repository) {
        this.repository = repository;
    }

    /** Registra uma ação do usuário autenticado sobre um recurso do tenant corrente. */
    @Transactional
    public void registrar(String acao, String recursoTipo, String recursoId, String detalhe) {
        String usuarioId = null;
        String usuarioEmail = null;
        String usuarioNome = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwt) {
            usuarioId = jwt.getToken().getSubject();
            usuarioEmail = jwt.getToken().getClaimAsString("email");
            usuarioNome = jwt.getToken().getClaimAsString("nome");
        }
        String tenant = TenantContext.get();
        if (tenant == null) {
            return; // sem tenant não há a quem atribuir a trilha
        }
        repository.save(EventoAuditoria.de(tenant, usuarioId, usuarioEmail, usuarioNome, acao, recursoTipo,
                recursoId, detalhe, ipDaRequisicao(), telaDaRequisicao()));
    }

    /** IP de origem da requisição corrente (respeita X-Forwarded-For), se houver. */
    private static String ipDaRequisicao() {
        HttpServletRequest req = requisicao();
        if (req == null) {
            return null;
        }
        String fwd = req.getHeader("X-Forwarded-For");
        if (fwd != null && !fwd.isBlank()) {
            return fwd.split(",")[0].trim();
        }
        return req.getRemoteAddr();
    }

    /** Tela/menu de origem — enviado pelo frontend no cabeçalho X-Tela. */
    private static String telaDaRequisicao() {
        HttpServletRequest req = requisicao();
        return req == null ? null : req.getHeader("X-Tela");
    }

    private static HttpServletRequest requisicao() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            return attrs.getRequest();
        }
        return null;
    }

    /**
     * Registro explícito (ex.: login, quando ainda não há contexto de segurança).
     * Em transação própria ({@code REQUIRES_NEW}): a trilha de segurança persiste
     * mesmo quando a operação que a originou falha (ex.: login inválido faz
     * rollback do fluxo, mas o evento LOGIN_FALHOU precisa ficar registrado).
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarExplicito(String tenantId, String usuarioId, String usuarioEmail,
                                   String acao, String recursoTipo, String recursoId, String detalhe) {
        repository.save(EventoAuditoria.de(tenantId, usuarioId, usuarioEmail, acao, recursoTipo, recursoId, detalhe));
    }

    @Transactional(readOnly = true)
    public List<EventoAuditoria> recentes(int limite) {
        return repository.findByTenantIdOrderByOcorridoEmDesc(TenantContext.require(), PageRequest.of(0, limite));
    }

    /** Eventos num intervalo (para o relatório/PDF por período ou semana). */
    @Transactional(readOnly = true)
    public List<EventoAuditoria> noIntervalo(LocalDateTime inicio, LocalDateTime fim) {
        return repository.findByTenantIdAndOcorridoEmBetweenOrderByOcorridoEmDesc(
                TenantContext.require(), inicio, fim);
    }
}
