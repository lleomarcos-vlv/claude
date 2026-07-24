package com.kairos.erp.equipment.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EquipamentoRepository extends JpaRepository<Equipamento, String> {

    boolean existsBySerialNumber(String serialNumber);

    Optional<Equipamento> findByIdAndTenantId(String id, String tenantId);

    Optional<Equipamento> findBySerialNumberAndTenantId(String serialNumber, String tenantId);

    List<Equipamento> findByTenantIdOrderByCriadoEmDesc(String tenantId);
}
