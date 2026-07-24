package com.kairos.erp.identity.web;

import com.kairos.erp.identity.app.RegistroService;
import com.kairos.erp.identity.app.RegistroService.Registro;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Onboarding de empresas (tenants). Rota pública de plataforma: cria a empresa e
 * o seu primeiro usuário ADMIN. Depois disso, o acesso é sempre autenticado e o
 * ADMIN provisiona os demais usuários ({@link UsuarioController}).
 */
@RestController
@RequestMapping("/api/v1/empresas")
public class RegistroController {

    private final RegistroService service;

    public RegistroController(RegistroService service) {
        this.service = service;
    }

    public record AdminRequest(
            @NotBlank String nome,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, message = "a senha deve ter ao menos 8 caracteres") String senha) {
    }

    public record RegistrarEmpresaRequest(
            @NotBlank String nome,
            @NotBlank String documento,
            @Valid @jakarta.validation.constraints.NotNull AdminRequest admin) {
    }

    public record EmpresaResponse(String id, String nome, String documento, boolean ativo,
                                  String adminId, String adminEmail) {
    }

    @PostMapping
    public ResponseEntity<EmpresaResponse> registrar(@Valid @RequestBody RegistrarEmpresaRequest req) {
        Registro r = service.registrar(
                req.nome(), req.documento(),
                req.admin().nome(), req.admin().email(), req.admin().senha());
        EmpresaResponse body = new EmpresaResponse(
                r.empresa().getId(), r.empresa().getNome(), r.empresa().getDocumento(),
                r.empresa().isAtivo(), r.admin().getId(), r.admin().getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }
}
