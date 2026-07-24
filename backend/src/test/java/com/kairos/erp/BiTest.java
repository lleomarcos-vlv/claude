package com.kairos.erp;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Business Intelligence (076): agrega indicadores do tenant. */
@SpringBootTest
@AutoConfigureMockMvc
class BiTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    private String id(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void indicadoresRefletemOsDadosDoTenant() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("76.000.000/0001-00", "admin@bi.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-BI-1\",\"modelo\":\"KX-10\"}"))
                .andExpect(status().isCreated()).andReturn());
        String item = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"HELICE\",\"descricao\":\"Hélice\",\"saldoInicial\":10,\"pontoReposicao\":2}"))
                .andExpect(status().isCreated()).andReturn());
        String os = auth.abrirOs(token, eq, "t");
        auth.concluirFluxo(token, os, item, "3");

        mvc.perform(get("/api/v1/bi/indicadores").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.equipamentos").value(1))
                .andExpect(jsonPath("$.itens").value(1))
                .andExpect(jsonPath("$.osConcluidas").value(1))
                .andExpect(jsonPath("$.osAbertas").value(0))
                .andExpect(jsonPath("$.curvaAbc.A").value(1))
                .andExpect(jsonPath("$.estoquePorItem[0].sku").value("HELICE"));
    }
}
