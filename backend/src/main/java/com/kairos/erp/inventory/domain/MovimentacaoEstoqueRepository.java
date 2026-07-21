package com.kairos.erp.inventory.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, String> {

    List<MovimentacaoEstoque> findByItemIdOrderByCriadoEmAsc(String itemId);
}
