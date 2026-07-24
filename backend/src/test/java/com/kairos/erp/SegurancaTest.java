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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Hardening de segurança (059/069, KCD): cabeçalhos e auditoria de login falho. */
@SpringBootTest
@AutoConfigureMockMvc
class SegurancaTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    @Test
    void respostasTrazemCabecalhosDeSeguranca() throws Exception {
        mvc.perform(get("/api/v1/health"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().string("Referrer-Policy", "no-referrer"));
    }

    @Test
    void loginFalhoDeUsuarioExistenteEhAuditado() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        auth.registrarEmpresa("59.000.000/0001-00", "admin@seg.com");

        // Senha errada -> 401
        mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@seg.com\",\"senha\":\"errada\"}"))
                .andExpect(status().isUnauthorized());

        // A tentativa falha ficou registrada na auditoria (visível ao ADMIN)
        String token = "Bearer " + auth.login("admin@seg.com", AuthHelper.SENHA_PADRAO);
        mvc.perform(get("/api/v1/auditoria").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.acao=='LOGIN_FALHOU')]").exists());
    }
}
