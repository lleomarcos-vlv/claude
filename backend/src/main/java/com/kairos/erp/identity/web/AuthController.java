package com.kairos.erp.identity.web;

import com.kairos.erp.identity.app.AutenticacaoService;
import com.kairos.erp.identity.app.AutenticacaoService.Autenticacao;
import com.kairos.erp.identity.app.TokenService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Autenticação: troca e-mail/senha por um token de acesso (JWT). Rota pública.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AutenticacaoService autenticacao;
    private final TokenService tokenService;

    public AuthController(AutenticacaoService autenticacao, TokenService tokenService) {
        this.autenticacao = autenticacao;
        this.tokenService = tokenService;
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String senha) {
    }

    public record LoginResponse(String token, String refreshToken, String tipo, long expiraEmSegundos,
                                UsuarioAutenticado usuario) {
    }

    public record UsuarioAutenticado(String id, String nome, String email, String perfil, String tenantId) {
    }

    public record RefreshRequest(@NotBlank String refreshToken) {
    }

    public record RefreshResponse(String token, String refreshToken, String tipo, long expiraEmSegundos) {
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest req) {
        Autenticacao auth = autenticacao.login(req.email(), req.senha());
        var u = auth.usuario();
        return new LoginResponse(
                auth.token(),
                auth.refreshToken(),
                "Bearer",
                tokenService.ttl().getSeconds(),
                new UsuarioAutenticado(u.getId(), u.getNome(), u.getEmail(),
                        u.getPerfil().name(), u.getTenantId()));
    }

    @PostMapping("/refresh")
    public RefreshResponse refresh(@Valid @RequestBody RefreshRequest req) {
        Autenticacao auth = autenticacao.renovar(req.refreshToken());
        return new RefreshResponse(auth.token(), auth.refreshToken(), "Bearer",
                tokenService.ttl().getSeconds());
    }
}
