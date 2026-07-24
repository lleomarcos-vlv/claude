package com.kairos.erp.shared.error;

/**
 * Falha de autenticação (e-mail/senha inválidos ou usuário inativo).
 * Mapeada para HTTP 401. A mensagem é propositalmente genérica para não revelar
 * se o e-mail existe (doc 14, boas práticas de IAM).
 */
public class CredenciaisInvalidasException extends RuntimeException {
    public CredenciaisInvalidasException() {
        super("Credenciais inválidas");
    }
}
