package com.kairos.erp.workorder.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrdemServicoObservacaoRepository extends JpaRepository<OrdemServicoObservacao, String> {

    List<OrdemServicoObservacao> findByOrdemServicoIdOrderByCriadoEmAsc(String ordemServicoId);
}
