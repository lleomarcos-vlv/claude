package com.kairos.erp.audit.domain;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface EventoAuditoriaRepository extends JpaRepository<EventoAuditoria, String> {

    List<EventoAuditoria> findByTenantIdOrderByOcorridoEmDesc(String tenantId, Pageable pageable);

    List<EventoAuditoria> findByTenantIdAndOcorridoEmBetweenOrderByOcorridoEmDesc(
            String tenantId, LocalDateTime inicio, LocalDateTime fim);
}
