package com.kairos.erp.workorder.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, String> {

    Optional<OrdemServico> findByIdAndTenantId(String id, String tenantId);

    long countByTenantId(String tenantId);

    List<OrdemServico> findByTenantIdOrderByAbertaEmDesc(String tenantId);
}
