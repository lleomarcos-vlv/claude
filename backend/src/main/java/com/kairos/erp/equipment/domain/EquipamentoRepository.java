package com.kairos.erp.equipment.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EquipamentoRepository extends JpaRepository<Equipamento, String> {

    boolean existsBySerialNumber(String serialNumber);

    Optional<Equipamento> findByIdAndTenantId(String id, String tenantId);
}
