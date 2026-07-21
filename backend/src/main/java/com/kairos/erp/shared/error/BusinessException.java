package com.kairos.erp.shared.error;

/** Violação de regra de negócio (ex.: saldo insuficiente). Mapeado para HTTP 409. */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }
}
