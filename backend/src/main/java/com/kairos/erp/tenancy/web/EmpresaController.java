package com.kairos.erp.tenancy.web;

import com.kairos.erp.tenancy.app.EmpresaService;
import com.kairos.erp.tenancy.domain.Empresa;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

/**
 * Provisionamento de empresas (tenants). Rota pública de plataforma:
 * não exige header de tenant.
 */
@RestController
@RequestMapping("/api/v1/empresas")
public class EmpresaController {

    private final EmpresaService service;

    public EmpresaController(EmpresaService service) {
        this.service = service;
    }

    public record CriarEmpresaRequest(
            @NotBlank String nome,
            @NotBlank String documento) {
    }

    public record EmpresaResponse(String id, String nome, String documento, boolean ativo) {
        static EmpresaResponse of(Empresa e) {
            return new EmpresaResponse(e.getId(), e.getNome(), e.getDocumento(), e.isAtivo());
        }
    }

    @PostMapping
    public ResponseEntity<EmpresaResponse> criar(@Valid @RequestBody CriarEmpresaRequest req) {
        Empresa e = service.criar(req.nome(), req.documento());
        return ResponseEntity.status(HttpStatus.CREATED).body(EmpresaResponse.of(e));
    }
}
