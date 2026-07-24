package com.kairos.erp.notification.app;

import com.kairos.erp.notification.domain.Notificacao;
import com.kairos.erp.notification.domain.NotificacaoRepository;
import com.kairos.erp.shared.error.NotFoundException;
import com.kairos.erp.shared.tenant.TenantContext;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Notificações in-app por tenant (etapa 051). Serviços do domínio chamam
 * {@link #registrar} quando algo relevante acontece; a UI consome via API.
 */
@Service
public class NotificacaoService {

    private final NotificacaoRepository repository;

    public NotificacaoService(NotificacaoRepository repository) {
        this.repository = repository;
    }

    /** Cria uma notificação para o tenant corrente. Silenciosa se não houver tenant. */
    @Transactional
    public void registrar(String tipo, String mensagem) {
        String tenant = TenantContext.get();
        if (tenant == null) {
            return;
        }
        repository.save(Notificacao.nova(tenant, tipo, mensagem));
    }

    @Transactional(readOnly = true)
    public List<Notificacao> listar(int limite) {
        return repository.findByTenantIdOrderByCriadoEmDesc(TenantContext.require(), PageRequest.of(0, limite));
    }

    @Transactional(readOnly = true)
    public long naoLidas() {
        return repository.countByTenantIdAndLidaFalse(TenantContext.require());
    }

    @Transactional
    public void marcarLida(String id) {
        Notificacao n = repository.findByIdAndTenantId(id, TenantContext.require())
                .orElseThrow(() -> new NotFoundException("Notificação não encontrada: " + id));
        n.marcarLida();
        repository.save(n);
    }

    @Transactional
    public void marcarTodasLidas() {
        List<Notificacao> pendentes = repository.findByTenantIdAndLidaFalse(TenantContext.require());
        pendentes.forEach(Notificacao::marcarLida);
        repository.saveAll(pendentes);
    }
}
