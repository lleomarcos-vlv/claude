package com.kairos.erp.identity.app;

import com.kairos.erp.shared.error.MuitasTentativasException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Proteção anti-brute-force do login (KCD): bloqueia um e-mail após N falhas
 * seguidas dentro de uma janela, por um tempo de bloqueio.
 *
 * <p>Estado em memória — adequado a uma instância; numa topologia distribuída
 * migra para um contador compartilhado (ex.: Redis). Determinístico e sem
 * dependências externas.</p>
 */
@Component
public class LoginRateLimiter {

    private final int maxTentativas;
    private final Duration bloqueio;

    private final Map<String, Estado> estados = new ConcurrentHashMap<>();

    public LoginRateLimiter(
            @Value("${kairos.security.login.max-tentativas:5}") int maxTentativas,
            @Value("${kairos.security.login.bloqueio:PT15M}") Duration bloqueio) {
        this.maxTentativas = maxTentativas;
        this.bloqueio = bloqueio;
    }

    private static final class Estado {
        int falhas;
        Instant bloqueadoAte;
    }

    /** Lança 429 se o e-mail estiver bloqueado no momento. */
    public void verificar(String email) {
        Estado e = estados.get(chave(email));
        if (e != null && e.bloqueadoAte != null && Instant.now().isBefore(e.bloqueadoAte)) {
            throw new MuitasTentativasException(
                    "Muitas tentativas de login. Tente novamente mais tarde.");
        }
    }

    public void registrarFalha(String email) {
        Estado e = estados.computeIfAbsent(chave(email), k -> new Estado());
        synchronized (e) {
            e.falhas++;
            if (e.falhas >= maxTentativas) {
                e.bloqueadoAte = Instant.now().plus(bloqueio);
                e.falhas = 0;
            }
        }
    }

    public void registrarSucesso(String email) {
        estados.remove(chave(email));
    }

    private String chave(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
