package com.kairos.erp.tenancy.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmpresaRepository extends JpaRepository<Empresa, String> {

    boolean existsByIdAndAtivoTrue(String id);

    boolean existsByDocumento(String documento);
}
