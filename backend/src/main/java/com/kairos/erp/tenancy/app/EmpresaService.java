package com.kairos.erp.tenancy.app;

import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.tenancy.domain.Empresa;
import com.kairos.erp.tenancy.domain.EmpresaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class EmpresaService {

    private final EmpresaRepository repository;

    public EmpresaService(EmpresaRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Empresa criar(String nome, String documento) {
        if (repository.existsByDocumento(documento)) {
            throw new BusinessException("Já existe uma empresa com o documento " + documento);
        }
        return repository.save(Empresa.nova(nome, documento));
    }
}
