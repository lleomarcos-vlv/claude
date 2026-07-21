package com.kairos.erp.equipment.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EquipamentoEventoRepository extends JpaRepository<EquipamentoEvento, String> {

    List<EquipamentoEvento> findByEquipamentoIdOrderBySequenciaAsc(String equipamentoId);

    long countByEquipamentoId(String equipamentoId);
}
