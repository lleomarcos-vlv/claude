package com.kairos.erp.identity.app;

import com.kairos.erp.audit.app.AuditoriaService;
import com.kairos.erp.identity.domain.Usuario;
import com.kairos.erp.identity.domain.UsuarioRepository;
import com.kairos.erp.shared.error.CredenciaisInvalidasException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Autenticação por e-mail/senha, com proteção anti-brute-force e emissão de
 * token de acesso + refresh token. Falhas resultam sempre na mesma resposta
 * genérica (401) para não revelar quais e-mails existem.
 */
@Service
public class AutenticacaoService {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final AuditoriaService auditoria;
    private final LoginRateLimiter rateLimiter;
    private final JwtDecoder jwtDecoder;

    public AutenticacaoService(UsuarioRepository usuarios, PasswordEncoder passwordEncoder,
                               TokenService tokenService, AuditoriaService auditoria,
                               LoginRateLimiter rateLimiter, JwtDecoder jwtDecoder) {
        this.usuarios = usuarios;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.auditoria = auditoria;
        this.rateLimiter = rateLimiter;
        this.jwtDecoder = jwtDecoder;
    }

    public record Autenticacao(Usuario usuario, String token, String refreshToken) {
    }

    @Transactional
    public Autenticacao login(String email, String senha) {
        rateLimiter.verificar(email);

        Usuario usuario = usuarios.findByEmail(email == null ? null : email.trim().toLowerCase())
                .orElse(null);

        if (usuario == null || !usuario.isAtivo() || !passwordEncoder.matches(senha, usuario.getSenhaHash())) {
            rateLimiter.registrarFalha(email);
            if (usuario != null) {
                auditoria.registrarExplicito(usuario.getTenantId(), usuario.getId(), usuario.getEmail(),
                        "LOGIN_FALHOU", "sessao", null, "credenciais inválidas");
            }
            throw new CredenciaisInvalidasException();
        }

        rateLimiter.registrarSucesso(email);
        auditoria.registrarExplicito(usuario.getTenantId(), usuario.getId(), usuario.getEmail(),
                "LOGIN", "sessao", null, null);
        return new Autenticacao(usuario, tokenService.gerar(usuario), tokenService.gerarRefresh(usuario));
    }

    /** Troca um refresh token válido por um novo token de acesso. */
    @Transactional(readOnly = true)
    public Autenticacao renovar(String refreshToken) {
        Jwt jwt;
        try {
            jwt = jwtDecoder.decode(refreshToken);
        } catch (JwtException e) {
            throw new CredenciaisInvalidasException();
        }
        if (!"refresh".equals(jwt.getClaimAsString("typ"))) {
            throw new CredenciaisInvalidasException();
        }
        Usuario usuario = usuarios.findById(jwt.getSubject())
                .filter(Usuario::isAtivo)
                .orElseThrow(CredenciaisInvalidasException::new);
        return new Autenticacao(usuario, tokenService.gerar(usuario), tokenService.gerarRefresh(usuario));
    }
}
