package com.kairos.erp.kci.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConhecimentoIaRepository extends JpaRepository<ConhecimentoIa, String> {

    List<ConhecimentoIa> findByTenantIdOrderByCriadoEmDesc(String tenantId);
}
