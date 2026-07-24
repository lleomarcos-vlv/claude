package com.kairos.erp.finance.app;

import com.kairos.erp.audit.app.AuditoriaService;
import com.kairos.erp.finance.domain.LancamentoFinanceiro;
import com.kairos.erp.finance.domain.LancamentoFinanceiroRepository;
import com.kairos.erp.notification.app.NotificacaoService;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.error.NotFoundException;
import com.kairos.erp.shared.tenant.TenantContext;
import com.kairos.erp.workorder.domain.OrdemServico;
import com.kairos.erp.workorder.app.OrdemServicoService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/** Contas a receber/pagar e faturamento (doc 18). */
@Service
public class FinanceiroService {

    private static final Set<String> TIPOS = Set.of("RECEBER", "PAGAR");

    private final LancamentoFinanceiroRepository repository;
    private final OrdemServicoService ordens;
    private final AuditoriaService auditoria;
    private final NotificacaoService notificacoes;

    public FinanceiroService(LancamentoFinanceiroRepository repository, OrdemServicoService ordens,
                             AuditoriaService auditoria, NotificacaoService notificacoes) {
        this.repository = repository;
        this.ordens = ordens;
        this.auditoria = auditoria;
        this.notificacoes = notificacoes;
    }

    @Transactional
    public LancamentoFinanceiro criar(String tipo, String descricao, BigDecimal valor,
                                      LocalDate vencimento, String clienteId) {
        String t = tipo == null ? "" : tipo.trim().toUpperCase();
        if (!TIPOS.contains(t)) {
            throw new BusinessException("Tipo inválido (use RECEBER ou PAGAR): " + tipo);
        }
        if (valor == null || valor.signum() <= 0) {
            throw new BusinessException("Valor deve ser positivo");
        }
        LancamentoFinanceiro l = repository.save(LancamentoFinanceiro.novo(
                TenantContext.require(), t, descricao, valor,
                vencimento == null ? LocalDate.now().plusDays(30) : vencimento, null, clienteId));
        auditoria.registrar("LANCAMENTO_CRIADO", "financeiro", l.getId(), t + " R$ " + valor);
        return l;
    }

    /** Fatura uma OS concluída, gerando uma conta a receber vinculada. */
    @Transactional
    public LancamentoFinanceiro faturarOs(String ordemServicoId, BigDecimal valor, LocalDate vencimento) {
        OrdemServico os = ordens.buscar(ordemServicoId);
        if (!"CONCLUIDA".equals(os.getStatus())) {
            throw new BusinessException("Só é possível faturar uma OS concluída");
        }
        if (valor == null || valor.signum() <= 0) {
            throw new BusinessException("Valor deve ser positivo");
        }
        LancamentoFinanceiro l = repository.save(LancamentoFinanceiro.novo(
                TenantContext.require(), "RECEBER", "Faturamento da OS " + os.getNumero(), valor,
                vencimento == null ? LocalDate.now().plusDays(30) : vencimento, "OS:" + os.getNumero(), null));
        auditoria.registrar("OS_FATURADA", "ordem_servico", os.getId(), os.getNumero() + " R$ " + valor);
        notificacoes.registrar("OS_FATURADA",
                "OS " + os.getNumero() + " faturada (R$ " + valor + ")");
        return l;
    }

    @Transactional
    public LancamentoFinanceiro pagar(String id) {
        LancamentoFinanceiro l = buscar(id);
        if (!l.estaAberto()) {
            throw new BusinessException("Lançamento não está aberto");
        }
        l.pagar();
        repository.save(l);
        auditoria.registrar("LANCAMENTO_PAGO", "financeiro", l.getId(), l.getTipo() + " R$ " + l.getValor());
        return l;
    }

    @Transactional(readOnly = true)
    public LancamentoFinanceiro buscar(String id) {
        return repository.findByIdAndTenantId(id, TenantContext.require())
                .orElseThrow(() -> new NotFoundException("Lançamento não encontrado: " + id));
    }

    @Transactional(readOnly = true)
    public List<LancamentoFinanceiro> listar() {
        return repository.findByTenantIdOrderByVencimentoAsc(TenantContext.require());
    }

    public record Resumo(BigDecimal aReceberAberto, BigDecimal aPagarAberto,
                         BigDecimal recebido, BigDecimal pago, long vencidos) {
    }

    @Transactional(readOnly = true)
    public Resumo resumo() {
        List<LancamentoFinanceiro> todos = listar();
        BigDecimal aReceber = BigDecimal.ZERO, aPagar = BigDecimal.ZERO, recebido = BigDecimal.ZERO, pago = BigDecimal.ZERO;
        long vencidos = 0;
        for (LancamentoFinanceiro l : todos) {
            boolean receber = "RECEBER".equals(l.getTipo());
            if (l.estaAberto()) {
                if (receber) aReceber = aReceber.add(l.getValor());
                else aPagar = aPagar.add(l.getValor());
                if (l.estaVencido()) vencidos++;
            } else if ("PAGO".equals(l.getStatus())) {
                if (receber) recebido = recebido.add(l.getValor());
                else pago = pago.add(l.getValor());
            }
        }
        return new Resumo(aReceber, aPagar, recebido, pago, vencidos);
    }
}
