package com.kairos.erp.inventory.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ItemEstoqueRepository extends JpaRepository<ItemEstoque, String> {

    Optional<ItemEstoque> findByIdAndTenantId(String id, String tenantId);

    boolean existsByTenantIdAndSku(String tenantId, String sku);
}
