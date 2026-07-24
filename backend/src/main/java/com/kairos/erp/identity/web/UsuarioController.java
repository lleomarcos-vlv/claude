package com.kairos.erp.identity.web;

import com.kairos.erp.identity.app.UsuarioService;
import com.kairos.erp.identity.domain.Perfil;
import com.kairos.erp.identity.domain.Usuario;
import com.kairos.erp.shared.error.BusinessException;
import com.kairos.erp.shared.tenant.TenantContext;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Gestão de usuários do tenant (privativa do <strong>ADMIN</strong>): criar,
 * editar, bloquear, reativar, redefinir senha e excluir. Apenas três perfis:
 * ADMIN, TECNICO, CLIENTE. {@code /me} devolve a identidade do autenticado.
 */
@RestController
@RequestMapping("/api/v1/usuarios")
public class UsuarioController {

    private final UsuarioService service;

    public UsuarioController(UsuarioService service) {
        this.service = service;
    }

    public record CriarUsuarioRequest(
            @NotBlank String nome,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, message = "a senha deve ter ao menos 8 caracteres") String senha,
            @NotBlank String perfil) {
    }

    public record EditarUsuarioRequest(String nome, String perfil) {
    }

    public record UsuarioResponse(String id, String nome, String email, String perfil, boolean ativo) {
        static UsuarioResponse of(Usuario u) {
            return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getPerfil().name(), u.isAtivo());
        }
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UsuarioResponse> criar(@Valid @RequestBody CriarUsuarioRequest req) {
        Usuario u = service.criar(TenantContext.require(), req.nome(), req.email(), req.senha(),
                perfilDe(req.perfil()));
        return ResponseEntity.status(HttpStatus.CREATED).body(UsuarioResponse.of(u));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UsuarioResponse> listar() {
        return service.listar(TenantContext.require()).stream().map(UsuarioResponse::of).toList();
    }

    @PostMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse editar(@PathVariable String id, @RequestBody EditarUsuarioRequest req) {
        Perfil perfil = (req.perfil() == null || req.perfil().isBlank()) ? null : perfilDe(req.perfil());
        return UsuarioResponse.of(service.editar(id, req.nome(), perfil));
    }

    @PostMapping("/{id}/bloquear")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse bloquear(@PathVariable String id) {
        return UsuarioResponse.of(service.bloquear(id));
    }

    @PostMapping("/{id}/reativar")
    @PreAuthorize("hasRole('ADMIN')")
    public UsuarioResponse reativar(@PathVariable String id) {
        return UsuarioResponse.of(service.reativar(id));
    }

    @PostMapping("/{id}/redefinir-senha")
    @PreAuthorize("hasRole('ADMIN')")
    public Map<String, String> redefinirSenha(@PathVariable String id) {
        return Map.of("senha", service.redefinirSenha(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> excluir(@PathVariable String id) {
        service.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UsuarioResponse me(@AuthenticationPrincipal Jwt jwt) {
        String perfil = jwt.getClaimAsStringList("roles").stream().findFirst().orElse("");
        return new UsuarioResponse(
                jwt.getSubject(), jwt.getClaimAsString("nome"),
                jwt.getClaimAsString("email"), perfil, true);
    }

    private Perfil perfilDe(String valor) {
        try {
            return Perfil.valueOf(valor.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BusinessException("Perfil inválido: " + valor + " (use ADMIN, TECNICO ou CLIENTE)");
        }
    }
}
