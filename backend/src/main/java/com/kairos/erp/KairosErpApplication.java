package com.kairos.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Ponto de entrada do backend do Drone Kairós ERP.
 *
 * <p>Arquitetura: monólito modular (DDD) organizado por bounded contexts —
 * {@code tenancy}, {@code equipment}, {@code inventory} (KSI) e {@code workorder}.
 * Ver docs 07 (Arquitetura) e 10 (Backend).</p>
 */
@SpringBootApplication
public class KairosErpApplication {
    public static void main(String[] args) {
        SpringApplication.run(KairosErpApplication.class, args);
    }
}
