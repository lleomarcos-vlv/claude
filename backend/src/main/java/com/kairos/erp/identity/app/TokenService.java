package com.kairos.erp.identity.app;

import com.kairos.erp.identity.domain.Perfil;
import com.kairos.erp.identity.domain.Usuario;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Emite o token de acesso (JWT) de um usuário autenticado.
 *
 * <p>O token carrega o {@code sub} (id do usuário), o {@code tenant_id} (empresa)
 * e os {@code roles} (perfil) — é ele, e não um header do cliente, que resolve o
 * tenant e a autorização (doc 10, R-T01/R-S01). Assinatura HS256 com segredo
 * simétrico configurável. Na evolução, migra-se para OIDC/JWKS + MFA (doc 14).</p>
 */
@Service
public class TokenService {

    private final JwtEncoder encoder;
    private final String issuer;
    private final Duration ttl;
    private final Duration refreshTtl;

    public TokenService(JwtEncoder encoder,
                        @Value("${kairos.security.jwt.issuer:kairos-erp}") String issuer,
                        @Value("${kairos.security.jwt.ttl:PT8H}") Duration ttl,
                        @Value("${kairos.security.jwt.refresh-ttl:P7D}") Duration refreshTtl) {
        this.encoder = encoder;
        this.issuer = issuer;
        this.ttl = ttl;
        this.refreshTtl = refreshTtl;
    }

    /** Instante de expiração de um token emitido agora (útil para a resposta de login). */
    public Instant expiraEm(Instant emitidoEm) {
        return emitidoEm.plus(ttl);
    }

    public Duration ttl() {
        return ttl;
    }

    public String gerar(Usuario usuario) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiresAt(now.plus(ttl))
                .subject(usuario.getId())
                .claim("tenant_id", usuario.getTenantId())
                .claim("email", usuario.getEmail())
                .claim("nome", usuario.getNome())
                .claim("roles", rolesDe(usuario))
                .claim("typ", "access")
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }

    /** DEV recebe também o papel ADMIN (acesso total); os demais, só o próprio. */
    private static List<String> rolesDe(Usuario usuario) {
        if (usuario.getPerfil() == Perfil.DEV) {
            return List.of("DEV", "ADMIN");
        }
        return List.of(usuario.getPerfil().name());
    }

    /** Refresh token de vida longa: só serve para obter novos tokens de acesso. */
    public String gerarRefresh(Usuario usuario) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiresAt(now.plus(refreshTtl))
                .subject(usuario.getId())
                .claim("tenant_id", usuario.getTenantId())
                .claim("typ", "refresh")
                .build();
        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        return encoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();
    }
}
