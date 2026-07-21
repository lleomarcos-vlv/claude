package com.kairos.erp.shared.error;

/** Recurso não encontrado no tenant corrente. Mapeado para HTTP 404. */
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
