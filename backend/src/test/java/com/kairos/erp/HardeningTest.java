package com.kairos.erp;

import com.fasterxml.jackson.databind.JsonNode;
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

/** Endurecimento para produção: rate-limit, refresh token e health probes. */
@SpringBootTest
@AutoConfigureMockMvc
class HardeningTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    private void loginErrado(String email) throws Exception {
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"senha\":\"errada\"}"));
    }

    @Test
    void bloqueiaAposMuitasTentativas() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        auth.registrarEmpresa("99.100.000/0001-00", "admin@rate.com");

        // 5 tentativas inválidas -> 401; a 6ª é bloqueada -> 429
        for (int i = 0; i < 5; i++) {
            loginErrado("admin@rate.com");
        }
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@rate.com\",\"senha\":\"errada\"}"))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void refreshTokenGeraNovoAcesso() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        auth.registrarEmpresa("99.200.000/0001-00", "admin@refresh.com");

        JsonNode login = json.readTree(mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@refresh.com\",\"senha\":\"" + AuthHelper.SENHA_PADRAO + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.refreshToken").exists())
                .andReturn().getResponse().getContentAsString());
        String refresh = login.get("refreshToken").asText();

        String novo = json.readTree(mvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refresh + "\"}"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).get("token").asText();

        // O novo token de acesso funciona
        mvc.perform(get("/api/v1/usuarios/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + novo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@refresh.com"));

        // Um token de acesso NÃO serve como refresh (typ != refresh) -> 401
        mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + novo + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void healthProbesDisponiveis() throws Exception {
        mvc.perform(get("/actuator/health/liveness")).andExpect(status().isOk());
        mvc.perform(get("/actuator/health/readiness")).andExpect(status().isOk());
    }
}
