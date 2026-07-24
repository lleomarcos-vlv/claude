package com.kairos.erp.shared.error;

/**
 * Excesso de tentativas (ex.: brute-force de login). Mapeada para HTTP 429.
 */
public class MuitasTentativasException extends RuntimeException {
    public MuitasTentativasException(String message) {
        super(message);
    }
}
