package com.kairos.erp.finance.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LancamentoFinanceiroRepository extends JpaRepository<LancamentoFinanceiro, String> {

    List<LancamentoFinanceiro> findByTenantIdOrderByVencimentoAsc(String tenantId);

    Optional<LancamentoFinanceiro> findByIdAndTenantId(String id, String tenantId);
}
