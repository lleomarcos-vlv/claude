package com.kairos.erp.scheduling.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AgendamentoRepository extends JpaRepository<Agendamento, String> {

    List<Agendamento> findByTenantIdOrderByDataHoraAsc(String tenantId);

    List<Agendamento> findByTenantIdAndClienteIdOrderByDataHoraAsc(String tenantId, String clienteId);

    /** Agenda em tempo real: horários dentro de um dia. */
    List<Agendamento> findByTenantIdAndDataHoraBetweenOrderByDataHoraAsc(
            String tenantId, LocalDateTime inicio, LocalDateTime fim);

    Optional<Agendamento> findByIdAndTenantId(String id, String tenantId);
}
