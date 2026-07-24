package com.kairos.erp.inventory.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ItemEstoqueRepository extends JpaRepository<ItemEstoque, String> {

    Optional<ItemEstoque> findByIdAndTenantId(String id, String tenantId);

    boolean existsByTenantIdAndSku(String tenantId, String sku);

    Optional<ItemEstoque> findByTenantIdAndSku(String tenantId, String sku);

    List<ItemEstoque> findByTenantIdOrderBySkuAsc(String tenantId);

    /** Itens do tenant cujo saldo atingiu (ou cruzou) o ponto de reposição — KSI. */
    @Query("select i from ItemEstoque i where i.tenantId = :tenantId and i.saldo <= i.pontoReposicao order by i.sku asc")
    List<ItemEstoque> findParaRepor(@Param("tenantId") String tenantId);
}
