package com.kairos.erp.shared.demo;

import com.kairos.erp.identity.app.RegistroService;
import com.kairos.erp.identity.app.RegistroService.Registro;
import com.kairos.erp.shared.config.BrandProperties;
import com.kairos.erp.tenancy.app.EmpresaService;
import com.kairos.erp.tenancy.domain.EmpresaRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Onboarding de produção do cliente <strong>geoAG</strong> (Goiânia-GO): cria a
 * empresa (tenant) real e o seu primeiro usuário <strong>ADMIN</strong>, com os
 * dados de contato institucionais. Sem dados fictícios — a equipe (TÉCNICO,
 * CLIENTE) e o estoque são cadastrados depois pela própria gerência, em Usuários.
 *
 * <p>Ativado só com {@code geoag.onboarding.seed=true} (desligado por padrão, para
 * não interferir em testes nem na demo). <strong>Idempotente</strong>: se a
 * empresa já existe (mesmo CNPJ), não faz nada.</p>
 *
 * <p>CNPJ e credenciais vêm de propriedades/variáveis de ambiente
 * ({@code GEOAG_CNPJ}, {@code GEOAG_ADMIN_EMAIL}, {@code GEOAG_ADMIN_SENHA}); os
 * defaults são placeholders — troque-os antes de ir ao ar.</p>
 */
@Component
@ConditionalOnProperty(name = "geoag.onboarding.seed", havingValue = "true")
public class GeoagOnboardingSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(GeoagOnboardingSeeder.class);

    private final EmpresaRepository empresas;
    private final RegistroService registro;
    private final EmpresaService empresaService;
    private final BrandProperties marca;

    @Value("${geoag.empresa.nome:geoAG}")
    private String nomeEmpresa;
    @Value("${geoag.empresa.documento:00.000.000/0001-00}")
    private String documento;
    @Value("${geoag.admin.nome:Administrador geoAG}")
    private String adminNome;
    @Value("${geoag.admin.email:contato@geoag.com.br}")
    private String adminEmail;
    @Value("${geoag.admin.senha:geoag-trocar-esta-senha-2026}")
    private String adminSenha;

    public GeoagOnboardingSeeder(EmpresaRepository empresas, RegistroService registro,
                                 EmpresaService empresaService, BrandProperties marca) {
        this.empresas = empresas;
        this.registro = registro;
        this.empresaService = empresaService;
        this.marca = marca;
    }

    @Override
    public void run(String... args) {
        if (empresas.existsByDocumento(documento)) {
            log.info("[geoag] Empresa {} (CNPJ {}) já existe — onboarding ignorado.",
                    nomeEmpresa, documento);
            return;
        }
        log.info("[geoag] Provisionando cliente {} (Goiânia-GO)…", nomeEmpresa);

        Registro r = registro.registrar(nomeEmpresa, documento, adminNome, adminEmail, adminSenha);
        empresaService.definirContato(r.empresa().getId(),
                marca.getEmail(), marca.getTelefone(), marca.getEndereco(), marca.getSite());

        log.info("[geoag] Pronto. Empresa '{}' criada (tenant {}). ADMIN: {} — "
                        + "TROQUE A SENHA no primeiro acesso.",
                nomeEmpresa, r.empresa().getId(), adminEmail);
    }
}
