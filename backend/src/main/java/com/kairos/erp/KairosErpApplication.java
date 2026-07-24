package com.kairos.erp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Ponto de entrada do backend da Conlor Drones.
 *
 * <p>Arquitetura: monólito modular (DDD) organizado por bounded contexts —
 * {@code identity}, {@code tenancy}, {@code equipment}, {@code inventory} (KSI),
 * {@code workorder}, {@code scheduling}, {@code kci}, {@code finance} e demais.
 * Ver docs 07 (Arquitetura) e 10 (Backend).</p>
 */
@SpringBootApplication
@EnableScheduling
public class KairosErpApplication {
    public static void main(String[] args) {
        SpringApplication.run(KairosErpApplication.class, args);
    }
}
