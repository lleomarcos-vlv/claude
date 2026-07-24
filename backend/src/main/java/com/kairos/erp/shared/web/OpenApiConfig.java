package com.kairos.erp.shared.web;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Contrato OpenAPI 3 da API pública v1 (etapa 054). Declara o esquema de
 * autenticação Bearer (JWT) para que o Swagger UI permita testar rotas
 * protegidas com o token obtido em {@code /auth/login}.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI kairosOpenAPI() {
        final String esquema = "bearer-jwt";
        return new OpenAPI()
                .info(new Info()
                        .title("Drone Kairós ERP — API")
                        .version("v1")
                        .description("""
                                API do núcleo do ERP: identidade/acesso (JWT + RBAC), equipamentos por
                                Serial Number, histórico vitalício, ordens de serviço, estoque (KSI) e
                                auditoria. Autentique-se em POST /api/v1/auth/login, copie o token e
                                clique em "Authorize" para testar as rotas protegidas."""))
                .components(new Components().addSecuritySchemes(esquema,
                        new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(esquema));
    }
}
