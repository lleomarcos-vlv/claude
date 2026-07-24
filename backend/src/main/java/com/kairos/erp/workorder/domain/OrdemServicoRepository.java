package com.kairos.erp.workorder.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, String> {

    Optional<OrdemServico> findByIdAndTenantId(String id, String tenantId);

    long countByTenantId(String tenantId);

    List<OrdemServico> findByTenantIdOrderByAbertaEmDesc(String tenantId);

    /** OSs do cliente (tracking pelo app). */
    List<OrdemServico> findByTenantIdAndClienteIdOrderByAbertaEmDesc(String tenantId, String clienteId);

    /** OSs distribuídas ao técnico (execução focada). */
    List<OrdemServico> findByTenantIdAndTecnicoIdOrderByAbertaEmDesc(String tenantId, String tecnicoId);

    /** OSs para o técnico: as suas + as ainda não distribuídas (fila). */
    @Query("select o from OrdemServico o where o.tenantId = :tenant "
            + "and (o.tecnicoId = :tecnico or o.tecnicoId is null) order by o.abertaEm desc")
    List<OrdemServico> findParaTecnico(@Param("tenant") String tenant, @Param("tecnico") String tecnico);
}
