package com.kairos.erp.document.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DocumentoRepository extends JpaRepository<Documento, String> {

    List<Documento> findByEquipamentoIdAndTenantIdOrderByCriadoEmDesc(String equipamentoId, String tenantId);

    Optional<Documento> findByIdAndTenantId(String id, String tenantId);
}
