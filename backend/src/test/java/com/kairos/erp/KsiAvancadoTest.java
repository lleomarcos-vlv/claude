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
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** KSI avançado: movimentações por item e Curva ABC por consumo (072/074). */
@SpringBootTest
@AutoConfigureMockMvc
class KsiAvancadoTest {

    @Autowired
    MockMvc mvc;
    @Autowired
    ObjectMapper json;

    private String id(MvcResult r) throws Exception {
        return json.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }

    @Test
    void movimentacoesEClassificacaoAbcPorConsumo() throws Exception {
        AuthHelper auth = new AuthHelper(mvc, json);
        String token = auth.autenticar("72.000.000/0001-00", "admin@ksi.com").bearer();

        String eq = id(mvc.perform(post("/api/v1/equipamentos").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serialNumber\":\"SN-KSI-1\",\"modelo\":\"KX-10\"}"))
                .andExpect(status().isCreated()).andReturn());

        String helice = id(mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"HELICE\",\"descricao\":\"Hélice\",\"saldoInicial\":10,\"pontoReposicao\":2}"))
                .andExpect(status().isCreated()).andReturn());
        mvc.perform(post("/api/v1/estoque/itens").header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sku\":\"BATERIA\",\"descricao\":\"Bateria\",\"saldoInicial\":10,\"pontoReposicao\":2}"))
                .andExpect(status().isCreated());

        // Consome 5 hélices via OS (fluxo por estágios) -> gera SAIDA
        String os = auth.abrirOs(token, eq, "t");
        auth.concluirFluxo(token, os, helice, "5");

        // Movimentações da hélice: saldo inicial (ENTRADA) + baixa da OS (SAIDA)
        mvc.perform(get("/api/v1/estoque/itens/" + helice + "/movimentacoes").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.tipo=='SAIDA')]").exists())
                .andExpect(jsonPath("$[?(@.tipo=='ENTRADA')]").exists());

        // Curva ABC: hélice concentra 100% do consumo -> classe A; bateria sem consumo -> C
        mvc.perform(get("/api/v1/estoque/itens/abc").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].sku").value("HELICE"))
                .andExpect(jsonPath("$[0].classe").value("A"))
                .andExpect(jsonPath("$[?(@.sku=='BATERIA')].classe").value("C"));
    }
}
