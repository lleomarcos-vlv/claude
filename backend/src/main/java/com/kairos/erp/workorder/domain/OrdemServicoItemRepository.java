package com.kairos.erp.workorder.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdemServicoItemRepository extends JpaRepository<OrdemServicoItem, String> {

    List<OrdemServicoItem> findByOrdemServicoId(String ordemServicoId);
}
