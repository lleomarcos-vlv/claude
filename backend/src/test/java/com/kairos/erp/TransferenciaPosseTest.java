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

/** Transferência de posse por Serial Number (RF-022): custódia + evento no histórico. */
@SpringBootTest
@AutoConfigureMockMvc
class TransferenciaPosseTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    @Test
    void transferePosseERegistraNoHistorico() throws Exception {
        String token = new AuthHelper(mvc, json).autenticar("71.000.000/0001-00", "admin@posse.com").bearer();

        String eqId = json.readTree(mvc.perform(post("/api/v1/equipamentos")
                        .header(HttpHeaders.AUTHORIZATION, token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-POSSE-1\",\"modelo\":\"KX-10\",\"fabricante\":\"Kairós\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.posseTipo").value("FABRICANTE"))
                .andExpect(jsonPath("$.posseNome").value("Kairós"))
                .andReturn().getResponse().getContentAsString()).get("id").asText();

        // Transfere para uma revenda
        mvc.perform(post("/api/v1/equipamentos/" + eqId + "/transferencias")
                        .header(HttpHeaders.AUTHORIZATION, token).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"paraTipo\":\"REVENDA\",\"paraNome\":\"Drones SP\",\"observacao\":\"venda\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.posseTipo").value("REVENDA"))
                .andExpect(jsonPath("$.posseNome").value("Drones SP"));

        // Histórico: REGISTRO seguido de TRANSFERENCIA
        mvc.perform(get("/api/v1/equipamentos/" + eqId + "/historico").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].tipo").value("REGISTRO"))
                .andExpect(jsonPath("$[1].tipo").value("TRANSFERENCIA"));
    }
}
