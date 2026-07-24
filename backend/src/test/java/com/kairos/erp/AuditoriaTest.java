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

/** Auditoria (etapa 053): registra ações relevantes e é consultável só pelo ADMIN. */
@SpringBootTest
@AutoConfigureMockMvc
class AuditoriaTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    @Test
    void registraLoginEEquipamentoEExigeAdminParaConsultar() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String admin = auth.autenticar("70.000.000/0001-00", "admin@aud.com").bearer();

        mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-AUD-1\",\"modelo\":\"KX-10\"}"))
                .andExpect(status().isCreated());

        // A trilha contém o login e o registro do equipamento
        mvc.perform(get("/api/v1/auditoria").header(HttpHeaders.AUTHORIZATION, admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.acao=='EQUIPAMENTO_REGISTRADO')]").exists())
                .andExpect(jsonPath("$[?(@.acao=='LOGIN')]").exists());

        // Técnico não pode consultar a auditoria (403)
        mvc.perform(post("/api/v1/usuarios").header(HttpHeaders.AUTHORIZATION, admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Téc\",\"email\":\"tec@aud.com\",\"senha\":\"senha-forte-123\",\"perfil\":\"TECNICO\"}"))
                .andExpect(status().isCreated());
        String tec = "Bearer " + auth.login("tec@aud.com", AuthHelper.SENHA_PADRAO);
        mvc.perform(get("/api/v1/auditoria").header(HttpHeaders.AUTHORIZATION, tec))
                .andExpect(status().isForbidden());
    }
}
