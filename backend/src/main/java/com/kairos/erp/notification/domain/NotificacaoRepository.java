package com.kairos.erp.notification.domain;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificacaoRepository extends JpaRepository<Notificacao, String> {

    List<Notificacao> findByTenantIdOrderByCriadoEmDesc(String tenantId, Pageable pageable);

    List<Notificacao> findByTenantIdAndLidaFalse(String tenantId);

    long countByTenantIdAndLidaFalse(String tenantId);

    Optional<Notificacao> findByIdAndTenantId(String id, String tenantId);
}
