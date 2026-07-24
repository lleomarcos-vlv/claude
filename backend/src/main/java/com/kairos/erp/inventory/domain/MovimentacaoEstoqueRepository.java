package com.kairos.erp.inventory.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MovimentacaoEstoqueRepository extends JpaRepository<MovimentacaoEstoque, String> {

    List<MovimentacaoEstoque> findByItemIdOrderByCriadoEmAsc(String itemId);

    List<MovimentacaoEstoque> findByItemIdOrderByCriadoEmDesc(String itemId);

    /** Consumo (soma das saídas) por item do tenant — uma única consulta (evita N+1). */
    @Query("""
            select m.itemId as itemId, sum(m.quantidade) as total
            from MovimentacaoEstoque m
            where m.tenantId = :tenantId and m.tipo = 'SAIDA'
            group by m.itemId
            """)
    List<ConsumoItem> consumoPorItem(@Param("tenantId") String tenantId);

    /** Projeção do consumo agregado por item. */
    interface ConsumoItem {
        String getItemId();

        java.math.BigDecimal getTotal();
    }
}
