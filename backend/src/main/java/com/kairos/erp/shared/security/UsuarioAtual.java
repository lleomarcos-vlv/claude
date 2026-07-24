package com.kairos.erp.shared.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.List;
import java.util.Optional;

/** Acesso ao usuário autenticado da requisição corrente (claims do JWT). */
public final class UsuarioAtual {

    private UsuarioAtual() {
    }

    public static Optional<Jwt> jwt() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken token) {
            return Optional.of(token.getToken());
        }
        return Optional.empty();
    }

    /** Id do usuário (claim {@code sub}) ou {@code null} sem autenticação. */
    public static String id() {
        return jwt().map(Jwt::getSubject).orElse(null);
    }

    public static String nome() {
        return jwt().map(j -> j.getClaimAsString("nome")).orElse(null);
    }

    public static boolean temPerfil(String perfil) {
        return jwt().map(j -> {
            List<String> roles = j.getClaimAsStringList("roles");
            return roles != null && roles.contains(perfil);
        }).orElse(false);
    }
}
