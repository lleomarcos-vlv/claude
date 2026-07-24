package com.kairos.erp;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cobre a etapa 036 (Identidade e Acesso): autenticação, RBAC por perfil e
 * isolamento multiempresa a partir do tenant do token.
 */
@SpringBootTest
@AutoConfigureMockMvc
class IdentidadeEAcessoTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    @Test
    void onboardingSemAdminEhRejeitado() throws Exception {
        mvc.perform(post("/api/v1/empresas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Kairós\",\"documento\":\"60.000.000/0001-00\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginComSenhaErradaRetorna401() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        auth.registrarEmpresa("61.000.000/0001-00", "admin@acesso.com");

        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@acesso.com\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenValidoAcessaOMe() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("62.000.000/0001-00", "admin@me.com").bearer();

        mvc.perform(get("/api/v1/usuarios/me").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@me.com"))
                .andExpect(jsonPath("$.perfil").value("ADMIN"));
    }

    @Test
    void adminCriaUsuarioMasTecnicoNaoPode() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String adminToken = auth.autenticar("63.000.000/0001-00", "admin@rbac.com").bearer();

        // ADMIN cria um técnico (201)
        mvc.perform(post("/api/v1/usuarios").header(HttpHeaders.AUTHORIZATION, adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Téc\",\"email\":\"tecnico@rbac.com\",\"senha\":\"senha-forte-123\",\"perfil\":\"TECNICO\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.perfil").value("TECNICO"));

        // O técnico faz login e NÃO pode criar usuários (403)
        String tecnicoToken = "Bearer " + auth.login("tecnico@rbac.com", AuthHelper.SENHA_PADRAO);
        mvc.perform(post("/api/v1/usuarios").header(HttpHeaders.AUTHORIZATION, tecnicoToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Outro\",\"email\":\"outro@rbac.com\",\"senha\":\"senha-forte-123\",\"perfil\":\"CLIENTE\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void tenantDoTokenIsolaOsDados() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String tokenA = auth.autenticar("64.000.000/0001-00", "admin@iso-a.com").bearer();
        String tokenB = auth.autenticar("65.000.000/0001-00", "admin@iso-b.com").bearer();

        // A registra um equipamento
        String eqId = json.readTree(mvc.perform(post("/api/v1/equipamentos")
                        .header(HttpHeaders.AUTHORIZATION, tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-ISO-1\",\"modelo\":\"KX-10\"}"))
                .andExpect(status().isCreated()).andReturn()
                .getResponse().getContentAsString()).get("id").asText();

        // B, com o próprio token, não enxerga o equipamento de A (404)
        mvc.perform(get("/api/v1/equipamentos/" + eqId).header(HttpHeaders.AUTHORIZATION, tokenB))
                .andExpect(status().isNotFound());

        // A enxerga normalmente
        mvc.perform(get("/api/v1/equipamentos/" + eqId).header(HttpHeaders.AUTHORIZATION, tokenA))
                .andExpect(status().isOk());
    }
}
